import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { UIMessage } from "ai";
import {
  getLanguageModel,
  runRouteForAnthropic,
  runRouteForCohere,
} from "@fern-docs/search-ask-fern";
import { FacetFilter } from "@fern-docs/search-keyword";
import { MAX_AI_CHAT_MESSAGE_LENGTH } from "@fern-docs/search-ui";

export const maxDuration = 60;
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      domain,
      filters = [],
      conversationId,
      queryId,
      documentUrls = [],
      modelId = "claude-3.5",
      systemPrompt,
    }: {
      messages: UIMessage[];
      domain: string;
      filters?: FacetFilter[];
      conversationId: string;
      queryId: string;
      documentUrls?: string[];
      modelId?: string;
      systemPrompt?: string;
    } = await req.json();

    const lastUserMessage = getLastUserMessage(messages);
    if (lastUserMessage.length > MAX_AI_CHAT_MESSAGE_LENGTH) {
      return NextResponse.json(
        `User message exceeds maximum length of ${MAX_AI_CHAT_MESSAGE_LENGTH} characters`,
        { status: 400 }
      );
    }

    const { model: languageModel, provider: modelProvider } =
      getLanguageModel(modelId);

    // TODO: Replace with your actual API key management
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json("OpenAI API key not configured", { status: 500 });
    }

    const openai = createOpenAI({ apiKey: openaiApiKey });
    const embeddingModel = openai.embedding("text-embedding-3-large");

    // TODO: Replace with your actual turbopuffer namespace logic
    const turbopufferNamespace = `${domain}_default`;
    const explodedRoles: string[] = []; // TODO: Handle roles based on your auth

    if (modelProvider === "anthropic" || modelProvider === "bedrock") {
      return runRouteForAnthropic({
        domain,
        chatSource: "WIDGET",
        promptTemplate: systemPrompt,
        conversationId,
        lastUserMessage,
        messages,
        filters,
        explodedRoles,
        embeddingModel,
        turbopufferNamespace,
        languageModel,
        documentUrls,
      });
    } else if (modelProvider === "cohere") {
      return runRouteForCohere({
        domain,
        chatSource: "WIDGET",
        promptTemplate: systemPrompt,
        conversationId,
        lastUserMessage,
        messages,
        filters,
        explodedRoles,
        embeddingModel,
        turbopufferNamespace,
        languageModel,
      });
    } else {
      return NextResponse.json(`Invalid model provider: ${modelProvider}`, {
        status: 400,
      });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json("Internal server error", { status: 500 });
  }
}

function getLastUserMessage(messages: UIMessage[]): string {
  let lastUserMessageText = "";
  const lastUserMessage = messages.findLast((message: UIMessage) => {
    return message.role === "user";
  });

  if (lastUserMessage == null) {
    return "";
  }

  for (const part of lastUserMessage.parts) {
    if (part.type === "text") {
      lastUserMessageText += part.text;
    }
  }
  return lastUserMessageText;
}