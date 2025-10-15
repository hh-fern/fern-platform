"""Fetch citations for a question/answer pair by searching the docs."""

from fai.settings import LOGGER
from fai.utils.chat.retrieve.retrieve import retrieve


async def fetch_citations_for_question(question: str, domain: str, top_k: int = 5) -> list[str]:
    """Fetch relevant docs URLs that relate to a question.

    This is useful when you have a Q&A pair but no citations from the original response.
    It searches the docs index to find pages that are relevant to the question.

    Args:
        question: The user's question
        domain: The docs domain to search
        top_k: Number of top results to return

    Returns:
        List of citation URLs
    """
    try:
        LOGGER.info(f"Fetching citations for question: {question[:100]}...")

        # Search for relevant docs
        query_results = await retrieve(question, domain, top_k=top_k)

        # Extract URLs
        citations = []
        for result in query_results:
            url = getattr(result, "url", None)
            if url:
                citations.append(url)

        LOGGER.info(f"Found {len(citations)} citations for question")
        return citations

    except Exception as e:
        LOGGER.error(f"Error fetching citations: {e}")
        return []
