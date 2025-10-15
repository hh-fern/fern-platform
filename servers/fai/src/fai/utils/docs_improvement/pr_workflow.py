"""Workflow for creating PRs from Slack contexts."""

from sqlalchemy import select

from fai.db import async_session_maker
from fai.models.db.slack_context_db import SlackContextDb
from fai.settings import (
    LOGGER,
    VARIABLES,
)
from fai.utils.docs_improvement.citation_analyzer import rank_citations
from fai.utils.docs_improvement.content_fetcher import DocsContentFetcher
from fai.utils.docs_improvement.improvement_generator import ImprovementGenerator
from fai.utils.docs_improvement.pr_creator import GitHubPRCreator


async def create_pr_for_slack_context(
    slack_context_id: str, domain: str, incorrect_response: str | None = None
) -> dict[str, bool | str | None]:
    """Create a PR for a saved slack context.

    This is a helper function that encapsulates the entire PR creation workflow.

    Args:
        slack_context_id: ID of the slack context
        domain: The docs domain
        incorrect_response: Optional incorrect response that was originally given

    Returns:
        Dict with success status, pr_url, and error message
    """
    try:
        # Check if GITHUB_TOKEN is configured
        if not VARIABLES.GITHUB_TOKEN:
            return {
                "success": False,
                "pr_url": None,
                "error": "GitHub token not configured. Please set GITHUB_TOKEN environment variable.",
            }

        # Step 1: Fetch the slack context
        async with async_session_maker() as db:
            result = await db.execute(select(SlackContextDb).where(SlackContextDb.id == slack_context_id))
            slack_context = result.scalar_one_or_none()

        if not slack_context:
            return {"success": False, "pr_url": None, "error": f"Slack context not found: {slack_context_id}"}

        # Step 2: Analyze citations to find the best docs page to improve
        if not slack_context.citations or len(slack_context.citations) == 0:
            return {
                "success": False,
                "pr_url": None,
                "error": "No citations found. Cannot determine which docs page to improve.",
            }

        ranked_citations = rank_citations(slack_context.citations, slack_context.question)

        if not ranked_citations:
            return {"success": False, "pr_url": None, "error": "No valid citations found after ranking."}

        target_docs_url = ranked_citations[0]  # Use the top-ranked citation
        LOGGER.info(f"Target docs URL: {target_docs_url}")

        # Step 3: Fetch the current content from GitHub
        content_fetcher = DocsContentFetcher(github_token=VARIABLES.GITHUB_TOKEN)
        docs_content = content_fetcher.fetch_content_from_url(target_docs_url, domain)

        if not docs_content:
            return {"success": False, "pr_url": None, "error": f"Failed to fetch content from {target_docs_url}"}

        # Extract repo info
        repo_info = content_fetcher.get_repo_from_domain(domain)
        if not repo_info:
            return {"success": False, "pr_url": None, "error": f"Failed to find GitHub repo for domain {domain}"}

        repo_owner, repo_name = repo_info

        # Step 4: Generate improved content using LLM
        improvement_generator = ImprovementGenerator()
        improvement_result = await improvement_generator.generate_improvement(
            current_content=docs_content.content,
            question=slack_context.question,
            ideal_response=slack_context.ideal_response,
            incorrect_response=incorrect_response,
        )

        if not improvement_result.success:
            return {
                "success": False,
                "pr_url": None,
                "error": f"Failed to generate improvement: {improvement_result.error}",
            }

        # Step 5: Create GitHub PR
        pr_creator = GitHubPRCreator(github_token=VARIABLES.GITHUB_TOKEN)
        # Prefer LLM-generated PR title/description and fall back to summary-based defaults
        explicit_pr_title = (
            improvement_result.pr_title
            if improvement_result.pr_title
            else "(docs): improvement from the Ask Fern Slack app"
        )
        # Prepare base description (prefer LLM); we'll add Slack link/footer below
        base_description = (
            improvement_result.pr_description
            if improvement_result.pr_description
            else "This documentation change originated from a thread in Slack."
        )

        # If we have a stored Slack permalink, include it
        slack_link_line = ""
        if getattr(slack_context, "slack_permalink", None):
            slack_link_line = f"\n\nSlack thread: {slack_context.slack_permalink}"

        # Always add explicit provenance note about Ask Fern Slack app
        explicit_pr_body = base_description.rstrip() + slack_link_line + (
            f"\n\n**Source:** Created via Ask Fern Slack app (context `{slack_context_id}`)\n"
        )

        pr_result = pr_creator.create_improvement_pr(
            repo_owner=repo_owner,
            repo_name=repo_name,
            file_path=docs_content.file_path,
            improved_content=improvement_result.improved_content,
            question=slack_context.question,
            ideal_response=slack_context.ideal_response,
            summary=improvement_result.summary,
            slack_context_id=slack_context_id,
            pr_title=explicit_pr_title,
            pr_body=explicit_pr_body,
            incorrect_response=incorrect_response,
        )

        if pr_result.success:
            LOGGER.info(f"Successfully created PR: {pr_result.pr_url}")
            return {"success": True, "pr_url": pr_result.pr_url, "error": None}
        else:
            return {"success": False, "pr_url": None, "error": pr_result.error}

    except Exception as e:
        LOGGER.error(f"Error in create_pr_for_slack_context: {e}", exc_info=True)
        return {"success": False, "pr_url": None, "error": f"Internal error: {str(e)}"}
