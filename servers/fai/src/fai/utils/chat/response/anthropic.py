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
) -> tuple[list[dict[str, str]], dict[str, Any] | None]:
    """Get response in index mode.

    In index mode, the LLM extracts a Q&A pair from a conversation thread
    and can optionally create a PR to improve docs.

    Args:
        model: The model to use
        messages: The conversation messages
        domain: The docs domain

    Returns:
        Tuple of (output, context_data)
    """
    system_prompt = build_anthropic_system_prompt(domain, ChatMode.SLACK_INDEX)

    # Tools for index mode: save context and optionally create PR
    tools = [SAVE_SLACK_CONTEXT_TOOL_ANTHROPIC, OPEN_DOCS_PR_TOOL_ANTHROPIC]

    async with AsyncAnthropic(api_key=VARIABLES.ANTHROPIC_API_KEY) as anthropic_client:
        output = []
        context_data = None

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
                    }
                    # Store the context_data so message_handler can save it and get the ID
                    # The ID will be available for subsequent open_docs_pr calls
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": (
                                "Context saved successfully. "
                                "You can now call open_docs_pr if the user requests it."
                            ),
                        }
                    )
                elif tool_use.name == "open_docs_pr":
                    # This tool will be handled by creating a marker in context_data
                    # The actual PR creation will happen in the message handler after we have the saved ID
                    if context_data is None:
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_use.id,
                                "content": (
                                    "Error: Cannot create PR before saving context. "
                                    "Please call save_slack_context first."
                                ),
                            }
                        )
                    else:
                        # Mark that a PR should be created
                        context_data["create_pr"] = True
                        # Extract incorrect_response if provided
                        if hasattr(tool_use, "input") and isinstance(tool_use.input, dict):
                            incorrect_response = tool_use.input.get("incorrect_response")
                            if incorrect_response:
                                context_data["incorrect_response"] = incorrect_response
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_use.id,
                                "content": "PR creation initiated. The documentation will be updated shortly.",
                            }
                        )

            if tool_results:
                current_messages.append({"role": "assistant", "content": response.content})
                current_messages.append({"role": "user", "content": tool_results})
            else:
                break

        return output, context_data
