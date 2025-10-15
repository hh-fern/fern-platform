# Testing Fern Scribe PR Workflow

This guide explains how to test the Fern Scribe PR creation workflow end-to-end.

## Prerequisites

1. **Set GITHUB_TOKEN**: You need a GitHub token with repo write access
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ```

2. **Install dependencies**: Make sure you have the FAI dependencies installed
   ```bash
   poetry install
   ```

## Quick Start

### 1. Dry Run (Recommended First)

Test the workflow without creating an actual PR:

```bash
cd servers/fai

poetry run python test_pr_workflow.py \
  --question "How do I configure response modes for the Ask Fern Slack app?" \
  --response "To configure response modes for Ask Fern in Slack, use the /fern command in any channel where you want to adjust settings. The command allows you to control how the bot responds to messages." \
  --url "https://buildwithfern.com/learn/ask-fern/features/slack-app" \
  --dry-run
```

This will:
- ✅ Map the URL to the GitHub file path
- ✅ Fetch the current content
- ✅ Generate improved content with LLM
- ℹ️  Show what PR would be created (but not create it)

### 2. Create Actual PR

Once you've verified the dry run looks good:

```bash
poetry run python test_pr_workflow.py \
  --question "How do I configure response modes for the Ask Fern Slack app?" \
  --response "To configure response modes for Ask Fern in Slack, use the /fern command in any channel where you want to adjust settings. The command allows you to control how the bot responds to messages." \
  --url "https://buildwithfern.com/learn/ask-fern/features/slack-app"
```

This will create an actual GitHub PR!

## What the Test Does

The test script simulates the complete Fern Scribe workflow:

```
1. URL Mapping
   ├─ Input: https://buildwithfern.com/learn/ask-fern/features/slack-app
   ├─ Loads docs.yml structure from GitHub
   ├─ Maps URL to file path
   └─ Output: fern/products/ask-fern/pages/features/slack-app.mdx

2. Content Fetching
   ├─ Fetches MDX file from GitHub
   ├─ Shows content preview
   └─ Computes content hash

3. LLM Improvement
   ├─ Sends current content + Q&A to Claude
   ├─ Generates improved MDX content
   ├─ Shows diff summary
   └─ Creates improvement summary

4. PR Creation (if not dry-run)
   ├─ Creates new branch: askfern/improve-docs-{hash}
   ├─ Commits improved content
   ├─ Opens pull request
   └─ Returns PR URL
```

## Example Output

```
================================================================================
🧪 TESTING FERN SCRIBE PR WORKFLOW
================================================================================

📝 Input:
  Question: How do I configure response modes for the Ask Fern Slack app?
  Response: To configure response modes for Ask Fern in Slack, use the /fern command...
  URL: https://buildwithfern.com/learn/ask-fern/features/slack-app
  Mode: DRY RUN

🔍 Repository: fern-api/docs

--------------------------------------------------------------------------------
STEP 1: Mapping URL to file path and fetching content
--------------------------------------------------------------------------------
✅ Successfully fetched content from: fern/products/ask-fern/pages/features/slack-app.mdx
   Content length: 2450 characters
   Content hash: a1b2c3d4e5f6...

📄 Content preview (first 10 lines):
    1 | ---
    2 | title: Slack App
    3 | description: Install Ask Fern in your Slack workspace
    4 | ---
    ...

--------------------------------------------------------------------------------
STEP 2: Generating improved content with LLM
--------------------------------------------------------------------------------
✅ Successfully generated improved content
   Summary: Added information about /fern command for configuring response modes
   Original length: 2450 chars
   Improved length: 2680 chars
   Diff: +230 chars

📝 Changes detected:
   Line 45:
     - The Ask Fern Slack app responds automatically to questions.
     + The Ask Fern Slack app responds automatically to questions. You can configure...
     ...

--------------------------------------------------------------------------------
STEP 3: Creating GitHub PR (DRY RUN)
--------------------------------------------------------------------------------
ℹ️  DRY RUN MODE - Would create PR with:
   Repository: fern-api/docs
   File: fern/products/ask-fern/pages/features/slack-app.mdx
   Branch: askfern/improve-docs-test
   Title: docs: Added information about /fern command for configuring response modes

✅ Dry run complete - no PR created

================================================================================
🎉 TEST COMPLETE
================================================================================
```

## Testing Different URLs

You can test with any buildwithfern.com docs URL:

```bash
# Test with SDK docs
poetry run python test_pr_workflow.py \
  --question "How do I generate a Python SDK?" \
  --response "Use 'fern generate --group python' to generate a Python SDK." \
  --url "https://buildwithfern.com/learn/sdks/features/generate-sdks" \
  --dry-run

# Test with API definition docs
poetry run python test_pr_workflow.py \
  --question "How do I add examples to my API?" \
  --response "Add examples to your API using the 'examples' field in your OpenAPI spec." \
  --url "https://buildwithfern.com/learn/openapi/examples" \
  --dry-run
```

## Troubleshooting

### Error: "GITHUB_TOKEN environment variable not set"
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

### Error: "Failed to fetch content from URL"
- Check that the URL is a valid buildwithfern.com docs URL
- Verify your GitHub token has access to the fern-api/docs repo
- Try with `--dry-run` first to see the file path mapping

### Error: "Could not map URL to file path"
- The URL might not exist in the docs structure
- Check the URL is correctly formatted
- Look at the logs to see what file paths were tried

## Advanced Usage

### See Help
```bash
poetry run python test_pr_workflow.py --help
```

### Use Short Flags
```bash
poetry run python test_pr_workflow.py \
  -q "Your question" \
  -r "Your response" \
  -u "https://..." \
  -d  # dry-run
```

## What's Next?

After testing manually, the real workflow happens automatically:

1. User saves Q&A in Slack: `@Ask Fern save this`
2. User requests PR: `@Ask Fern open a PR for this`
3. System runs this same pipeline automatically
4. PR is created and user gets the URL

Happy testing! 🚀
