"""Fetch docs content from GitHub repositories for improvement."""

import hashlib
import json
from dataclasses import dataclass
from urllib.parse import urlparse

from upstash_redis import Redis

from fai.settings import (
    LOGGER,
    VARIABLES,
)
from fai.utils.connectors.github.client import GitHubClient
from fai.utils.docs_improvement.url_mapper import DocsUrlMapper


@dataclass
class DocsFileMapping:
    """Mapping from a docs URL to its source file in GitHub."""

    docs_url: str
    repo_owner: str
    repo_name: str
    file_path: str
    branch: str = "main"


@dataclass
class DocsFileContent:
    """Content of a docs file from GitHub."""

    file_path: str
    content: str
    content_hash: str
    html_url: str


class DocsContentFetcher:
    """Fetches docs content from GitHub repos for improvement."""

    def __init__(self, github_token: str | None = None):
        self.github_client = GitHubClient(github_token=github_token)
        self.redis = Redis(url=VARIABLES.KV_REST_API_URL, token=VARIABLES.KV_REST_API_READ_ONLY_TOKEN)

    def get_repo_from_domain(self, domain: str) -> tuple[str, str] | None:
        """Get GitHub repo (owner, name) from a domain.

        Args:
            domain: The docs domain (e.g., "buildwithfern.com")

        Returns:
            Tuple of (owner, repo) or None if not found
        """
        try:
            # Get metadata from Redis
            domain_metadata = self.redis.hget(domain, "metadata")
            if not domain_metadata:
                LOGGER.warning(f"No metadata found for domain {domain}")
                return None

            metadata = json.loads(domain_metadata)
            github_repo = metadata.get("github_repo")

            if not github_repo:
                LOGGER.warning(f"No github_repo in metadata for domain {domain}")
                return None

            # Parse owner/repo from the github_repo field
            # Expected format: "owner/repo" or "https://github.com/owner/repo"
            if github_repo.startswith("http"):
                parsed = urlparse(github_repo)
                path_parts = parsed.path.strip("/").split("/")
                if len(path_parts) >= 2:
                    return path_parts[0], path_parts[1]
            else:
                parts = github_repo.split("/")
                if len(parts) == 2:
                    return parts[0], parts[1]

            LOGGER.warning(f"Invalid github_repo format: {github_repo}")
            return None

        except Exception as e:
            LOGGER.error(f"Error getting repo from domain {domain}: {e}")
            return None

    def find_mdx_file_from_url(self, docs_url: str, repo_owner: str, repo_name: str) -> str | None:
        """Find the MDX file path corresponding to a docs URL.

        This searches for docs.yml files in the repo and maps URLs to file paths.

        Args:
            docs_url: The documentation URL
            repo_owner: GitHub repo owner
            repo_name: GitHub repo name

        Returns:
            File path relative to repo root, or None if not found
        """
        try:
            parsed_url = urlparse(docs_url)
            url_path = parsed_url.path

            # Search for docs.yml files in common locations
            common_docs_yml_paths = [
                "docs.yml",
                "fern/docs.yml",
                "docs/docs.yml",
                ".fern/docs.yml",
            ]

            for docs_yml_path in common_docs_yml_paths:
                docs_yml = self.github_client._get_file_content(repo_owner, repo_name, docs_yml_path)

                if not docs_yml:
                    continue

                # Parse the docs.yml to find the file mapping
                # This is a simplified version - in reality, we'd need full YAML parsing
                # and URL resolution logic
                content = docs_yml.content

                # Try to find a pattern like:
                # - page: "Page Title"
                #   path: "path/to/page.mdx"
                # We'll extract the path and see if it matches the URL

                # For now, use a heuristic: convert URL path to potential file paths
                potential_paths = self._url_to_potential_file_paths(url_path, content)

                for potential_path in potential_paths:
                    # Check if file exists in the repo
                    file_content = self.github_client._get_file_content(repo_owner, repo_name, potential_path)
                    if file_content:
                        return potential_path

            LOGGER.warning(f"Could not find MDX file for URL {docs_url} in {repo_owner}/{repo_name}")
            return None

        except Exception as e:
            LOGGER.error(f"Error finding MDX file for URL {docs_url}: {e}")
            return None

    def _url_to_potential_file_paths(self, url_path: str, docs_yml_content: str) -> list[str]:
        """Convert a URL path to potential file paths in the repo.

        Args:
            url_path: The URL path (e.g., "/learn/concepts/getting-started")
            docs_yml_content: Content of docs.yml for reference

        Returns:
            List of potential file paths to check
        """
        paths = []

        # Remove leading/trailing slashes
        clean_path = url_path.strip("/")

        if not clean_path:
            # Homepage
            paths.extend(["index.mdx", "home.mdx", "README.md", "pages/index.mdx", "fern/pages/index.mdx"])
        else:
            # Try various common patterns
            path_variants = [
                f"{clean_path}.mdx",
                f"pages/{clean_path}.mdx",
                f"fern/pages/{clean_path}.mdx",
                f"docs/{clean_path}.mdx",
                f"{clean_path}/index.mdx",
                f"pages/{clean_path}/index.mdx",
            ]
            paths.extend(path_variants)

        return paths

    def fetch_file_content(self, repo_owner: str, repo_name: str, file_path: str) -> DocsFileContent | None:
        """Fetch the content of a file from GitHub.

        Args:
            repo_owner: GitHub repo owner
            repo_name: GitHub repo name
            file_path: Path to the file in the repo

        Returns:
            DocsFileContent or None if not found
        """
        try:
            file_info = self.github_client._get_file_content(repo_owner, repo_name, file_path)

            if not file_info:
                return None

            # Compute content hash for conflict detection
            content_hash = hashlib.sha256(file_info.content.encode("utf-8")).hexdigest()

            return DocsFileContent(
                file_path=file_path,
                content=file_info.content,
                content_hash=content_hash,
                html_url=file_info.html_url,
            )

        except Exception as e:
            LOGGER.error(f"Error fetching file content from {repo_owner}/{repo_name}/{file_path}: {e}")
            return None

    async def fetch_content_from_url(self, docs_url: str, domain: str) -> DocsFileContent | None:
        """Fetch docs content from a URL.

        This is the main entry point that combines all the steps:
        1. Get repo from domain
        2. Use URL mapper to find MDX file path
        3. Fetch file content

        Args:
            docs_url: The documentation URL to fetch content for
            domain: The domain hosting the docs

        Returns:
            DocsFileContent or None if any step fails
        """
        try:
            # For buildwithfern.com, use hardcoded repo
            if "buildwithfern.com" in domain:
                repo_owner = "fern-api"
                repo_name = "docs"
                LOGGER.info(f"Using hardcoded repo for buildwithfern.com: {repo_owner}/{repo_name}")
            else:
                # Step 1: Get repo from domain metadata
                repo_info = self.get_repo_from_domain(domain)
                if not repo_info:
                    LOGGER.error(f"Could not find repo for domain {domain}")
                    return None
                repo_owner, repo_name = repo_info

            # Step 2: Use URL mapper to find file path
            LOGGER.info(f"Mapping URL {docs_url} to file path...")
            url_mapper = DocsUrlMapper(
                github_token=self.github_client.github_token, owner=repo_owner, repo=repo_name
            )
            await url_mapper.load_url_mappings()

            file_path = url_mapper.get_file_path_for_url(docs_url)
            if not file_path:
                LOGGER.error(f"Could not map URL {docs_url} to file path")
                return None

            LOGGER.info(f"Mapped {docs_url} to {file_path}")

            # Step 3: Fetch file content
            content = self.fetch_file_content(repo_owner, repo_name, file_path)
            if not content:
                LOGGER.error(f"Could not fetch content for {file_path}")
                return None

            LOGGER.info(f"Successfully fetched content for {docs_url} from {repo_owner}/{repo_name}/{file_path}")
            return content

        except Exception as e:
            LOGGER.error(f"Error fetching content from URL {docs_url}: {e}")
            return None
