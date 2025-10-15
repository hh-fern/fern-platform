#!/usr/bin/env python3
"""Test script for the Fern Scribe PR workflow.

This script allows you to test the complete PR creation pipeline:
1. Map a docs URL to its GitHub file path
2. Fetch the current content
3. Generate improved content with LLM
4. Create a GitHub PR

Usage:
    python test_pr_workflow.py --question "..." --response "..." --url "..."

Example:
    python test_pr_workflow.py \
        --question "How do I configure Ask Fern in Slack?" \
        --response "Use the /fern command in any channel..." \
        --url "https://buildwithfern.com/learn/ask-fern/features/slack-app"
"""

import argparse
import asyncio
import os
import sys

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from fai.settings import LOGGER, VARIABLES
from fai.utils.docs_improvement.content_fetcher import DocsContentFetcher
from fai.utils.docs_improvement.improvement_generator import ImprovementGenerator
from fai.utils.docs_improvement.pr_creator import GitHubPRCreator


async def test_pr_workflow(
    question: str, ideal_response: str, docs_url: str, dry_run: bool = False, incorrect_response: str | None = None
) -> None:
    """Test the PR workflow with given inputs.

    Args:
        question: The user's question
        ideal_response: The ideal response to incorporate
        docs_url: The documentation URL to improve
        dry_run: If True, don't actually create the PR
        incorrect_response: Optional incorrect response that was originally given
    """
    # Check environment variables
    if not VARIABLES.GITHUB_TOKEN:
        print("❌ Error: GITHUB_TOKEN environment variable not set")
        print("Please set it with: export GITHUB_TOKEN=your_token_here")
        return

    print("\n" + "=" * 80)
    print("🧪 TESTING FERN SCRIBE PR WORKFLOW")
    print("=" * 80)

    print("\n📝 Input:")
    print(f"  Question: {question}")
    if incorrect_response:
        print(f"  Incorrect Response: {incorrect_response[:100]}...")
    print(f"  Ideal Response: {ideal_response[:100]}...")
    print(f"  URL: {docs_url}")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE (will create PR)'}")

    # Determine domain and repo
    if "buildwithfern.com" in docs_url:
        domain = "buildwithfern.com"
        repo_owner = "fern-api"
        repo_name = "docs"
    else:
        print("❌ Error: Only buildwithfern.com URLs are currently supported")
        return

    print(f"\n🔍 Repository: {repo_owner}/{repo_name}")

    # Step 1: Map URL to file path and fetch content
    print("\n" + "-" * 80)
    print("STEP 1: Mapping URL to file path and fetching content")
    print("-" * 80)

    try:
        content_fetcher = DocsContentFetcher(github_token=VARIABLES.GITHUB_TOKEN)
        docs_content = await content_fetcher.fetch_content_from_url(docs_url, domain)

        if not docs_content:
            print("❌ Error: Failed to fetch content from URL")
            return

        print(f"✅ Successfully fetched content from: {docs_content.file_path}")
        print(f"   Content length: {len(docs_content.content)} characters")
        print(f"   Content hash: {docs_content.content_hash[:16]}...")

        # Show a preview of the content
        preview_lines = docs_content.content.split("\n")[:10]
        print("\n📄 Content preview (first 10 lines):")
        for i, line in enumerate(preview_lines, 1):
            print(f"   {i:2d} | {line[:100]}")
        if len(docs_content.content.split("\n")) > 10:
            print(f"   ... ({len(docs_content.content.split('\n')) - 10} more lines)")

    except Exception as e:
        print(f"❌ Error fetching content: {e}")
        LOGGER.error(f"Error fetching content: {e}", exc_info=True)
        return

    # Step 2: Generate improved content
    print("\n" + "-" * 80)
    print("STEP 2: Generating improved content with LLM")
    print("-" * 80)

    try:
        improvement_generator = ImprovementGenerator()
        improvement_result = await improvement_generator.generate_improvement(
            current_content=docs_content.content,
            question=question,
            ideal_response=ideal_response,
            incorrect_response=incorrect_response,
        )

        if not improvement_result.success:
            print(f"❌ Error generating improvement: {improvement_result.error}")
            return

        print("✅ Successfully generated improved content")
        print(f"   Summary: {improvement_result.summary}")
        print(f"   Original length: {len(improvement_result.original_content)} chars")
        print(f"   Improved length: {len(improvement_result.improved_content)} chars")
        print(f"   Diff: {len(improvement_result.improved_content) - len(improvement_result.original_content):+d} chars")

        # Show a diff-style preview
        orig_lines = improvement_result.original_content.split("\n")
        new_lines = improvement_result.improved_content.split("\n")

        if orig_lines != new_lines:
            print("\n📝 Changes detected:")
            # Simple line-by-line comparison (first difference)
            for i, (orig, new) in enumerate(zip(orig_lines, new_lines)):
                if orig != new:
                    print(f"   Line {i+1}:")
                    print(f"     - {orig[:80]}")
                    print(f"     + {new[:80]}")
                    print("     ...")
                    break
        else:
            print("\n⚠️  Warning: No changes detected in content")

    except Exception as e:
        print(f"❌ Error generating improvement: {e}")
        LOGGER.error(f"Error generating improvement: {e}", exc_info=True)
        return

    # Step 3: Create PR (or dry run)
    print("\n" + "-" * 80)
    print("STEP 3: Creating GitHub PR" + (" (DRY RUN)" if dry_run else ""))
    print("-" * 80)

    if dry_run:
        print("ℹ️  DRY RUN MODE - Would create PR with:")
        print(f"   Repository: {repo_owner}/{repo_name}")
        print(f"   File: {docs_content.file_path}")
        print("   Branch: askfern/improve-docs-test")
        print(f"   Title: docs: {improvement_result.summary}")
        print("\n   Body preview:")
        print("   " + "-" * 60)
        print("   ## Context")
        print("   Generated from Ask Fern test")
        print("")
        print(f"   **Question:** {question}")
        print("")
        print("   **Ideal Response:**")
        print(f"   {ideal_response[:200]}...")
        print("   " + "-" * 60)
        print("\n✅ Dry run complete - no PR created")
        return

    try:
        pr_creator = GitHubPRCreator(github_token=VARIABLES.GITHUB_TOKEN)
        pr_result = pr_creator.create_improvement_pr(
            repo_owner=repo_owner,
            repo_name=repo_name,
            file_path=docs_content.file_path,
            improved_content=improvement_result.improved_content,
            question=question,
            ideal_response=ideal_response,
            summary=improvement_result.summary,
            slack_context_id="test-" + docs_content.content_hash[:8],
            incorrect_response=incorrect_response,
        )

        if pr_result.success:
            print("✅ Successfully created PR!")
            print(f"   PR URL: {pr_result.pr_url}")
            print(f"   PR Number: {pr_result.pr_number}")
            print(f"   Branch: {pr_result.branch_name}")
        else:
            print(f"❌ Error creating PR: {pr_result.error}")

    except Exception as e:
        print(f"❌ Error creating PR: {e}")
        LOGGER.error(f"Error creating PR: {e}", exc_info=True)
        return

    print("\n" + "=" * 80)
    print("🎉 TEST COMPLETE")
    print("=" * 80 + "\n")


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test the Fern Scribe PR workflow",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run (recommended first)
  python test_pr_workflow.py \\
    --question "How do I configure Ask Fern in Slack?" \\
    --response "Use the /fern command to configure Ask Fern settings." \\
    --url "https://buildwithfern.com/learn/ask-fern/features/slack-app" \\
    --dry-run

  # Create actual PR
  python test_pr_workflow.py \\
    --question "How do I configure Ask Fern in Slack?" \\
    --response "Use the /fern command to configure Ask Fern settings." \\
    --url "https://buildwithfern.com/learn/ask-fern/features/slack-app"
        """,
    )

    parser.add_argument("--question", "-q", required=True, help="The user's question")
    parser.add_argument("--response", "-r", required=True, help="The ideal response to incorporate into docs")
    parser.add_argument("--url", "-u", required=True, help="The documentation URL to improve")
    parser.add_argument(
        "--incorrect-response", "-i", required=False, help="The incorrect response that was originally given"
    )
    parser.add_argument(
        "--dry-run",
        "-d",
        action="store_true",
        help="Run without creating actual PR (recommended for testing)",
    )

    args = parser.parse_args()

    # Run the async workflow
    asyncio.run(
        test_pr_workflow(args.question, args.response, args.url, args.dry_run, args.incorrect_response)
    )


if __name__ == "__main__":
    main()
