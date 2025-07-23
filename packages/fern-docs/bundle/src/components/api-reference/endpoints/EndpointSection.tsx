import React from "react";

import { Separator } from "@fern-docs/components/Separator";

import { ErrorBoundary } from "@/components/error-boundary";

import { SectionContainer, TypeDefinitionAnchor } from "./TypeDefinitionAnchor";
import { HttpResponse } from "@fern-api/fdr-sdk/api-definition";
import { ResponseSelect } from "./MultipleResponsesSelect";

export function EndpointSection({
  title,
  description,
  children,
  hideSeparator,
  multipleResponsesProps,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  hideSeparator?: boolean;
  multipleResponsesProps?: {
    responses: HttpResponse[];
    selectedResponse: HttpResponse;
    setSelectedResponse: (response: HttpResponse) => void;
    getResponseId: (response: HttpResponse) => React.JSX.Element;
  };
}) {
  return (
    <ErrorBoundary>
      <SectionContainer className="space-y-3">
        <TypeDefinitionAnchor>
          {multipleResponsesProps ? (
            <div className="mt-0 flex flex-row items-center gap-2">
              <h3 className="mt-0 mb-0">{title}</h3>
              <ResponseSelect
                responses={multipleResponsesProps.responses}
                selectedResponse={multipleResponsesProps.selectedResponse}
                setSelectedResponse={multipleResponsesProps.setSelectedResponse}
                getResponseId={multipleResponsesProps.getResponseId}
              />
            </div>
          ) : (
            <h3 className="mt-0">{title}</h3>
          )}
        </TypeDefinitionAnchor>
        {description}
        {hideSeparator ? null : <Separator />}
        {children}
      </SectionContainer>
    </ErrorBoundary>
  );
}
