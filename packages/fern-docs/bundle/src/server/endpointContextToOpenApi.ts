import { ApiDefinition } from "@fern-api/fdr-sdk";

/**
 * Utility to convert EndpointContext to OpenAPI spec, mirroring frontend rendering logic
 * This ensures consistency between frontend display and OpenAPI generation
 */

/**
 * Class to handle OpenAPI spec to YAML formatting
 */
export class OpenApiYamlFormatter {
  private static readonly SPACES_PER_LEVEL = 2;

  /**
   * Create indentation string for a given level
   */
  private indent(level: number): string {
    return ' '.repeat(level * OpenApiYamlFormatter.SPACES_PER_LEVEL);
  }

  /**
   * Add a simple key-value pair with proper indentation
   */
  private addKeyValue(lines: string[], key: string, value: any, level: number): void {
    if (value === undefined || value === null) return;
    lines.push(`${this.indent(level)}${key}: ${value}`);
  }

  /**
   * Add a description field with proper formatting and indentation
   */
  private addDescription(lines: string[], description: string, level: number, key: string = 'description'): void {
    const formattedDesc = this.formatYamlString(description, true);
    const indent = this.indent(level);

    if (formattedDesc.startsWith('|')) {
      // Handle pipe style with proper indentation
      const styleLines = formattedDesc.split('\n');
      lines.push(`${indent}${key}: ${styleLines[0]}`);
      styleLines.slice(1).forEach(line => {
        lines.push(`${indent}${line}`);
      });
    } else {
      lines.push(`${indent}${key}: ${formattedDesc}`);
    }
  }

  /**
   * Format content section (used by both request body and responses)
   */
  private formatContent(content: Record<string, any>, lines: string[], level: number): void {
    lines.push(`${this.indent(level)}content:`);
    Object.entries(content).forEach(([contentType, contentData]: [string, any]) => {
      lines.push(`${this.indent(level + 1)}${contentType}:`);
      lines.push(`${this.indent(level + 2)}schema:`);
      this.formatSchemaYaml(contentData.schema, lines, level + 3);
    });
  }

  /**
   * Smart YAML string formatting - only quote when necessary
   */
  private formatYamlString(value: any, isMultiline = false, isEnum = false): string {
    if (value === null || value === undefined) return 'null';
    if (value === '') return '""';

    const stringValue = String(value).trim();
    if (!stringValue) return '""';

    const hasMultipleLines = stringValue.includes('\n');

    const needsQuoting = isEnum
      ? /^(true|false|null|yes|no|on|off)$/i.test(stringValue) ||
        /^[-]?\d+(\.\d+)?$/.test(stringValue) ||
        stringValue.includes('"') ||
        stringValue.includes("'") ||
        stringValue.includes('\n')
      : /[:\[\]{},|>*&!%#`@]|^[-?]|^\d|^(true|false|null|yes|no|on|off)$/i.test(stringValue) ||
        stringValue.includes('\n') ||
        stringValue.includes('"') ||
        stringValue.includes("'");

    if (isMultiline && hasMultipleLines) {
      return `|\n${stringValue.split('\n').map(line => `  ${line}`).join('\n')}`;
    }

    if (needsQuoting) {
      // For enums, avoid escaping unless absolutely necessary
      if (isEnum && !stringValue.includes('"')) {
        return `'${stringValue}'`;
      }
      return `"${stringValue.replace(/"/g, '\\"')}"`;
    }

    return stringValue;
  }

  /**
   * Helper function to format schema as YAML with smart formatting
   */
  private formatSchemaYaml(schema: any, lines: string[], level: number): void {
    this.addKeyValue(lines, 'type', schema.type, level);
    this.addKeyValue(lines, 'format', schema.format, level);

    if (schema.description) {
      this.addDescription(lines, schema.description, level);
    }

    if (schema.enum && Array.isArray(schema.enum)) {
      const formattedEnums = schema.enum.map((e: any) =>
        this.formatYamlString(e, false, true)
      );
      this.addKeyValue(lines, 'enum', `[${formattedEnums.join(', ')}]`, level);
    }

    // Required should come after type/description but before properties (standard OpenAPI order)
    if (schema.required && Array.isArray(schema.required) && schema.required.length > 0) {
      const formattedRequired = schema.required.map((r: string) => this.formatYamlString(r));
      this.addKeyValue(lines, 'required', `[${formattedRequired.join(', ')}]`, level);
    }

    if (schema.properties && typeof schema.properties === 'object') {
      lines.push(`${this.indent(level)}properties:`);
      Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
        lines.push(`${this.indent(level + 1)}${key}:`);
        this.formatSchemaYaml(value, lines, level + 2);
      });
    }

