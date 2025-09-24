import { ApiDefinition } from "@fern-api/fdr-sdk";

/**
 * Utility to convert EndpointContext to OpenAPI spec, mirroring frontend rendering logic
 * This ensures consistency between frontend display and OpenAPI generation
 */

export interface EndpointContext {
  endpoint: ApiDefinition.EndpointDefinition;
  types: Record<string, ApiDefinition.TypeDefinition>;
  auth?: ApiDefinition.AuthScheme;
  globalHeaders?: ApiDefinition.ObjectProperty[];
}

/**
 * Creates an OpenAPI parameter from an ObjectProperty, mirroring frontend logic
 */
export function createOpenApiParameter(
  property: ApiDefinition.ObjectProperty,
  location: "query" | "header" | "path",
  apiDefinition?: any
): any {
  return {
    name: property.key,
    in: location,
    description: property.description,
    required: !isOptional(property.valueShape),
    schema: convertToOpenApiSchema(property.valueShape, apiDefinition)
  };
}

/**
 * Creates an OpenAPI auth header parameter, mirroring frontend EndpointContentLeft logic
 * This exactly mirrors the visitDiscriminatedUnion logic from EndpointContentLeft.tsx:39-118
 */
export function createAuthHeaderParameter(
  auth: ApiDefinition.AuthScheme,
  apiDefinition?: any
): any {
  const stringShape: ApiDefinition.TypeShape = {
    type: "alias",
    value: {
      type: "primitive",
      value: {
        type: "string",
        format: undefined,
        regex: undefined,
        minLength: undefined,
        maxLength: undefined,
        default: undefined,
      },
    },
  };

  // Mirror the exact visitDiscriminatedUnion logic from EndpointContentLeft.tsx
  if (auth.type === "basicAuth") {
    return {
      name: "Authorization",
      in: "header",
      description: auth.description ?? "Basic authentication of the form `Basic <username:password>`.",
      required: true,
      schema: convertToOpenApiSchema(stringShape, apiDefinition)
    };
  } else if (auth.type === "bearerAuth") {
    return {
      name: "Authorization",
      in: "header",
      description: auth.description ?? "Bearer authentication of the form `Bearer <token>`, where token is your auth token.",
      required: true,
      schema: convertToOpenApiSchema(stringShape, apiDefinition)
    };
  } else if (auth.type === "header") {
    return {
      name: auth.headerWireValue,
      in: "header",
      description: (auth.description || auth.prefix != null)
        ? `Header authentication of the form \`${auth.prefix} <token>\``
        : undefined,
      required: true,
      schema: convertToOpenApiSchema(stringShape, apiDefinition)
    };
  } else if (auth.type === "oAuth") {
    // Mirror the complex OAuth handling from lines 95-115
    if (auth.value?.type === "clientCredentials") {
      const clientCredentials = auth.value.value;
      if (clientCredentials?.type === "referencedEndpoint") {
        return {
          name: clientCredentials.headerName || "Authorization",
          in: "header",
          description: clientCredentials.description ??
            `OAuth authentication of the form \`${clientCredentials.tokenPrefix ? `${clientCredentials.tokenPrefix ?? "Bearer"} ` : ""}<token>\`.`,
          required: true,
          schema: convertToOpenApiSchema(stringShape, apiDefinition)
        };
      }
    }
    return {
      name: "Authorization",
      in: "header",
      description: "OAuth authentication",
      required: true,
      schema: convertToOpenApiSchema(stringShape, apiDefinition)
    };
  }

  return null;
}

/**
 * Determines if a type shape is optional, mirroring frontend logic
 */
function isOptional(shape: any): boolean {
  if (shape.type === "optional") {
    return true;
  }
  if (shape.type === "alias") {
    return isOptional(shape.value);
  }
  return false;
}

/**
 * Converts Fern type shape to OpenAPI schema, mirroring frontend type handling
 */
