from typing import Any

from anthropic import AsyncAnthropic
from turbopuffer.types.row import Row

from fai.models.utils.chat import (
    ChatMode,
    format_record,
)
from fai.settings import VARIABLES
from fai.utils.chat.prompts.anthropic import build_anthropic_system_prompt
from fai.utils.chat.retrieve.retrieve import retrieve
from fai.utils.chat.tools import (
    OPEN_DOCS_PR_TOOL_ANTHROPIC,
    SAVE_SLACK_CONTEXT_TOOL_ANTHROPIC,
    SEARCH_TOOL_ANTHROPIC,
)


async def get_anthropic_response(
    maybe_system_prompt: str | None,
    model: str,
    messages: list[dict[str, Any]],
    domain: str,
    rag_records: list[str],
    mode: ChatMode = ChatMode.MARKDOWN,
) -> tuple[list[dict[str, str]], list[str]]:
    async def _handle_anthropic_tool_use(tool_use: Any, domain: str) -> tuple[str, list[str]]:
        query = tool_use.input["query"]
        query_results: list[Row] = await retrieve(query, domain)
        rag_records = [format_record(result) for result in query_results]
        return tool_use.id, rag_records

    system_prompt = (
        maybe_system_prompt
        if maybe_system_prompt
        else build_anthropic_system_prompt(domain, mode, "\n\n".join(rag_records))
    )

    async with AsyncAnthropic(api_key=VARIABLES.ANTHROPIC_API_KEY) as anthropic_client:
        output = []
        citations = [*rag_records]

        current_messages = messages.copy()

        while True:
            response = await anthropic_client.messages.create(
                system=system_prompt,
                model=model,
                messages=current_messages,
                max_tokens=1000,
                tools=[SEARCH_TOOL_ANTHROPIC],
            )

            for turn in response.content:
                if turn.type == "text":
                    output.append({"type": "text", "text": turn.text})

            tool_uses = [turn for turn in response.content if turn.type == "tool_use"]

            if not tool_uses:
                break

            tool_results = []
            for tool_use in tool_uses:
                if tool_use.name == "search":
                    tool_use_id, search_rag_records = await _handle_anthropic_tool_use(tool_use, domain)
                    tool_results.append(
                        {"type": "tool_result", "tool_use_id": tool_use_id, "content": "\n\n".join(search_rag_records)}
                    )
                    citations.extend(search_rag_records)

            current_messages.append({"role": "assistant", "content": response.content})

            current_messages.append({"role": "user", "content": tool_results})

        return output, citations


async def get_anthropic_index_response(
    model: str,
    messages: list[dict[str, Any]],
    domain: str,
    enable_search: bool = True,
) -> tuple[list[dict[str, str]], dict[str, Any] | None]:
    """Get response in index mode, optionally with search tool.

    Args:
        model: The model to use
        messages: The conversation messages
        domain: The domain to search (if search enabled)
        enable_search: Whether to enable the search tool (default: True)

    Returns:
        Tuple of (output, context_data)
    """
    async def _handle_anthropic_tool_use(tool_use: Any, domain: str) -> tuple[str, list[str], list[str]]:
        query = tool_use.input["query"]
        query_results: list[Row] = await retrieve(query, domain)
        rag_records = [format_record(result) for result in query_results]
        citation_urls = [getattr(result, "url", "") for result in query_results if hasattr(result, "url")]
        return tool_use.id, rag_records, citation_urls

    system_prompt = build_anthropic_system_prompt(domain, ChatMode.SLACK_INDEX)

    # Choose tools based on enable_search parameter
    tools = [SAVE_SLACK_CONTEXT_TOOL_ANTHROPIC, OPEN_DOCS_PR_TOOL_ANTHROPIC]
    if enable_search:
        tools.append(SEARCH_TOOL_ANTHROPIC)

    async with AsyncAnthropic(api_key=VARIABLES.ANTHROPIC_API_KEY) as anthropic_client:
        output = []
        context_data = None
        citations: list[str] = []
        saved_slack_context_id: str | None = None  # Track the saved context ID

        current_messages = messages.copy()

        while True:
            response = await anthropic_client.messages.create(
                system=system_prompt,
                model=model,
                messages=current_messages,
                max_tokens=2000,
                tools=tools,
            )

            for turn in response.content:
                if turn.type == "text":
                    output.append({"type": "text", "text": turn.text})

            tool_uses = [turn for turn in response.content if turn.type == "tool_use"]

            if not tool_uses:
                break

            tool_results = []
            for tool_use in tool_uses:
                if tool_use.name == "save_slack_context":
                    context_data = {
                        "question": tool_use.input["question"],
                        "ideal_response": tool_use.input["ideal_response"],
                        "citations": citations,
                    }
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": "Context saved successfully.",
                        }
                    )
                elif tool_use.name == "search":
                    tool_use_id, search_rag_records, search_citations = await _handle_anthropic_tool_use(tool_use, domain)
                    tool_results.append(
                        {"type": "tool_result", "tool_use_id": tool_use_id, "content": "\n\n".join(search_rag_records)}
                    )
                    citations.extend(search_citations)

            if tool_results:
                current_messages.append({"role": "assistant", "content": response.content})
                current_messages.append({"role": "user", "content": tool_results})
            else:
                break

        return output, context_data
