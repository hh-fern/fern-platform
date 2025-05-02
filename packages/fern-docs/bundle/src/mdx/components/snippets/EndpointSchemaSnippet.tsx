import * as ApiDefinition from "@fern-api/fdr-sdk/api-definition";

import { EndpointResponseSection } from "@/components/api-reference/endpoints/EndpointResponseSection";
import { EndpointSection } from "@/components/api-reference/endpoints/EndpointSection";
import { PropertyContainer } from "@/components/api-reference/endpoints/TypeDefinitionAnchor";
import { ObjectProperty } from "@/components/api-reference/type-definitions/ObjectProperty";
import {
  TypeDefinitionAnchorPart,
  TypeDefinitionResponse,
  TypeDefinitionRoot,
} from "@/components/api-reference/type-definitions/TypeDefinitionContext";
import { WithSeparator } from "@/components/api-reference/type-definitions/TypeDefinitionDetails";

type EndpointSchemaSnippetProps = {
  /**
   * The endpoint locator to use for the request snippet.
   */
  endpoint?: string;
  /**
   * The example to use for the request snippet.
   */
  example?: string | undefined;
  /**
   * @internal the rehype-endpoint-snippets plugin will set this
   */
  endpointDefinition?: ApiDefinition.EndpointDefinition;
  /**
   * @internal the rehype-endpoint-snippets plugin will set this
   */
  types?: Record<ApiDefinition.TypeId, ApiDefinition.TypeDefinition>;
  /**
   * The slug of the endpoint.
   */
  slug: string;
  /**
   * The selector of the endpoint.
   */
  selector: string | null;
};

export function EndpointSchemaSnippet({
  endpoint,
  endpointDefinition,
  slug,
  selector,
  types,
}: EndpointSchemaSnippetProps) {
  // if (endpointDefinition == null) {
  //   return null;
  // }

  // Client-side version of ObjectProperty
  // const ClientObjectProperty = ({
  //   property,
  //   types,
  // }: {
  //   property: ApiDefinition.ObjectProperty;
  //   types: Record<ApiDefinition.TypeId, ApiDefinition.TypeDefinition>;
  // }) => {
  //   const unwrapped = ApiDefinition.unwrapReference(property.valueShape, types);
  //   const description = compact([
  //     property.description,
  //     ...unwrapped.descriptions,
  //   ])[0];

  //   return (
  //     <div className="property-container">
  //       <div className="property-header">
  //         <span className="property-key">{property.key}</span>
  //         {property.availability != null && (
  //           <AvailabilityBadge
  //             availability={property.availability}
  //             size="sm"
  //             rounded
  //           />
  //         )}
  //       </div>
  //       {description && (
  //         <div className="property-description text-sm text-gray-600">
  //           {description}
  //         </div>
  //       )}
  //     </div>
  //   );
  // };

  console.log("endpoint", endpoint);
  console.log("endpointDefinition", endpointDefinition);
  console.log("types", types);
  console.log("slug", slug);
  console.log("selector", selector);
  if (endpoint == null || endpointDefinition == null || types == null) {
    return null;
  }

  return (
    <TypeDefinitionRoot types={types} slug={slug}>
      <EndpointSchemaSnippetInternal
        endpoint={endpoint}
        endpointDefinition={endpointDefinition}
        slug={slug}
        selector={selector}
        types={types}
      />
    </TypeDefinitionRoot>
  );
}

const REQUEST = ["request"];
const RESPONSE = ["response"];
const REQUEST_PATH = ["request", "path"];
const REQUEST_QUERY = ["request", "query"];
// todo: finish implementation
// const REQUEST_HEADER = ["request", "header"];
const REQUEST_BODY = ["request", "body"];
const RESPONSE_BODY = ["response", "body"];

export const EndpointSchemaSnippetInternal: React.FC<
  React.PropsWithChildren<EndpointSchemaSnippetProps>