function convertToOpenApiSchema(shape: any, apiDefinition?: any): any {
  if (!shape) {
    // Frontend shows "any" for unknown types, we'll use a flexible schema
    return {};
  }

  if (shape.type === "primitive") {
    const primitive = shape.value;
    if (primitive.type === "string") {
      return { type: "string", format: primitive.format };
    } else if (primitive.type === "integer") {
      return { type: "integer" };
    } else if (primitive.type === "double") {
      return { type: "number", format: "double" };
    } else if (primitive.type === "long") {
      return { type: "integer", format: "int64" };
    } else if (primitive.type === "boolean") {
      return { type: "boolean" };
    } else if (primitive.type === "date") {
      return { type: "string", format: "date" };
    } else if (primitive.type === "datetime") {
      return { type: "string", format: "date-time" };
    }
    return { type: primitive.type };
  }

  if (shape.type === "alias") {
    return convertToOpenApiSchema(shape.value, apiDefinition);
  }

  if (shape.type === "object") {
    const properties: any = {};
    const required: string[] = [];
    if (shape.properties) {
      shape.properties.forEach((prop: any) => {
        const propSchema = convertToOpenApiSchema(prop.valueShape, apiDefinition);
        if (prop.description) {
          propSchema.description = prop.description;
        }
        properties[prop.key] = propSchema;

        // Add to required array if not optional
        if (!isOptional(prop.valueShape)) {
          required.push(prop.key);
        }
      });
    }
    const result: any = { type: "object", properties };
    if (required.length > 0) {
      result.required = required;
    }
    return result;
  }

  if (shape.type === "list") {
    // Mirror frontend logic from lines 276-281 - "list of {itemType}" or "lists of {itemType}"
    return { type: "array", items: convertToOpenApiSchema(shape.itemShape, apiDefinition) };
  }

  if (shape.type === "set") {
    // Mirror frontend logic from lines 282-287 - "set of {itemType}" or "sets of {itemType}"
    // Sets in OpenAPI are represented as arrays with uniqueItems: true
    return {
      type: "array",
      uniqueItems: true,
      items: convertToOpenApiSchema(shape.itemShape, apiDefinition)
    };
  }

  if (shape.type === "map") {
    // Mirror frontend logic from lines 288-293 - "map from {keyType} to {valueType}"
    // OpenAPI maps are objects with additionalProperties for the value type
    // Note: OpenAPI doesn't directly support non-string keys, but we document this in description
    const valueSchema = convertToOpenApiSchema(shape.valueShape, apiDefinition);
    if (shape.keyShape && shape.keyShape.type !== "primitive" ||
        (shape.keyShape?.value?.type && shape.keyShape.value.type !== "string")) {
      valueSchema.description = `Map from ${shape.keyShape?.type || "unknown"} keys to values${valueSchema.description ? `: ${valueSchema.description}` : ""}`;
    }
    return {
      type: "object",
      additionalProperties: valueSchema
    };
  }

  if (shape.type === "optional") {
    return convertToOpenApiSchema(shape.shape, apiDefinition);
  }

  if (shape.type === "nullable") {
    // Mirror frontend logic from lines 218-224 and 305 - adds " or null"
    const baseSchema = convertToOpenApiSchema(shape.shape, apiDefinition);
    return {
      oneOf: [
        baseSchema,
        { type: "null" }
      ]
    };
  }

  if (shape.type === "enum") {
    // Extract actual enum values, handling both primitive values and object references
    const enumValues = shape.values.map((value: any) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return value;
      } else if (value && typeof value === "object") {
        // If it's an object, try to extract the actual value
        if (value.value !== undefined) {
          return value.value;
        } else if (value.name !== undefined) {
          return value.name;
        } else if (value.key !== undefined) {
          return value.key;
        }
        // If we can't extract a meaningful value, convert to string
        return JSON.stringify(value);
      }
      return String(value);
    });
    return { type: "string", enum: enumValues };
  }

  if (shape.type === "literal") {
    return { type: "string", enum: [shape.value] };
  }

  if (shape.type === "union" || shape.type === "undiscriminatedUnion") {
    // Mirror frontend logic from lines 254-267 - variants are displayed as "type1 or type2"
    const variants = shape.union || shape.variants;
    if (variants && variants.length > 0) {
      return { oneOf: variants.map((variant: any) => convertToOpenApiSchema(variant.shape || variant, apiDefinition)) };
    }
    return {};
  }

  if (shape.type === "discriminatedUnion") {
    // Discriminated unions are treated as objects with oneOf for the variants
    const variants = shape.union || shape.variants;
    if (variants && variants.length > 0) {
      return { oneOf: variants.map((variant: any) => convertToOpenApiSchema(variant.shape || variant, apiDefinition)) };
    }
    return { type: "object" };
  }

  // Handle id references - look up the actual type definition
  if (shape.type === "id") {
    if (apiDefinition && apiDefinition.types && apiDefinition.types[shape.id]) {
      const typeDef = apiDefinition.types[shape.id];
      const resolvedSchema = convertToOpenApiSchema(typeDef.shape, apiDefinition);
      // Add description from the type definition if available
      if (typeDef.description && !resolvedSchema.description) {
        resolvedSchema.description = typeDef.description;
      }
      return resolvedSchema;
    }
    // Frontend would show this as the shape.id or "any", we'll create a flexible schema
    return { description: `Reference to ${shape.id}` };
  }

  if (shape.type === "unknown") {
    // Frontend shows this as "any" (line 303), create flexible schema
    return { description: shape.displayName || "Any type" };
  }

  // Fallback for unhandled types - frontend shows "<unknown>" (line 304)
  return { description: `Unhandled type: ${shape.type}` };
}

/**
 * Generates OpenAPI spec from EndpointContext, mirroring frontend structure
 */
