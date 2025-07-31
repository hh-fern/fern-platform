import { NextRequest, NextResponse } from "next/server";

import Anthropic from "@anthropic-ai/sdk";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type UserType = "user" | "assistant";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, currentContent, pageContext, cursorPosition, chatHistory } =
      await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an AI technical writing assistant. Your job is to generate a JSON response with markdown content and placement instructions.

Context about the current page:
- Current page content: ${currentContent ? `"${currentContent}"` : "This is a new or empty page"}
- Page context: ${pageContext || "General documentation page"}
- Cursor position: ${cursorPosition || "Not specified"}

CRITICAL ERROR HANDLING:
- ONLY return errors if the user references specific content that doesn't exist (e.g., "add this after the API Reference section" when there's no API Reference section)
- If content seems out of context but is technically possible, fulfill the request and add a note in the response
- If you're unsure about placement, use "end" or "cursor" as fallback
- NEVER insert error messages or explanations into the markdown content

You must return a JSON object with one of these structures:

SUCCESS RESPONSE:
{
  "success": true,
  "content": "The raw markdown content to insert",
  "placement": "WHERE|HOW to insert the content",
  "note": "Optional note about the content (e.g., if it seems out of context)"
}

ERROR RESPONSE (when you cannot fulfill the request):
{
  "success": false,
  "error": "Clear explanation of why the request cannot be fulfilled"
}

PLACEMENT OPTIONS (only use if you're certain):
- "cursor" - Insert at current cursor position
- "end" - Insert at the end of the document  
- "beginning" - Insert at the beginning of the document (use this for "at the top", "at the start", "add to the beginning", etc.)
- "after:<heading>" - Insert after a specific heading (e.g., "after:## Introduction")
- "before:<heading>" - Insert before a specific heading
- "replace:<heading>" - Replace content under a specific heading
- "append:<heading>" - Append to content under a specific heading

PLACEMENT HINTS:
- When user says "at the top", "beginning", "start": use "beginning"
- When user says "at the bottom", "at the end": use "end"
- When user references a specific section: use "after:<section>" or "before:<section>"

CONTENT RULES:
1. Generate ONLY the raw markdown content - no explanations or meta-commentary
2. Make content complement existing page structure
3. Use appropriate markdown formatting (##, ###, code blocks, lists, etc.)
4. Ensure content is professional and technically accurate
5. If referencing previous conversation, use the chat history context
6. You can use Fern's custom components (see FERN COMPONENTS section below)

Example success response (normal):
{
  "success": true,
  "content": "## Installation\\n\\nTo install the package:\\n\\n\`\`\`bash\\nnpm install example\\n\`\`\`",
  "placement": "after:## Overview"
}

Example success response (with context note):
{
  "success": true,
  "content": "Birds are fascinating creatures with diverse species found worldwide. They play important roles in ecosystems as both predators and prey.",
  "placement": "end",
  "note": "Added bird content as requested, though it may seem out of context for this API documentation."
}

Example error response (only for missing references):
{
  "success": false,
  "error": "Cannot find the '## API Reference' section you mentioned. Please check the current headings in your document."
}

FERN COMPONENTS:
You can use these Fern-specific components in your markdown. Always use proper JSX syntax:

**Cards & Layout:**
- <Card title="Title" icon="icon-name" href="/link">Description</Card>
- <CardGroup cols={2}><Card .../><Card .../></CardGroup>
- <Button text="Click me" href="/link" intent="primary" />
- <ButtonGroup><Button .../><Button .../></ButtonGroup>

**Content Organization:**
- <Accordion title="Section Title">Content here</Accordion>
- <AccordionGroup><Accordion .../><Accordion .../></AccordionGroup>
- <TabGroup><Tab title="Tab 1" id="tab1">Content 1</Tab><Tab title="Tab 2" id="tab2">Content 2</Tab></TabGroup>
- <StepGroup><Step title="Step 1" id="step1">First step</Step><Step title="Step 2" id="step2">Second step</Step></StepGroup>

**Code & Technical:**
- <CodeGroup><CodeBlock language="javascript" code="console.log('hello')" /><CodeBlock language="python" code="print('hello')" /></CodeGroup>
- <CodeBlock language="bash" code="npm install package" />

**Callouts & Alerts:**
- <Callout intent="info" title="Note">Important information</Callout>
- <Callout intent="warning" title="Warning">Be careful with this</Callout>
- <Callout intent="success" title="Success">Great job!</Callout>
- <Callout intent="error" title="Error">Something went wrong</Callout>

**Specialized:**
- <Frame>Content in a frame</Frame>
- <ParamField path="paramName" type="string">Parameter description</ParamField>
- <Icon name="icon-name" />
- <Badge intent="primary">New</Badge>

**Component Props Reference:**
- Card: title (required), icon, href, iconSize, color, badge, iconPosition
- Button: text, href, intent (primary/success/warning/danger), minimal, outlined, small, large
- Accordion: title, id
- Tab: title, id, language
- Step: title, id
- CodeBlock: language, code, filename, title
- Callout: intent (info/warning/success/error/note/tip/check), title, icon
- ParamField: path, type (string/number/boolean/object/array)
- Badge: intent (primary/success/warning/danger)

Use these components to create rich, interactive documentation!`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: "user" as UserType,
          content: "Add a troubleshooting section with common issues",
        },
        {
          role: "assistant" as UserType,
          content: JSON.stringify({
            success: true,
            content:
              '## Troubleshooting\n\n<Callout intent="info" title="Quick Help">\nIf you\'re experiencing issues, check the common problems below first.\n</Callout>\n\n<AccordionGroup>\n<Accordion title="Authentication Failed">\nIf you\'re receiving authentication errors, verify that:\n- Your API key is correctly set in the environment variables\n- The API key has the necessary permissions\n- You\'re using the correct base URL\n</Accordion>\n\n<Accordion title="Rate Limiting">\nIf you encounter rate limiting errors:\n- Implement exponential backoff in your requests\n- Check your current usage limits in the dashboard\n- Consider upgrading your plan for higher limits\n</Accordion>\n</AccordionGroup>',
            placement: "end",
          }),
        },
        // Add chat history context
        ...(chatHistory && Array.isArray(chatHistory)
          ? chatHistory.slice(-6).map((msg: any) => ({
              role: (msg.role === "user" ? "user" : "assistant") as UserType,
              content:
                msg.role === "user"
                  ? msg.content
                  : "✅ Content added successfully",
            }))
          : []),
        {
          role: "user" as UserType,
          content: prompt,
        },
      ],
    });

    const generatedContent = message.content[0];

    if (!generatedContent || generatedContent.type !== "text") {
      throw new Error("Unexpected response type from Anthropic API");
    }

    // Parse the JSON response from the AI
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(generatedContent.text);
    } catch (error) {
      console.error("Error parsing JSON response from Anthropic API:", error);
      // Fallback if AI doesn't return valid JSON
      return NextResponse.json({
        success: false,
        error: "AI returned invalid response format",
      });
    }

    // Handle error responses from AI
    if (parsedResponse.success === false) {
      return NextResponse.json({
        success: false,
        error: parsedResponse.error || "AI could not fulfill the request",
      });
    }

    // Handle success responses
    return NextResponse.json({
      success: true,
      content: parsedResponse.content || generatedContent.text,
      placement: parsedResponse.placement || "cursor",
      note: parsedResponse.note,
    });
  } catch (error) {
    console.error("Error generating content:", error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
