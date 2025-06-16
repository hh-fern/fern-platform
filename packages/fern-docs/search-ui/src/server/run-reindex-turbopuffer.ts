import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

import {
  TurbopufferRecord,
  queryTurbopuffer,
  turbopufferUpsertTask,
} from "@fern-docs/search-ask-fern";

import {
  fdrEnvironment,
  fernToken_admin,
  turbopufferApiKey,
} from "./env-variables";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const model = openai.embedding("text-embedding-3-large");

export const runReindexTurbopuffer = async (
  domain: string
): Promise<number> => {
  const namespace = `${domain}_${model.modelId}`;

  return turbopufferUpsertTask({
    apiKey: turbopufferApiKey(),
    namespace: namespace,
    payload: {
      environment: fdrEnvironment(),
      fernToken: fernToken_admin(),
      domain,
    },
    vectorizer: async (chunks) => {
      const embeddings = await embedMany({
        model,
        values: chunks,
      });
      return embeddings.embeddings;
    },
  });
};

export const runSemanticSearchTurbopuffer = async (
  query: string,
  domain: string,
  topK: number = 10
): Promise<TurbopufferRecord[]> => {
  return queryTurbopuffer(query, {
    namespace: `${domain}_${model.modelId}`,
    apiKey: turbopufferApiKey(),
    topK,
    vectorizer: async (text) => {
      const embedding = await embed({
        model,
        value: text,
      });
      return embedding.embedding;
    },
  });
};
