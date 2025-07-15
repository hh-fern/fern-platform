"use server";

import { FernFai } from "@fern-api/fai-sdk";

import { getCurrentSessionOrThrow } from "../services/auth0/getCurrentSession";
import { getFaiClient } from "../services/fai/getFaiClient";

export async function getConversation({
  domain,
  conversationId,
}: {
  domain: string;
  conversationId: string;
}): Promise<FernFai.Conversation> {
  const session = await getCurrentSessionOrThrow();
  const faiClient = getFaiClient({ token: session.accessToken });
  try {
    return await faiClient.conversations.getConversation(
      domain,
      conversationId
    );
  } catch (error) {
    console.error("Failed to get conversation", error);
    throw new Error("Failed to get conversation");
  }
}
