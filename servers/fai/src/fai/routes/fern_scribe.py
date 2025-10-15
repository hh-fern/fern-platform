"""Fern Scribe API routes for automated docs improvements."""

from datetime import (
    UTC,
    datetime,
)

from fastapi import (
    Depends,
    HTTPException,
    Request,
)
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fai.app import fai_app
from fai.dependencies import (
    get_db,
    verify_token,
)
from fai.models.db.fern_scribe_db import FernScribeDb
from fai.models.db.slack_context_db import SlackContextDb
from fai.models.types.fern_scribe_types import (
    CreatePRResponse,
    ImprovementStatus,
)
from fai.settings import (
    LOGGER,
    VARIABLES,
)
from fai.utils.docs_improvement.citation_analyzer import rank_citations
from fai.utils.docs_improvement.content_fetcher import DocsContentFetcher
from fai.utils.docs_improvement.improvement_generator import ImprovementGenerator
from fai.utils.docs_improvement.pr_creator import GitHubPRCreator


@fai_app.post(
    "/slack-context/{slack_context_id}/github/create-pr",
    response_model=CreatePRResponse,
    openapi_extra={"x-fern-audiences": ["internal"], "security": [{"bearerAuth": []}]},
)
async def create_docs_improvement_pr(
    slack_context_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Create a GitHub PR to improve docs based on a saved slack context.

    This endpoint:
    1. Fetches the slack context and its citations
    2. Identifies the relevant docs page(s) to improve
    3. Fetches the current content from GitHub
    4. Uses LLM to generate improved content
    5. Creates a GitHub PR with the improvements

    Args:
        slack_context_id: ID of the slack context to create a PR for
        request: FastAPI request object
        db: Database session

    Returns:
        CreatePRResponse with PR details
    """
    try:
        LOGGER.info(f"Creating docs improvement PR for slack_context_id: {slack_context_id}")

        # Check if GITHUB_TOKEN is configured
        if not VARIABLES.GITHUB_TOKEN:
            return JSONResponse(
                status_code=503,
                content=jsonable_encoder(
                    CreatePRResponse(
                        success=False,
                        pr_url=None,
                        error="GitHub token not configured. Please set GITHUB_TOKEN environment variable.",
                        improvement_id=None,
                    )
                ),
            )

        # Step 1: Fetch the slack context
        result = await db.execute(select(SlackContextDb).where(SlackContextDb.id == slack_context_id))
        slack_context = result.scalar_one_or_none()

        if not slack_context:
            return JSONResponse(
                status_code=404,
                content=jsonable_encoder(
                    CreatePRResponse(
                        success=False,
                        pr_url=None,
                        error=f"Slack context not found: {slack_context_id}",
                        improvement_id=None,
                    )
                ),
            )

        # Verify token for the domain
        try:
            await verify_token(request, slack_context.domain)
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content=jsonable_encoder(
                    CreatePRResponse(success=False, pr_url=None, error=e.detail, improvement_id=None)
                ),
            )

        # Check if we already have an improvement record for this context
        existing_result = await db.execute(
            select(FernScribeDb).where(FernScribeDb.slack_context_id == slack_context_id)
        )
        existing_improvement = existing_result.scalar_one_or_none()

        if existing_improvement and existing_improvement.improvement_status == ImprovementStatus.PR_CREATED:
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    CreatePRResponse(
                        success=True,
                        pr_url=existing_improvement.github_pr_url,
                        error=None,
                        improvement_id=existing_improvement.id,
                    )
                ),
            )

        # Step 2: Analyze citations to find the best docs page to improve
        if not slack_context.citations or len(slack_context.citations) == 0:
            return JSONResponse(
                status_code=400,
                content=jsonable_encoder(
                    CreatePRResponse(
                        success=False,
                        pr_url=None,
                        error="No citations found in slack context. Cannot determine which docs page to improve.",
                        improvement_id=None,
                    )
                ),
            )

        ranked_citations = rank_citations(slack_context.citations, slack_context.question)

        if not ranked_citations:
            return JSONResponse(
                status_code=400,
                content=jsonable_encoder(
                    CreatePRResponse(
                        success=False,
                        pr_url=None,
                        error="No valid citations found after ranking.",
                        improvement_id=None,
                    )
                ),
            )

        target_docs_url = ranked_citations[0]  # Use the top-ranked citation
        LOGGER.info(f"Target docs URL: {target_docs_url}")

        # Step 3: Fetch the current content from GitHub
        content_fetcher = DocsContentFetcher(github_token=VARIABLES.GITHUB_TOKEN)
        docs_content = content_fetcher.fetch_content_from_url(target_docs_url, slack_context.domain)

        if not docs_content:
            return JSONResponse(
                status_code=500,
                content=jsonable_encoder(
                    CreatePRResponse(
                        success=False,
                        pr_url=None,
                        error=f"Failed to fetch content from {target_docs_url}",
                        improvement_id=None,
                    )
                ),
            )

        # Extract repo info from the content fetcher
        repo_info = content_fetcher.get_repo_from_domain(slack_context.domain)
        if not repo_info:
            return JSONResponse(
                status_code=500,
                content=jsonable_encoder(
                    CreatePRResponse(
                        success=False,
                        pr_url=None,
                        error=f"Failed to find GitHub repo for domain {slack_context.domain}",
                        improvement_id=None,
                    )
                ),
            )

        repo_owner, repo_name = repo_info

        # Step 4: Generate improved content using LLM
        improvement_generator = ImprovementGenerator()
        improvement_result = await improvement_generator.generate_improvement(
            current_content=docs_content.content,
            question=slack_context.question,
            ideal_response=slack_context.ideal_response,
        )

        if not improvement_result.success:
            return JSONResponse(
                status_code=500,
                content=jsonable_encoder(
                    CreatePRResponse(
                        success=False,
                        pr_url=None,
                        error=f"Failed to generate improvement: {improvement_result.error}",
                        improvement_id=None,
                    )
                ),
            )

        # Step 5: Create GitHub PR
        pr_creator = GitHubPRCreator(github_token=VARIABLES.GITHUB_TOKEN)
        pr_result = pr_creator.create_improvement_pr(
            repo_owner=repo_owner,
            repo_name=repo_name,
            file_path=docs_content.file_path,
            improved_content=improvement_result.improved_content,
            question=slack_context.question,
            ideal_response=slack_context.ideal_response,
            summary=improvement_result.summary,
            slack_context_id=slack_context_id,
        )

        if not pr_result.success:
            # Save failed attempt to database
            if existing_improvement:
                existing_improvement.improvement_status = ImprovementStatus.FAILED
                existing_improvement.updated_at = datetime.now(UTC)
            else:
                now = datetime.now(UTC)
                existing_improvement = FernScribeDb(
                    id=f"fs_{slack_context_id}",
                    slack_context_id=slack_context_id,
                    domain=slack_context.domain,
                    question=slack_context.question,
                    ideal_response=slack_context.ideal_response,
                    citations=slack_context.citations,
                    target_docs_url=target_docs_url,
                    target_repo=f"{repo_owner}/{repo_name}",
                    target_file_path=docs_content.file_path,
                    improvement_status=ImprovementStatus.FAILED,
                    github_pr_url=None,
                    github_branch_name=pr_result.branch_name,
                    original_content_hash=docs_content.content_hash,
                    improvement_summary=improvement_result.summary,
                    created_at=now,
                    updated_at=now,
                )
                db.add(existing_improvement)

            await db.commit()

            return JSONResponse(
                status_code=500,
                content=jsonable_encoder(
                    CreatePRResponse(
                        success=False,
                        pr_url=None,
                        error=f"Failed to create PR: {pr_result.error}",
                        improvement_id=existing_improvement.id,
                    )
                ),
            )

        # Step 6: Save successful improvement to database
        now = datetime.now(UTC)

        if existing_improvement:
            existing_improvement.improvement_status = ImprovementStatus.PR_CREATED
            existing_improvement.github_pr_url = pr_result.pr_url
            existing_improvement.github_branch_name = pr_result.branch_name
            existing_improvement.pr_created_at = now
            existing_improvement.updated_at = now
            existing_improvement.target_docs_url = target_docs_url
            existing_improvement.target_repo = f"{repo_owner}/{repo_name}"
            existing_improvement.target_file_path = docs_content.file_path
            existing_improvement.original_content_hash = docs_content.content_hash
            existing_improvement.improvement_summary = improvement_result.summary
        else:
            existing_improvement = FernScribeDb(
                id=f"fs_{slack_context_id}",
                slack_context_id=slack_context_id,
                domain=slack_context.domain,
                question=slack_context.question,
                ideal_response=slack_context.ideal_response,
                citations=slack_context.citations,
                target_docs_url=target_docs_url,
                target_repo=f"{repo_owner}/{repo_name}",
                target_file_path=docs_content.file_path,
                improvement_status=ImprovementStatus.PR_CREATED,
                github_pr_url=pr_result.pr_url,
                github_branch_name=pr_result.branch_name,
                original_content_hash=docs_content.content_hash,
                improvement_summary=improvement_result.summary,
                created_at=now,
                updated_at=now,
                pr_created_at=now,
            )
            db.add(existing_improvement)

        await db.commit()

        LOGGER.info(f"Successfully created PR: {pr_result.pr_url}")

        return JSONResponse(
            status_code=200,
            content=jsonable_encoder(
                CreatePRResponse(
                    success=True,
                    pr_url=pr_result.pr_url,
                    error=None,
                    improvement_id=existing_improvement.id,
                )
            ),
        )

    except Exception as e:
        LOGGER.error(f"Error creating docs improvement PR: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=jsonable_encoder(
                CreatePRResponse(success=False, pr_url=None, error=f"Internal error: {str(e)}", improvement_id=None)
            ),
        )
