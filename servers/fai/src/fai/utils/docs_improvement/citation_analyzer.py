"""Analyze and rank citations from Ask Fern responses to identify relevant docs pages."""

from urllib.parse import (
    urlparse,
    urlunparse,
)

from fai.settings import LOGGER


def normalize_url(url: str) -> str:
    """Normalize a URL by removing fragments and query parameters."""
    parsed = urlparse(url)
    # Remove fragments and query params
    normalized = urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))
    return normalized.rstrip("/")


def extract_unique_citations(citations: list[str]) -> list[str]:
    """Extract unique citation URLs from a list of citations.

    Args:
        citations: List of citation URLs (may contain duplicates)

    Returns:
        List of unique, normalized citation URLs
    """
    if not citations:
        return []

    unique_citations = set()
    for citation in citations:
        if not citation:
            continue

        try:
            normalized = normalize_url(citation)
            if normalized:
                unique_citations.add(normalized)
        except Exception as e:
            LOGGER.warning(f"Failed to normalize citation {citation}: {e}")
            continue

    return list(unique_citations)


def rank_citations(citations: list[str], question: str) -> list[str]:
    """Rank citations by relevance to the question.

    For now, this is a simple implementation that just deduplicates.
    In the future, we could add semantic similarity scoring.

    Args:
        citations: List of citation URLs
        question: The user's question

    Returns:
        List of ranked citation URLs (most relevant first)
    """
    unique_citations = extract_unique_citations(citations)

    # For now, just return in the order they appear (most recently used first is often most relevant)
    # In the future, we could:
    # - Use semantic similarity between question and docs page content
    # - Prefer certain doc types (guides over API reference)
    # - Consider citation frequency across multiple answers

    return unique_citations
