import * as ApiDefinition from "@fern-api/fdr-sdk/api-definition";
import { visitDiscriminatedUnion } from "@fern-api/ui-core-utils";

import { EndpointSection } from "./EndpointSection";

export function EndpointAuthSection({ auths }: { auths: ApiDefinition.AuthScheme[] }) {
  if (auths.length === 0) {
    return null;
  }

  return (
    <EndpointSection title="Authentication">
      <div className="space-y-4">
        {auths.length > 1 && (
          <div className="text-sm text-(color:--grayscale-a11)">
            This endpoint supports multiple authentication methods. Use any one of the following:
          </div>
        )}
        {auths.map((auth, index) => (
          <div key={index} className="rounded-lg border border-(color:--grayscale-a6) p-4">
            {visitDiscriminatedUnion(auth)._visit({
              basicAuth: (basicAuth) => (
                <>
                  <div className="font-semibold mb-2">Basic Authentication</div>
                  <div className="text-sm text-(color:--grayscale-a11)">
                    {basicAuth.description ?? "Basic authentication of the form `Basic <username:password>`."}
                  </div>
                  <div className="mt-2 text-sm font-mono bg-(color:--grayscale-a3) p-2 rounded">
                    Authorization: Basic {"<username:password>"}
                  </div>
                </>
              ),
              bearerAuth: (bearerAuth) => (
                <>
                  <div className="font-semibold mb-2">Bearer Token</div>
                  <div className="text-sm text-(color:--grayscale-a11)">
                    {bearerAuth.description ?? "Bearer authentication of the form `Bearer <token>`, where token is your auth token."}
                  </div>
                  <div className="mt-2 text-sm font-mono bg-(color:--grayscale-a3) p-2 rounded">
                    Authorization: Bearer {"<token>"}
                  </div>
                </>
              ),
              header: (value) => (
                <>
                  <div className="font-semibold mb-2">{value.headerWireValue} Header</div>
                  <div className="text-sm text-(color:--grayscale-a11)">
                    {value.description ??
                      (value.prefix != null
                        ? `Header authentication of the form \`${value.prefix} <token>\``
                        : "API Key authentication via header")}
                  </div>
                  <div className="mt-2 text-sm font-mono bg-(color:--grayscale-a3) p-2 rounded">
                    {value.headerWireValue}: {value.prefix ? `${value.prefix} ` : ""}{"<token>"}
                  </div>
                </>
              ),
              oAuth: (value) =>
                visitDiscriminatedUnion(value.value, "type")._visit({
                  clientCredentials: (clientCredentialsValue) =>
                    visitDiscriminatedUnion(clientCredentialsValue.value, "type")._visit({
                      referencedEndpoint: (oauth) => (
                        <>
                          <div className="font-semibold mb-2">OAuth 2.0</div>
                          <div className="text-sm text-(color:--grayscale-a11)">
                            {oauth.description ??
                              `OAuth authentication of the form \`${clientCredentialsValue.value.tokenPrefix ? `${clientCredentialsValue.value.tokenPrefix ?? "Bearer"} ` : ""}<token>\`.`}
                          </div>
                          <div className="mt-2 text-sm font-mono bg-(color:--grayscale-a3) p-2 rounded">
                            {clientCredentialsValue.value.headerName || "Authorization"}:{" "}
                            {clientCredentialsValue.value.tokenPrefix ? `${clientCredentialsValue.value.tokenPrefix} ` : ""}
                            {"<token>"}
                          </div>
                        </>
                      ),
                    }),
                }),
            })}
          </div>
        ))}
      </div>
    </EndpointSection>
  );
}
