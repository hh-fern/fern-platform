from pydantic import BaseModel


class SearchToolInput(BaseModel):
    query: str


class SaveSlackContextToolInput(BaseModel):
    question: str
    ideal_response: str


class OpenDocsPRToolInput(BaseModel):
    slack_context_id: str


SEARCH_TOOL_ANTHROPIC = {
    "name": "search",
    "description": "Search the knowledge base for the user's query. Semantic search is enabled.",
    "input_schema": SearchToolInput.model_json_schema(),
}

SAVE_SLACK_CONTEXT_TOOL_ANTHROPIC = {
    "name": "save_slack_context",
    "description": (
        "Save a question and ideal response pair to improve future bot responses. "
        "Only call this tool after the user has explicitly confirmed they want to save the context. "
        "The question should be a clear, standalone question that users might ask. "
        "The ideal_response should be the precise answer the bot should give for this question."
    ),
    "input_schema": SaveSlackContextToolInput.model_json_schema(),
}

OPEN_DOCS_PR_TOOL_ANTHROPIC = {
    "name": "open_docs_pr",
    "description": (
        "Open a GitHub pull request to improve documentation based on a saved Q&A pair. "
        "Use this when the user explicitly asks to create/open a PR, update the docs via PR, "
        "or make a pull request to update documentation. "
        "This should ONLY be called AFTER save_slack_context has been called in the same conversation. "
        "The slack_context_id is returned from the save_slack_context tool call."
    ),
    "input_schema": OpenDocsPRToolInput.model_json_schema(),
}

SEARCH_TOOL_COHERE = {
    "type": "function",
    "function": {
        "name": "search",
        "description": "Search the knowledge base for the user's query. Semantic search is enabled.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "the query to search the knowledge base.",
                }
            },
            "required": ["query"],
        },
    },
}
