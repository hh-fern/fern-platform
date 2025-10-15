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


IMPROVEMENT_PROMPT = """
You are a technical documentation editor specializing in developer documentation.
Your task is to improve an existing documentation page by addressing a content gap.

**Context:**
A user asked a question that our docs didn't adequately answer. You now have 
both the incorrect answer that was initially provided and the ideal answer. 
Use this context to understand what was missing and incorporate the correct 
information into the existing documentation to create the best possible 
resource for future readers.

**Question Asked:**
{question}

**Incorrect Answer:**
{incorrect_response}

**Ideal Answer:**
{ideal_response}

**Current Documentation Content:**
```markdown
{current_content}
```

**Your Mission:**
Transform this documentation into the definitive resource that would have 
perfectly answered the user's question. You have complete editorial authority.

**Guidelines:**

**Content Quality:**
- **Stay focused**: Only edit content directly related to the question and answer pair
- **Edit strategically**: Rewrite sections that caused the incorrect answer to be given
- **Remove selectively**: Only cut information that conflicts with or obscures the ideal answer
- **Add purposefully**: Incorporate the ideal answer where it makes the most sense
- **Preserve unrelated content**: Leave other sections unchanged even if they could be improved
- **Learn from mistakes**: Use the incorrect answer to identify what was confusing or missing

**Structure & Organization:**
- **Restructure if needed**: Rearrange sections to improve logical flow (only for relevant content)
- **Use clear headings**: Make content scannable with descriptive section titles
- **Lead with essentials**: Put the most important information first
- **Group related content**: Keep similar concepts together

**Fern Components (use when they add value):**
- `<Callout intent="info|warn|error|success">` - Highlight critical information
- `<CodeBlock title="filename.ext">` - Provide syntax-highlighted code examples
- `<Accordion title="...">` - Hide advanced/optional details
- `<Steps>` with `<Step title="...">` - Document sequential processes
- `<Cards>` with `<Card title="...">` - Present options or related topics
- `<Tabs>` with `<Tab title="...">` - Show alternative approaches/languages
- Full reference: https://buildwithfern.com/learn/docs/writing-content/components/llms.txt

**Style:**
- **Be concise**: Every sentence should earn its place
- **Be specific**: Use concrete examples over abstract explanations
- **Be consistent**: Match the existing tone and terminology
- **Be developer-friendly**: Write for busy engineers who need to get things done

**Constraints:**
- Preserve YAML frontmatter exactly (content between `---` markers)
- Maintain existing MDX/JSX component syntax
- Keep links and references functional
- Don't invent information beyond the ideal answer
- Don't fix unrelated issues in the documentation

**Quality Checklist:**
Before finalizing, verify:
- [ ] Would this page fully answer the user's original question?
- [ ] Is the new information easy to find and understand?
- [ ] Have you removed anything confusing or incorrect?
- [ ] Are code examples clear and complete?
- [ ] Does the content flow naturally?
- [ ] Does it prevent the incorrect answer from being given again?
- [ ] Have you left unrelated content unchanged?

**Output Format:**
Respond with ONLY the improved markdown content - no explanations, comments, 
or preamble. Start immediately with the documentation.

---
"""


SUMMARY_PROMPT = """
You are analyzing documentation changes to create a clear change summary.

**Original Content:**
```markdown
{original_content}
```

**Improved Content:**
```markdown
{improved_content}
```

**Task:**
Provide a concise summary (1-3 sentences) covering:
1. What information was added or clarified
2. What was removed or restructured (if significant)
3. The overall improvement to user experience

Summary:
"""


class ImprovementGenerator:
    """Generates improved docs content using LLM."""

    def __init__(self) -> None:
        self.anthropic_api_key = VARIABLES.ANTHROPIC_API_KEY
        self.model = "claude-4-sonnet-20250514"

    async def generate_improvement(
        self, current_content: str, question: str, ideal_response: str, incorrect_response: str | None = None
    ) -> ImprovementResult:
        """Generate improved documentation content.

        Args:
            current_content: The current MDX content of the docs page
            question: The user's question that exposed the gap
            ideal_response: The ideal response that should be incorporated
            incorrect_response: Optional incorrect response that was originally given

        Returns:
            ImprovementResult with the improved content and summary
        """
        try:
            async with AsyncAnthropic(api_key=self.anthropic_api_key) as client:
                # Build context about incorrect response if provided
                if incorrect_response:
                    incorrect_context = (
                        f" The system initially gave an incorrect or incomplete response, "
                        f"and we need to update the docs so this doesn't happen again."
                    )
                    incorrect_section = f"""**Incorrect Response Given:**
{incorrect_response}

"""
                else:
                    incorrect_context = " We now have the ideal answer, and need to naturally incorporate this information into the existing documentation."
                    incorrect_section = ""

                # Generate the improvement
                prompt = IMPROVEMENT_PROMPT.format(
                    question=question,
                    ideal_response=ideal_response,
                    current_content=current_content,
                    incorrect_context=incorrect_context,
                    incorrect_section=incorrect_section,
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
