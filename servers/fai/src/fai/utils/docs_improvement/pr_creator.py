"""Create GitHub pull requests for docs improvements."""

import base64
from dataclasses import dataclass
from datetime import UTC, datetime

import requests

from fai.settings import LOGGER


@dataclass
class PRResult:
    """Result of creating a PR."""

    success: bool
    pr_url: str | None
    pr_number: int | None
    branch_name: str | None
    error: str | None = None


class GitHubPRCreator:
    """Creates GitHub pull requests for docs improvements."""

    def __init__(self, github_token: str):
        """Initialize with GitHub token.

        Args:
            github_token: GitHub personal access token with repo write access
        """
        self.github_token = github_token
        self.api_base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {github_token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def create_branch(
        self, repo_owner: str, repo_name: str, branch_name: str, base_branch: str = "main"
    ) -> bool | str:
        """Create a new branch in the repository.

        Args:
            repo_owner: GitHub repo owner
            repo_name: GitHub repo name
            branch_name: Name for the new branch
            base_branch: Base branch to branch from (default: main)

        Returns:
            True if successful with original name, new branch name if retried with timestamp, False otherwise
        """
        try:
            # Get the SHA of the base branch
            base_ref_url = f"{self.api_base_url}/repos/{repo_owner}/{repo_name}/git/refs/heads/{base_branch}"
            base_response = requests.get(base_ref_url, headers=self.headers, timeout=30)

            if base_response.status_code != 200:
                LOGGER.error(f"Failed to get base branch: {base_response.text}")
                return False

            base_sha = base_response.json()["object"]["sha"]

            # Create the new branch
            create_ref_url = f"{self.api_base_url}/repos/{repo_owner}/{repo_name}/git/refs"
            create_data = {"ref": f"refs/heads/{branch_name}", "sha": base_sha}

            create_response = requests.post(create_ref_url, headers=self.headers, json=create_data, timeout=30)

            if create_response.status_code == 201:
                LOGGER.info(f"Created branch {branch_name} in {repo_owner}/{repo_name}")
                return True
            elif create_response.status_code == 422:
                # Branch already exists - append timestamp
                timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
                new_branch_name = f"{branch_name}-{timestamp}"
                LOGGER.info(f"Branch {branch_name} exists, retrying with {new_branch_name}")
                create_data["ref"] = f"refs/heads/{new_branch_name}"
                retry_response = requests.post(create_ref_url, headers=self.headers, json=create_data, timeout=30)
                if retry_response.status_code == 201:
                    LOGGER.info(f"Created branch {new_branch_name} in {repo_owner}/{repo_name}")
                    # Update the branch_name for caller to use
                    return new_branch_name
                else:
                    LOGGER.error(f"Failed to create branch with timestamp: {retry_response.text}")
                    return False
            else:
                LOGGER.error(f"Failed to create branch: {create_response.text}")
                return False

        except Exception as e:
            LOGGER.error(f"Error creating branch: {e}")
            return False

    def update_file(
        self,
        repo_owner: str,
        repo_name: str,
        file_path: str,
        content: str,
        commit_message: str,
        branch_name: str,
    ) -> bool:
        """Update a file in the repository.

        Args:
            repo_owner: GitHub repo owner
            repo_name: GitHub repo name
            file_path: Path to the file to update
            content: New content for the file
            commit_message: Commit message
            branch_name: Branch to commit to

        Returns:
            True if successful, False otherwise
        """
        try:
            # Get the current file to get its SHA
            file_url = f"{self.api_base_url}/repos/{repo_owner}/{repo_name}/contents/{file_path}"
            params = {"ref": branch_name}

            get_response = requests.get(file_url, headers=self.headers, params=params, timeout=30)

            if get_response.status_code != 200:
                LOGGER.error(f"Failed to get file: {get_response.text}")
                return False

            file_sha = get_response.json()["sha"]

            # Update the file
            content_b64 = base64.b64encode(content.encode("utf-8")).decode("utf-8")

            update_data = {"message": commit_message, "content": content_b64, "sha": file_sha, "branch": branch_name}

            update_response = requests.put(file_url, headers=self.headers, json=update_data, timeout=30)

            if update_response.status_code == 200:
                LOGGER.info(f"Updated file {file_path} in {repo_owner}/{repo_name}")
                return True
            else:
                LOGGER.error(f"Failed to update file: {update_response.text}")
                return False

        except Exception as e:
            LOGGER.error(f"Error updating file: {e}")
            return False

    def create_pull_request(
        self,
        repo_owner: str,
        repo_name: str,
        title: str,
        body: str,
        head_branch: str,
        base_branch: str = "main",
    ) -> PRResult:
        """Create a pull request.

        Args:
            repo_owner: GitHub repo owner
            repo_name: GitHub repo name
            title: PR title
            body: PR body/description
            head_branch: Source branch
            base_branch: Target branch (default: main)

        Returns:
            PRResult with PR details
        """
        try:
            pr_url = f"{self.api_base_url}/repos/{repo_owner}/{repo_name}/pulls"

            pr_data = {"title": title, "body": body, "head": head_branch, "base": base_branch}

            response = requests.post(pr_url, headers=self.headers, json=pr_data, timeout=30)

            if response.status_code == 201:
                pr_json = response.json()
                pr_number = pr_json["number"]
                html_url = pr_json["html_url"]

                LOGGER.info(f"Created PR #{pr_number}: {html_url}")

                return PRResult(
                    success=True,
                    pr_url=html_url,
                    pr_number=pr_number,
                    branch_name=head_branch,
                )
            else:
                error_msg = response.text
                LOGGER.error(f"Failed to create PR: {error_msg}")
                return PRResult(success=False, pr_url=None, pr_number=None, branch_name=head_branch, error=error_msg)

        except Exception as e:
            error_msg = str(e)
            LOGGER.error(f"Error creating PR: {error_msg}")
            return PRResult(success=False, pr_url=None, pr_number=None, branch_name=head_branch, error=error_msg)

    def create_improvement_pr(
        self,
        repo_owner: str,
        repo_name: str,
        file_path: str,
        improved_content: str,
        question: str,
        ideal_response: str,
        summary: str,
        slack_context_id: str,
        base_branch: str = "main",
    ) -> PRResult:
        """Create a complete PR for a docs improvement.

        This is the high-level method that handles the entire workflow:
        1. Create a new branch
        2. Update the file with improved content
        3. Create a pull request

        Args:
            repo_owner: GitHub repo owner
            repo_name: GitHub repo name
            file_path: Path to the file to improve
            improved_content: The improved content
            question: The user's question
            ideal_response: The ideal response
            summary: Summary of the improvement
            slack_context_id: ID of the slack context
            base_branch: Base branch to branch from (default: main)

        Returns:
            PRResult with PR details
        """
        try:
            # Create branch name
            branch_name = f"askfern/improve-docs-{slack_context_id[:8]}"

            # Step 1: Create branch
            branch_result = self.create_branch(repo_owner, repo_name, branch_name, base_branch)
            if branch_result is False:
                return PRResult(
                    success=False,
                    pr_url=None,
                    pr_number=None,
                    branch_name=branch_name,
                    error="Failed to create branch",
                )
            elif isinstance(branch_result, str):
                # Branch was retried with timestamp
                branch_name = branch_result

            # Step 2: Update file
            commit_message = "docs: improve content based on Ask Fern feedback"
            if not self.update_file(repo_owner, repo_name, file_path, improved_content, commit_message, branch_name):
                return PRResult(
                    success=False,
                    pr_url=None,
                    pr_number=None,
                    branch_name=branch_name,
                    error="Failed to update file",
                )

            # Step 3: Create PR
            pr_title = f"docs: {summary}"
            pr_body = f"""{summary}

**Question:** {question}

**File:** `{file_path}`
**Source:** Slack Context `{slack_context_id}`
"""

            return self.create_pull_request(repo_owner, repo_name, pr_title, pr_body, branch_name, base_branch)

        except Exception as e:
            error_msg = str(e)
            LOGGER.error(f"Error in create_improvement_pr: {error_msg}")
            return PRResult(
                success=False, pr_url=None, pr_number=None, branch_name=None, error=f"Workflow error: {error_msg}"
            )