    if (schema.items) {
      lines.push(`${this.indent(level)}items:`);
      this.formatSchemaYaml(schema.items, lines, level + 1);
    }

    if (schema.uniqueItems) {
      this.addKeyValue(lines, 'uniqueItems', 'true', level);
    }

    if (schema.additionalProperties !== undefined) {
      lines.push(`${this.indent(level)}additionalProperties:`);
      this.formatSchemaYaml(schema.additionalProperties, lines, level + 1);
    }

    if (schema.oneOf) {
      lines.push(`${this.indent(level)}oneOf:`);
      schema.oneOf.forEach((item: any) => {
        lines.push(`${this.indent(level + 1)}-`);
        this.formatSchemaYaml(item, lines, level + 2);
      });
    }

    if (schema.discriminator && typeof schema.discriminator === 'object') {
      lines.push(`${this.indent(level)}discriminator:`);
      if (schema.discriminator.propertyName) {
        this.addKeyValue(lines, 'propertyName', schema.discriminator.propertyName, level + 1);
      }
      if (schema.discriminator.mapping && typeof schema.discriminator.mapping === 'object') {
        lines.push(`${this.indent(level + 1)}mapping:`);
        Object.entries(schema.discriminator.mapping).forEach(([key, value]: [string, any]) => {
          this.addKeyValue(lines, key, value, level + 2);
        });
      }
    }
  }

  /**
   * Format parameters array for YAML
   */
  private formatParameters(parameters: any[], lines: string[], level: number): void {
    if (!parameters || parameters.length === 0) return;

    lines.push(`${this.indent(level)}parameters:`);

    parameters.forEach((param: any) => {
      const paramLevel = level + 1;
      lines.push(`${this.indent(paramLevel)}- name: ${param.name}`);
      this.addKeyValue(lines, 'in', param.in, paramLevel + 1);
      if (param.required) {
        this.addKeyValue(lines, 'required', 'true', paramLevel + 1);
      }
      if (param.description) {
        this.addDescription(lines, param.description, paramLevel + 1);
      }
      lines.push(`${this.indent(paramLevel + 1)}schema:`);
      this.formatSchemaYaml(param.schema, lines, paramLevel + 2);
    });
  }

  /**
   * Format request body for YAML
   */
  private formatRequestBody(requestBody: any, lines: string[], level: number): void {
    if (!requestBody) return;

    lines.push(`${this.indent(level)}requestBody:`);

    if (requestBody.description) {
      this.addDescription(lines, requestBody.description, level + 1);
    }

    this.formatContent(requestBody.content, lines, level + 1);
  }

  /**
   * Format responses for YAML
   */
  private formatResponses(responses: any, lines: string[], level: number): void {
    if (!responses || Object.keys(responses).length === 0) return;

    lines.push(`${this.indent(level)}responses:`);

    Object.entries(responses).forEach(([statusCode, response]: [string, any]) => {
      lines.push(`${this.indent(level + 1)}${statusCode}:`);
      if (response.description) {
        this.addDescription(lines, response.description, level + 2);
      }
      if (response.content && Object.keys(response.content).length > 0) {
        this.formatContent(response.content, lines, level + 2);
      }
    });
  }

  /**
   * Format a single operation for YAML
   */
  private formatOperation(operation: any, lines: string[], level: number): void {
    this.addKeyValue(lines, 'operationId', operation.operationId, level);
    this.addKeyValue(lines, 'summary', operation.summary, level);

    if (operation.description) {
      this.addDescription(lines, operation.description, level);
    }

    if (operation.tags && operation.tags.length > 0) {
      this.addKeyValue(lines, 'tags', `[${operation.tags.join(', ')}]`, level);
    }

    this.formatParameters(operation.parameters, lines, level);
    this.formatRequestBody(operation.requestBody, lines, level);
    this.formatResponses(operation.responses, lines, level);
  }

  /**
   * Format OpenAPI spec as YAML with improved formatting
   */
  private formatOpenApiAsYaml(spec: any): string {
    const lines: string[] = [];

    lines.push('openapi: 3.1.1');
    lines.push('paths:');

    Object.entries(spec.paths).forEach(([path, pathSpec]: [string, any]) => {
      lines.push(`${this.indent(1)}${path}:`);
      Object.entries(pathSpec).forEach(([method, operation]: [string, any]) => {
        lines.push(`${this.indent(2)}${method}:`);
        this.formatOperation(operation, lines, 3);
      });
    });

    return lines.join('\n');
  }

  /**
   * Generate OpenAPI YAML from an EndpointDefinition
   */
  public generateYamlFromEndpoint(
    endpoint: ApiDefinition.EndpointDefinition,
    apiDefinition?: any
  ): string {
    const path = ApiDefinition.toCurlyBraceEndpointPathLiteral(endpoint.path);
    const method = endpoint.method.toLowerCase();
    
    const context = {
      endpoint,
      types: apiDefinition?.types || {},
      auth: apiDefinition?.auths && endpoint.auth && endpoint.auth.length > 0 && endpoint.auth[0] 
        ? apiDefinition.auths[endpoint.auth[0]] 
        : undefined,
      globalHeaders: apiDefinition?.globalHeaders
    };
    
    const openApiSpec = generateOpenApiFromEndpointContext(context, path, method);
    
    // Convert to YAML
    return this.formatOpenApiAsYaml(openApiSpec);
  }
}

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

    // First, resolve properties from extended types
    if (shape.extends && shape.extends.length > 0 && apiDefinition?.types) {
      shape.extends.forEach((extendedTypeName: string) => {
        const extendedType = apiDefinition.types[extendedTypeName];
        if (extendedType && extendedType.shape) {
          const extendedSchema = convertToOpenApiSchema(extendedType.shape, apiDefinition);
          if (extendedSchema.properties) {
            // Merge extended properties (current object properties will override these)
            Object.assign(properties, extendedSchema.properties);
          }
          if (extendedSchema.required) {
            required.push(...extendedSchema.required);
          }
        }
      });
    }

    // Then, add/override with current object's properties
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
      // Remove duplicates from required array
      result.required = [...new Set(required)];
    }
    return result;
  }

  if (shape.type === "list") {
    return { type: "array", items: convertToOpenApiSchema(shape.itemShape, apiDefinition) };
  }

  if (shape.type === "set") {
    // Sets in OpenAPI are represented as arrays with uniqueItems: true
    return {
      type: "array",
      uniqueItems: true,
      items: convertToOpenApiSchema(shape.itemShape, apiDefinition)
    };
  }

  if (shape.type === "map") {
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
    const baseSchema = convertToOpenApiSchema(shape.shape, apiDefinition);
    return {
      oneOf: [
        baseSchema,
        { type: "null" }
      ]
    };
  }

  if (shape.type === "enum") {
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
    // variants are displayed as "type1 or type2"
    const variants = shape.union || shape.variants;
    if (variants && variants.length > 0) {
      return { oneOf: variants.map((variant: any) => convertToOpenApiSchema(variant.shape || variant, apiDefinition)) };
    }
    return {};
  }

  if (shape.type === "discriminatedUnion") {
    const variants = shape.variants || shape.union;
    if (!variants || variants.length === 0) {
      return { type: "object" };
    }

    const oneOfSchemas = variants.map((variant: any) => {
      // Build properties object with discriminator + variant properties
      const properties: Record<string, any> = {
        [shape.discriminant]: {
          type: "string",
          enum: [variant.discriminantValue],
          description: `Discriminator value: ${variant.discriminantValue}`
        }
      };
      const required = [shape.discriminant];

      // First, resolve properties from extended types
      if (variant.extends && variant.extends.length > 0 && apiDefinition?.types) {
        variant.extends.forEach((extendedTypeName: string) => {
          const extendedType = apiDefinition.types[extendedTypeName];
          if (extendedType && extendedType.shape) {
            const extendedSchema = convertToOpenApiSchema(extendedType.shape, apiDefinition);
            if (extendedSchema.properties) {
              // Merge extended properties (variant properties will override these)
              Object.assign(properties, extendedSchema.properties);
            }
            if (extendedSchema.required) {
              required.push(...extendedSchema.required);
            }
          }
        });
      }

      // Then, add/override with variant-specific properties
      if (variant.properties) {
        variant.properties.forEach((prop: any) => {
          properties[prop.key] = convertToOpenApiSchema(prop.valueShape, apiDefinition);
          if (prop.description) {
            properties[prop.key].description = prop.description;
          }
          // Add to required array if not optional
          if (!isOptional(prop.valueShape)) {
            required.push(prop.key);
          }
        });
      }

      // Use variant description or display name if available
      const description = variant.description ||
                         (variant.displayName ? `${variant.displayName} variant` : undefined);

      return {
        type: "object",
        properties,
        required: [...new Set(required)], // Remove duplicates
        ...(description && { description })
      };
    });

    return {
      oneOf: oneOfSchemas,
      discriminator: {
        propertyName: shape.discriminant
      }
    };
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
    // Frontend would show this as the shape.id or "any"
    return { description: `Reference to ${shape.id}` };
  }

  if (shape.type === "unknown") {
    // Frontend shows this as "any" (line 303)
    return { description: shape.displayName || "Any type" };
  }

  // Fallback for unhandled types - frontend shows "<unknown>"
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

  if (endpoint.pathParameters && endpoint.pathParameters.length > 0) {
    endpoint.pathParameters.forEach(param => {
      openApiSpec.paths[path][method].parameters.push(
        createOpenApiParameter(param, "path", { types })
      );
    });
  }

  if (endpoint.queryParameters && endpoint.queryParameters.length > 0) {
    endpoint.queryParameters.forEach(param => {
      openApiSpec.paths[path][method].parameters.push(
        createOpenApiParameter(param, "query", { types })
      );
    });
  }

  let authHeader: any = null;
  if (auth) {
    authHeader = createAuthHeaderParameter(auth, { types });
  }

  const headers = [
    ...(authHeader ? [authHeader] : []),
    ...(globalHeaders || []),
    ...(endpoint.requestHeaders || []),
  ];

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

  if (endpoint.requests?.[0] != null) {
    const request = endpoint.requests[0];

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
        requestBody.content["application/json"] = {
          schema: convertToOpenApiSchema(body, { types })
        };
      }

      openApiSpec.paths[path][method].requestBody = requestBody;
    }
  }

  if (endpoint.responses?.[0] != null) {
    const response = endpoint.responses[0];

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
        // Handle stream responses - resolve the shape properly
        const streamSchema = body.shape ? convertToOpenApiSchema(body.shape, { types }) : convertToOpenApiSchema(body.payload, { types });
        responseBody.content["text/event-stream"] = {
          schema: streamSchema
        };
      } else {
        responseBody.content["application/json"] = {
          schema: convertToOpenApiSchema(body, { types })
        };
      }
    }

    openApiSpec.paths[path][method].responses[statusCode] = responseBody;
  } else {
    openApiSpec.paths[path][method].responses["200"] = {
      description: "Successful response"
    };
  }

  if (endpoint.errors && endpoint.errors.length > 0) {
    endpoint.errors.forEach(error => {
      const errorStatusCode = error.statusCode?.toString() || "400";
      openApiSpec.paths[path][method].responses[errorStatusCode] = {
        description: error.description || `Error response with status ${errorStatusCode}`,
        content: {}
      };
    });
  }

  return openApiSpec;
}
