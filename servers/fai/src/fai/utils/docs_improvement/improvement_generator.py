"""Generate improved docs content using LLM."""

from dataclasses import dataclass

from anthropic import AsyncAnthropic

from fai.settings import (
    LOGGER,
    VARIABLES,
)


@dataclass
class ImprovementResult:
    """Result of generating an improvement to docs content."""

    original_content: str
    improved_content: str
    summary: str
    success: bool
    error: str | None = None


IMPROVEMENT_PROMPT = """You are a technical documentation editor specializing in API documentation.
Your task is to improve an existing documentation page by incorporating new information that was found to be missing.

**Context:**
A user asked a question that our docs didn't adequately answer. We now have the ideal answer,
and need to naturally incorporate this information into the existing documentation.

**Question Asked:**
{question}

**Ideal Answer:**
{ideal_response}

**Current Documentation Content:**
```markdown
{current_content}
```

**Your Task:**
Improve the documentation by naturally incorporating the information from the ideal answer. Follow these guidelines:

1. **Maintain Style**: Keep the existing tone, style, and formatting conventions
2. **Preserve Structure**: Keep the existing document structure, headings, and organization
3. **Natural Integration**: Don't just append the answer - weave it into the appropriate section(s)
4. **Keep Frontmatter**: If there's YAML frontmatter at the top (between `---` markers), preserve it exactly
5. **MDX Components**: Preserve any MDX/JSX components exactly as they are (e.g., `<Callout>`, `<CodeBlock>`)
6. **Accuracy**: Only add information that directly addresses the gap revealed by the question
7. **Clarity**: Ensure the improved content flows naturally and improves clarity
8. **Brevity**: Add what's needed, but don't be unnecessarily verbose

**Output Format:**
Respond with ONLY the complete improved markdown content.
Do not include explanations, comments, or meta-discussion - just the improved documentation.

Begin your response with the improved documentation:"""


SUMMARY_PROMPT = """You are analyzing changes made to a documentation page.
Provide a concise 1-2 sentence summary of what changed.

**Original Content:**
```markdown
{original_content}
```

**Improved Content:**
```markdown
{improved_content}
```

Provide a brief summary of the key improvements made (1-2 sentences):"""


class ImprovementGenerator:
    """Generates improved docs content using LLM."""

    def __init__(self) -> None:
        self.anthropic_api_key = VARIABLES.ANTHROPIC_API_KEY
        self.model = "claude-4-sonnet-20250514"

    async def generate_improvement(
        self, current_content: str, question: str, ideal_response: str
    ) -> ImprovementResult:
        """Generate improved documentation content.

        Args:
            current_content: The current MDX content of the docs page
            question: The user's question that exposed the gap
            ideal_response: The ideal response that should be incorporated

        Returns:
            ImprovementResult with the improved content and summary
        """
        try:
            async with AsyncAnthropic(api_key=self.anthropic_api_key) as client:
                # Generate the improvement
                prompt = IMPROVEMENT_PROMPT.format(
                    question=question, ideal_response=ideal_response, current_content=current_content
                )

                response = await client.messages.create(
                    model=self.model,
                    max_tokens=8000,
                    messages=[{"role": "user", "content": prompt}],
                )

                if not response.content or len(response.content) == 0:
                    return ImprovementResult(
                        original_content=current_content,
                        improved_content=current_content,
                        summary="",
                        success=False,
                        error="No response from LLM",
                    )

                improved_content = response.content[0].text

                # Generate a summary of changes
                summary = await self._generate_summary(current_content, improved_content)

                LOGGER.info(f"Successfully generated improvement. Summary: {summary}")

                return ImprovementResult(
                    original_content=current_content,
                    improved_content=improved_content,
                    summary=summary,
                    success=True,
                )

        except Exception as e:
            LOGGER.error(f"Error generating improvement: {e}")
            return ImprovementResult(
                original_content=current_content,
                improved_content=current_content,
                summary="",
                success=False,
                error=str(e),
            )

    async def _generate_summary(self, original_content: str, improved_content: str) -> str:
        """Generate a summary of the changes made.

        Args:
            original_content: The original content
            improved_content: The improved content

        Returns:
            A brief summary of the changes
        """
        try:
            # If content is too long, truncate for the summary
            max_length = 4000
            orig_truncated = original_content[:max_length]
            improved_truncated = improved_content[:max_length]

            async with AsyncAnthropic(api_key=self.anthropic_api_key) as client:
                prompt = SUMMARY_PROMPT.format(
                    original_content=orig_truncated, improved_content=improved_truncated
                )

                response = await client.messages.create(
                    model=self.model,
                    max_tokens=200,
                    messages=[{"role": "user", "content": prompt}],
                )

                if response.content and len(response.content) > 0:
                    return response.content[0].text.strip()

                return "Updated documentation to address user question"

        except Exception as e:
            LOGGER.warning(f"Error generating summary: {e}")
            return "Updated documentation content"