export function generateOpenApiFromEndpointContext(
  context: EndpointContext,
  path: string,
  method: string
): any {
  const { endpoint, types, auth, globalHeaders } = context;
  
  const openApiSpec: any = {
    paths: {
      [path]: {
        [method]: {
          operationId: endpoint.operationId || endpoint.id,
          summary: endpoint.displayName || endpoint.id,
          description: typeof endpoint.description === "string" ? endpoint.description : undefined,
          tags: endpoint.namespace ? [endpoint.namespace] : undefined,
          parameters: [],
          requestBody: undefined,
          responses: {}
        }
      }
    }
  };

  // Add path parameters
  if (endpoint.pathParameters && endpoint.pathParameters.length > 0) {
    endpoint.pathParameters.forEach(param => {
      openApiSpec.paths[path][method].parameters.push(
        createOpenApiParameter(param, "path", { types })
      );
    });
  }

  // Add query parameters
  if (endpoint.queryParameters && endpoint.queryParameters.length > 0) {
    endpoint.queryParameters.forEach(param => {
      openApiSpec.paths[path][method].parameters.push(
        createOpenApiParameter(param, "query", { types })
      );
    });
  }

  // Mirror the exact headers construction logic from EndpointContentLeft.tsx:120-124
  let authHeader: any = null;
  if (auth) {
    authHeader = createAuthHeaderParameter(auth, { types });
  }

  const headers = [
    ...(authHeader ? [authHeader] : []),
    ...(globalHeaders || []),
    ...(endpoint.requestHeaders || []),
  ];

  // Add all headers, converting to OpenAPI parameters
  headers.forEach(header => {
    if (header.name) {
      // Already converted to OpenAPI parameter (auth header)
      openApiSpec.paths[path][method].parameters.push(header);
    } else {
      // Convert ObjectProperty to OpenAPI parameter
      openApiSpec.paths[path][method].parameters.push(
        createOpenApiParameter(header, "header", { types })
      );
    }
  });

  // Add request body - mirror frontend logic from EndpointContentLeft.tsx:196-225
  if (endpoint.requests?.[0] != null) {
    const request = endpoint.requests[0]; // Like frontend, use first request for single request handling

    if (request && request.body) {
      const body = request.body as any;
      let requestBody: any = {
        description: request.description,
        content: {}
      };

      if (body.type === "object") {
        requestBody.content["application/json"] = {
          schema: convertToOpenApiSchema(body, { types })
        };
      } else if (body.type === "alias") {
        requestBody.content["application/json"] = {
          schema: convertToOpenApiSchema(body.value, { types })
        };
      } else if (body.type === "bytes") {
        requestBody.content["application/octet-stream"] = {
          schema: { type: "string", format: "binary" }
        };
      } else if (body.type === "formData") {
        requestBody.content["multipart/form-data"] = {
          schema: {
            type: "object",
            properties: body.fields?.reduce((acc: any, field: any) => {
              acc[field.key] = convertToOpenApiSchema(field.valueShape, { types });
              return acc;
            }, {}) || {}
          }
        };
      } else {
        // Handle other body types
        requestBody.content["application/json"] = {
          schema: convertToOpenApiSchema(body, { types })
        };
      }

      openApiSpec.paths[path][method].requestBody = requestBody;
    }

    // TODO: Handle multiple requests case like EndpointMultipleRequestSection
    // For now, we focus on single request like the primary frontend path
  }

  // Add responses - mirror frontend logic from EndpointContentLeft.tsx:229-261
  if (endpoint.responses?.[0] != null) {
    const response = endpoint.responses[0]; // Like frontend, use first response for single response handling

    const statusCode = response.statusCode?.toString() || "200";
    let responseBody: any = {
      description: response.description || `Response with status ${statusCode}`,
      content: {}
    };

    if (response.body) {
      const body = response.body as any;
      if (body.type === "object") {
        responseBody.content["application/json"] = {
          schema: convertToOpenApiSchema(body, { types })
        };
      } else if (body.type === "alias") {
        responseBody.content["application/json"] = {
          schema: convertToOpenApiSchema(body.value, { types })
        };
      } else if (body.type === "empty") {
        // No content for empty responses
      } else if (body.type === "fileDownload") {
        responseBody.content["application/octet-stream"] = {
          schema: { type: "string", format: "binary" }
        };
      } else if (body.type === "streamingText") {
        responseBody.content["text/plain"] = {
          schema: { type: "string" }
        };
      } else if (body.type === "stream") {
        responseBody.content["application/json"] = {
          schema: convertToOpenApiSchema(body.payload, { types })
        };
      } else {
        // Handle other body types
        responseBody.content["application/json"] = {
          schema: convertToOpenApiSchema(body, { types })
        };
      }
    }

    openApiSpec.paths[path][method].responses[statusCode] = responseBody;

    // TODO: Handle multiple responses case like EndpointMultipleResponseSection
    // For now, we focus on single response like the primary frontend path
  } else {
    // Add default response if none specified
    openApiSpec.paths[path][method].responses["200"] = {
      description: "Successful response"
    };
  }

  // Add errors - mirror frontend logic from EndpointContentLeft.tsx:262-268
  if (endpoint.errors && endpoint.errors.length > 0) {
    endpoint.errors.forEach(error => {
      const errorStatusCode = error.statusCode?.toString() || "400";
      openApiSpec.paths[path][method].responses[errorStatusCode] = {
        description: error.description || `Error response with status ${errorStatusCode}`,
        content: error.body ? {
          "application/json": {
            schema: convertToOpenApiSchema(error.body, { types })
          }
        } : {}
      };
    });
  }

  return openApiSpec;
}
