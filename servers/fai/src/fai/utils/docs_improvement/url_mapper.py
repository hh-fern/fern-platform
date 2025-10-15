"""Map documentation URLs to file paths in GitHub repositories."""

import re
from typing import Any

import requests
import yaml  # type: ignore[import-untyped]

from fai.settings import LOGGER


class DocsUrlMapper:
    """Maps documentation URLs to their source file paths in GitHub."""

    def __init__(self, github_token: str, owner: str, repo: str):
        self.github_token = github_token
        self.owner = owner
        self.repo = repo
        self.api_base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {github_token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        self.url_to_path_mapping: dict[str, str] = {}
        self.is_loaded = False

    def _fetch_file_content(self, file_path: str) -> str | None:
        """Fetch file content from GitHub."""
        try:
            url = f"{self.api_base_url}/repos/{self.owner}/{self.repo}/contents/{file_path}"
            response = requests.get(url, headers=self.headers, timeout=30)

            if response.status_code != 200:
                return None

            import base64

            content_b64 = response.json().get("content", "")
            if not content_b64:
                return None

            return base64.b64decode(content_b64).decode("utf-8")

        except Exception as e:
            LOGGER.warning(f"Failed to fetch {file_path}: {e}")
            return None

    def _to_url_slug(self, text: str) -> str:
        """Convert text to URL slug format."""
        return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", text.lower()))

    async def load_url_mappings(self) -> None:
        """Load URL to file path mappings from docs.yml files."""
        if self.is_loaded:
            return

        LOGGER.info("Loading Fern docs structure for URL mapping...")

        # Read the root docs.yml file
        root_docs_content = self._fetch_file_content("fern/docs.yml")
        if not root_docs_content:
            LOGGER.error("Could not fetch fern/docs.yml")
            return

        try:
            root_config = yaml.safe_load(root_docs_content)

            # Process root navigation if it exists
            if root_config.get("navigation"):
                self._process_navigation(root_config["navigation"], "", "fern", [])

            # Process products if they exist
            if root_config.get("products"):
                for product in root_config["products"]:
                    self._process_product(product)

            self.is_loaded = True
            LOGGER.info(f"Loaded {len(self.url_to_path_mapping)} URL mappings")

        except Exception as e:
            LOGGER.error(f"Failed to load URL mappings: {e}")

    def _process_product(self, product: dict[str, Any]) -> None:
        """Process a product configuration."""
        # Determine the product slug
        if product.get("skip-slug") is True:
            product_slug = ""
        elif product.get("slug"):
            product_slug = product["slug"]
        else:
            # Derive slug from path
            path_basename = product["path"].split("/")[-1].replace(".yml", "")
            product_slug = path_basename

        # Resolve the product config path
        config_path = product["path"]
        if config_path.startswith("./"):
            config_path = config_path[2:]
        if not config_path.startswith("fern/"):
            config_path = f"fern/{config_path}"

        LOGGER.info(f"Loading product config: {config_path} (slug: {product_slug})")

        # Load the product configuration
        product_config_content = self._fetch_file_content(config_path)
        if not product_config_content:
            return

        try:
            product_config = yaml.safe_load(product_config_content)

            # Process the product's navigation
            if product_config.get("navigation"):
                product_base_path = config_path.replace(".yml", "")
                self._process_navigation(product_config["navigation"], product_slug, product_base_path, [])

        except Exception as e:
            LOGGER.error(f"Failed to process product {config_path}: {e}")

    def _process_navigation(
        self, navigation: list[dict[str, Any]], product_slug: str, base_path: str, parent_sections: list[str]
    ) -> None:
        """Process navigation items."""
        for nav_item in navigation:
            if "page" in nav_item:
                self._process_page(nav_item, product_slug, base_path, parent_sections)
            elif "section" in nav_item:
                self._process_section(nav_item, product_slug, base_path, parent_sections)

    def _process_page(
        self, page_item: dict[str, Any], product_slug: str, base_path: str, parent_sections: list[str]
    ) -> None:
        """Process a page item."""
        page_name = page_item["page"]

        # Build file path
        if page_item.get("path"):
            custom_path = page_item["path"]
            if custom_path.startswith("./"):
                custom_path = custom_path[2:]
            page_file_path = f"{base_path}/{custom_path}"
        else:
            page_file_path = f"{base_path}/pages/{page_name}"

        # Add .mdx extension if not present
        if not page_file_path.endswith(".mdx") and "." not in page_file_path.split("/")[-1]:
            page_file_path += ".mdx"

        # Normalize the file path
        page_file_path = self._normalize_file_path(page_file_path)

        # Convert page name to URL slug
        page_slug = self._to_url_slug(page_name)

        # Build the URL
        url_parts = [product_slug, *parent_sections, page_slug]
        url_parts = [p for p in url_parts if p]  # Filter empty strings
        page_url = f"/learn/{'/'.join(url_parts)}"

        self.url_to_path_mapping[page_url] = page_file_path

        # Also create direct mapping (without sections) for backward compatibility
        if parent_sections:
            direct_url_parts = [product_slug, page_slug]
            direct_url_parts = [p for p in direct_url_parts if p]
            direct_url = f"/learn/{'/'.join(direct_url_parts)}"
            if direct_url not in self.url_to_path_mapping:
                self.url_to_path_mapping[direct_url] = page_file_path

    def _process_section(
        self, section_item: dict[str, Any], product_slug: str, base_path: str, parent_sections: list[str]
    ) -> None:
        """Process a section item."""
        section_name = section_item["section"]
        section_slug = self._to_url_slug(section_name)
        new_parent_sections = [*parent_sections, section_slug]

        # Process contents of this section
        if section_item.get("contents"):
            for content_item in section_item["contents"]:
                if "page" in content_item:
                    self._process_page(content_item, product_slug, base_path, new_parent_sections)
                elif "section" in content_item:
                    # Nested section - recursive processing
                    self._process_section(content_item, product_slug, base_path, new_parent_sections)

    def _normalize_file_path(self, file_path: str) -> str:
        """Normalize a file path by removing duplicates."""
        # Remove relative path markers
        normalized = file_path.replace("/./", "/")

        # Fix duplicated directory names
        parts = normalized.split("/")
        clean_parts = []
        previous_part = ""

        for part in parts:
            if part and part != previous_part:
                clean_parts.append(part)
            previous_part = part

        return "/".join(clean_parts)

    def get_file_path_for_url(self, docs_url: str) -> str | None:
        """Get the file path for a documentation URL.

        Args:
            docs_url: The documentation URL (e.g., https://buildwithfern.com/learn/...)

        Returns:
            File path in the repository or None if not found
        """
        # Extract the path from the URL
        if "buildwithfern.com" in docs_url:
            # Extract path after domain
            path = docs_url.split("buildwithfern.com", 1)[1]
        else:
            path = docs_url

        # Remove trailing slash
        path = path.rstrip("/")

        # Look up in mapping
        return self.url_to_path_mapping.get(path)
