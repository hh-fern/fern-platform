"use client";

import React, { useCallback } from "react";
import { ApiDefinition } from "@fern-api/fdr-sdk";
import { MdxServerComponentProseSuspense } from "@/mdx/components/server-component";
import { EndpointSection } from "./EndpointSection";
import { EndpointResponseSection } from "./EndpointResponseSection";
import { ResponseSummaryFallback } from "./response-summary-fallback";
import { TypeDefinitionAnchorPart } from "../type-definitions/TypeDefinitionContext";
import { useEndpointContext } from "./EndpointContext";
import { HttpResponse } from "@fern-api/fdr-sdk/api-definition";
import { renderResponseTitle } from "./EndpointContentCodeSnippets";

export interface EndpointMultipleResponseSectionProps {
    method: ApiDefinition.HttpMethod;
    responses: HttpResponse[];
    types: Record<string, ApiDefinition.TypeDefinition>;
}

export function EndpointMultipleResponseSection({
  method,
  responses,
  types
}: EndpointMultipleResponseSectionProps) {
  const { selectedResponse, setSelectedResponse } = useEndpointContext();

  const getResponseId = useCallback(
    (response: ApiDefinition.HttpResponse) => {
      const title = ApiDefinition.getMessageForStatus(
        response.statusCode,
        method
      ) ?? "Response";
      
      return renderResponseTitle(title, response.statusCode, true);
    }, [method]
  );

  if (!selectedResponse) {
    return null;
  }

  return (
    <EndpointSection
      title="Response"
      description={
        <MdxServerComponentProseSuspense
          size="sm"
          className="text-(color:--grayscale-a11)"
          mdx={selectedResponse.description}
          fallback={
            <ResponseSummaryFallback
              response={selectedResponse}
              types={types}
            />
          }
        />
      }
      multipleResponsesProps={{
        responses,
        selectedResponse,
        setSelectedResponse,
        getResponseId
      }}
    >
      <TypeDefinitionAnchorPart part="body">
        <EndpointResponseSection
          body={selectedResponse.body}
          types={types}
        />
      </TypeDefinitionAnchorPart>
    </EndpointSection>
  );
}