> = ({ selector, endpoint, endpointDefinition, types, slug }) => {
  if (endpoint == null || endpointDefinition == null || types == null) {
    return null;
  }

  return (
    <TypeDefinitionRoot types={types} slug={slug}>
      <div>
        <p>endpointDefinition</p>
        <p>{JSON.stringify(endpointDefinition, null, 2)}</p>
        <p>types</p>
        <p>{JSON.stringify(types, null, 2)}</p>
        <p>selector</p>
        <p>{selector == null}</p>
        <p>slug</p>
        <p>{slug}</p>
        <p>requests</p>
        <p>{JSON.stringify(endpointDefinition?.requests?.[0]?.body)}</p>
        <p>responses</p>
        <p>{JSON.stringify(endpointDefinition?.responses?.[0]?.body)}</p>
        {(selector == null ||
          selector === "request" ||
          selector === "request.path") &&
          endpointDefinition.pathParameters &&
          endpointDefinition.pathParameters.length > 0 && (
            <EndpointSection title="Path parameters">
              <WithSeparator>
                {endpointDefinition.pathParameters.map((parameter) => (
                  // <p key={parameter.key}>{JSON.stringify(parameter)}</p>
                  <ObjectProperty
                    key={parameter.key}
                    property={parameter}
                    types={types}
                  />
                ))}
              </WithSeparator>
            </EndpointSection>
          )}
        {(selector == null ||
          selector === "request" ||
          selector === "request.query") &&
          endpointDefinition.queryParameters &&
          endpointDefinition.queryParameters.length > 0 && (
            <EndpointSection title="Query parameters">
              <WithSeparator>
                {endpointDefinition.queryParameters.map((parameter) => (
                  <PropertyContainer key={parameter.key}>
                    <ObjectProperty property={parameter} types={types} />
                  </PropertyContainer>
                  // <p key={parameter.key}>{JSON.stringify(parameter)}</p>
                  // <ObjectProperty
                  //   serialize={serialize}
                  //   key={parameter.key}
                  //   property={parameter}
                  //   types={types}
                  // />
                ))}
              </WithSeparator>
            </EndpointSection>
          )}
        {/* {(selector == null ||
          selector === "request" ||
          selector === "request.body") &&
          endpointDefinition.requests?.[0] != null && (
            <EndpointSection
              key={endpointDefinition.requests[0].contentType}
              title="Request"
            >
              <TypeDefinitionAnchorPart part="body">
                <EndpointRequestSection
                  request={endpointDefinition.requests[0]}
                  types={types}
                />
              </TypeDefinitionAnchorPart>
            </EndpointSection>
          )} */}
        {(selector == null ||
          selector === "response" ||
          selector === "response.body") &&
          endpointDefinition.responses?.[0] != null && (
            <>
              <p>{JSON.stringify(endpointDefinition.responses[0].body)}</p>
              <TypeDefinitionResponse>
                <TypeDefinitionAnchorPart part="response">
                  {endpointDefinition.responses?.[0] != null && (
                    <EndpointSection title="Response">
                      <TypeDefinitionAnchorPart part="body">
                        <EndpointResponseSection
                          body={endpointDefinition.responses[0].body}
                          types={types}
                        />
                      </TypeDefinitionAnchorPart>
                    </EndpointSection>
                  )}
                </TypeDefinitionAnchorPart>
              </TypeDefinitionResponse>
            </>

            //     <TypeDefinitionAnchorPart part="response">
            //       <EndpointSection title="Response">
            //         <TypeDefinitionAnchorPart part="body">
            //           <EndpointResponseSection
            //             body={endpointDefinition.responses[0].body}
            //             types={types}
            //           />
            //           {/* <p>{JSON.stringify(endpointDefinition.responses[0].body)}</p> */}
            //           {/* //     <EndpointResponseSection
            // //       serialize={serialize}
            // //       body={endpoint.responses[0].body}
            // //       types={types}
            // //     /> */}
            //         </TypeDefinitionAnchorPart>
            //       </EndpointSection>
            //     </TypeDefinitionAnchorPart>
            //   </TypeDefinitionResponse>
          )}
      </div>
    </TypeDefinitionRoot>
  );
};
