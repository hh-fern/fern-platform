"use client";

import type { ExampleEndpointResponse, HttpResponse, TypeDefinition } from "@fern-api/fdr-sdk/api-definition";

import { renderTypeShorthand } from "@/components/type-shorthand";

import { useEndpointContext } from "./EndpointContext";

export function ResponseSummaryFallback({
    response,
    types
}: {
    response: HttpResponse;
    types: Record<string, TypeDefinition>;
}) {
    const { selectedExample } = useEndpointContext();
    const exampleResponseBody = selectedExample?.exampleCall.responseBody;

    return getResponseSummary({
        response,
        exampleResponseBody,
        types,
        isAudioFileDownloadSpanSummary: false
    });
}

function getResponseSummary({
    response,
    exampleResponseBody,
    types,
    isAudioFileDownloadSpanSummary
}: {
    response: HttpResponse;
    exampleResponseBody: ExampleEndpointResponse | undefined;
    types: Record<string, TypeDefinition>;
    isAudioFileDownloadSpanSummary: boolean;
}) {
    switch (response.body.type) {
        case "empty":
            return "This endpoint returns nothing.";
        case "fileDownload": {
            if (isAudioFileDownloadSpanSummary) {
                return (
                    <span>
                        This endpoint returns an <code>audio/mpeg</code> file.
                    </span>
                );
            }
            return "This endpoint returns a file.";
        }
        case "streamingText":
            return "This endpoint sends text responses over a long-lived HTTP connection.";
        case "stream":
            return `This endpoint returns a stream of ${exampleResponseBody?.type === "sse" ? "server sent events" : renderTypeShorthand(response.body.shape, { withArticle: false }, types)}.`;
        default:
            return `This endpoint returns ${renderTypeShorthand(response.body, { withArticle: true }, types)}.`;
    }
}
