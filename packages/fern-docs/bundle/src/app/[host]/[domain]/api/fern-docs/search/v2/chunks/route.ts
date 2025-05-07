import { NextRequest, NextResponse } from "next/server";

import { createOpenAI } from "@ai-sdk/openai";
import { EmbeddingModel, embed } from "ai";
import { initLogger } from "braintrust";

import { getAuthEdgeConfig, getEdgeFlags } from "@fern-docs/edge-config";
import {
  queryTurbopuffer,
  toDocuments,
} from "@fern-docs/search-server/turbopuffer";
import { FacetFilter } from "@fern-docs/search-ui";
import { withoutStaging } from "@fern-docs/utils";

import { getFernToken } from "@/app/fern-token";
import { safeVerifyFernJWTConfig } from "@/server/auth/FernJWT";
import { createCachedDocsLoader } from "@/server/docs-loader";
import { openaiApiKey, turbopufferApiKey } from "@/server/env-variables";
import { isLocal } from "@/server/isLocal";
import { getDocsDomainEdge } from "@/server/xfernhost/edge";

export const maxDuration = 60;
export const revalidate = 0;

const modelMap: Record<string, { modelId: string; region: string }> = {
  "claude-3.5": {
    modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    region: "us-west-2",
  },
  "claude-3.7": {
    modelId: "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    region: "us-east-1",
  },
  // command-a is not supported by bedrock
};

export async function POST(req: NextRequest) {
  if (isLocal()) {
    return NextResponse.json(
      "ai chat is not accessible in local preview mode",
      { status: 400 }
    );
  }

  initLogger({
    projectName: "Braintrust Evaluation",
    apiKey: process.env.BRAINTRUST_API_KEY,
  });

  const host = req.nextUrl.host;
  const domain = getDocsDomainEdge(req);
  const loader = await createCachedDocsLoader(host, domain);
  const metadata = await loader.getMetadata();
  const config = await loader.getConfig();

  const { messages, _, filters } = await req.json();

  // TODO: remove this once webflow adds model/system-prompt to docs.yml
  //   const isWebflow = url.includes("webflow");

  const model: string = config.aiChatConfig?.model || "claude-3.5";
  //   let languageModel;
  if (model === "command-a" || model === "command-r-plus") {
    // TODO: remove command-r-plus once fern generate change is resolved
    // const cohere = createCohere({ apiKey: cohereApiKey() });
    // languageModel = wrapAISDKModel(cohere("command-a-03-2025"));
  } else {
    // let modelId = modelMap["claude-3.5"]?.modelId || ""; // defaults for improper docs.yml entries
    // let region = modelMap["claude-3.5"]?.region || "";
    if (modelMap[model] != null) {
      // fallback
      //   ({ modelId, region } = modelMap[model]);
    }
    // const bedrock = createAmazonBedrock({
    //   region: isWebflow ? "us-east-1" : region,
    //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // });
  }

  const openai = createOpenAI({ apiKey: openaiApiKey() });
  const embeddingModel = openai.embedding("text-embedding-3-large");
  const namespace = `${withoutStaging(domain)}_${embeddingModel.modelId}`;

  if (metadata.isPreview) {
    return NextResponse.json("Chat is not enabled for preview environments", {
      status: 404,
    });
  }

  const [authEdgeConfig, edgeFlags] = await Promise.all([
    getAuthEdgeConfig(domain),
    getEdgeFlags(domain),
  ]);

  if (!edgeFlags.isAskAiEnabled) {
    throw new Error(`Ask AI is not enabled for ${domain}`);
  }

  const fern_token = await getFernToken();
  const user = await safeVerifyFernJWTConfig(fern_token, authEdgeConfig);

  const lastUserMessage: string | undefined = messages.findLast(
    (message: any) => message.role === "user"
  )?.content;

  const searchResults = await runQueryTurbopuffer(lastUserMessage, {
    embeddingModel,
    namespace,
    authed: user != null,
    roles: user?.roles ?? [],
    topK: 5,
    filters,
  });
  const documents = toDocuments(searchResults).join("\n\n");
  return NextResponse.json(documents, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function runQueryTurbopuffer(
  query: string | null | undefined,
  opts: {
    embeddingModel: EmbeddingModel<string>;
    namespace: string;
    topK?: number;
    authed?: boolean;
    roles?: string[];
    filters?: FacetFilter[];
  }
) {
  return query == null || query.trimStart().length === 0
    ? []
    : await queryTurbopuffer(query, {
        namespace: opts.namespace,
        apiKey: turbopufferApiKey(),
        topK: opts.topK ?? 5,
        vectorizer: async (text) => {
          const embedding = await embed({
            model: opts.embeddingModel,
            value: text,
          });
          return embedding.embedding;
        },
        authed: opts.authed,
        roles: opts.roles,
        filters: opts.filters,
      });
}
