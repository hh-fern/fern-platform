import asyncio
from functools import partial

import tiktoken

from fai.settings import CONFIG


async def maybe_chunk_document(chunk: str) -> list[str]:
    """Async wrapper to chunk documents without blocking the event loop."""
    loop = asyncio.get_event_loop()
    token_count = await loop.run_in_executor(None, partial(_count_tokens_sync, chunk))
    if token_count >= 8192:
        chunks = await loop.run_in_executor(None, partial(_split_on_token_sync, chunk, 4096))
    else:
        chunks = [chunk]
    return chunks


def _count_tokens_sync(text: str, model: str = CONFIG.DEFAULT_EMBEDDING_MODEL.model_name) -> int:
    """Synchronous helper to count tokens. Use maybe_chunk_document() or run in executor."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))


def _split_on_token_sync(
    text: str, token_length: int, model: str = CONFIG.DEFAULT_EMBEDDING_MODEL.model_name
) -> list[str]:
    """Synchronous helper to split text on tokens. Use maybe_chunk_document() or run in executor."""
    encoding = tiktoken.encoding_for_model(model)
    tokens = encoding.encode(text)

    chunks = []
    for i in range(0, len(tokens), token_length):
        chunk_tokens = tokens[i : i + token_length]
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)

    return chunks


# Legacy sync functions for backwards compatibility (deprecated)
def count_tokens(text: str, model: str = CONFIG.DEFAULT_EMBEDDING_MODEL.model_name) -> int:
    """Count the number of tokens in a text using tiktoken.

    DEPRECATED: This is a blocking operation. Use maybe_chunk_document() instead.

    Args:
        text: The text to count tokens for
        model: The model to use for tokenization (default: text-embedding-3-large)

    Returns:
        The number of tokens in the text
    """
    return _count_tokens_sync(text, model)


def split_on_token(text: str, token_length: int, model: str = CONFIG.DEFAULT_EMBEDDING_MODEL.model_name) -> list[str]:
    """Split text into chunks where each chunk has at most token_length tokens.

    DEPRECATED: This is a blocking operation. Use maybe_chunk_document() instead.

    Args:
        text: The text to split
        token_length: The maximum number of tokens per chunk
        model: The model to use for tokenization (default: text-embedding-3-large)

    Returns:
        A list of text chunks, each with at most token_length tokens
    """
    return _split_on_token_sync(text, token_length, model)
