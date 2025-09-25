import { OpenApiYamlFormatter } from "../../endpointContextToOpenApi";

describe("OpenApiYamlFormatter - Nullable Types", () => {
  let formatter: OpenApiYamlFormatter;

  beforeEach(() => {
    formatter = new OpenApiYamlFormatter();
  });

  it("should handle nullable primitive types using OpenAPI 3.1.1 format", () => {
    // Arrange - Mock with nullable primitive types
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "nullable_string",
              valueShape: {
                type: "nullable",
                shape: { type: "primitive", value: { type: "string" } }
              }
            },
            {
              key: "nullable_integer",
              valueShape: {
                type: "nullable",
                shape: { type: "primitive", value: { type: "integer" } }
              }
            },
            {
              key: "nullable_boolean",
              valueShape: {
                type: "nullable",
                shape: { type: "primitive", value: { type: "boolean" } }
              }
            }
          ]
        }
      }],
      responses: [{
        statusCode: 200,
        body: { type: "primitive", value: { type: "string" } }
      }]
    };

    const mockApiDefinition = { types: {} };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, mockApiDefinition);

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/test:
    post:
      operationId: test-endpoint
      summary: test-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [nullable_string, nullable_integer, nullable_boolean]
              properties:
                nullable_string:
                  type: [string, "null"]
                nullable_integer:
                  type: [integer, "null"]
                nullable_boolean:
                  type: [boolean, "null"]
      responses:
        200:
          description: Response with status 200
          content:
            application/json:
              schema:
                type: string`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());

    // Additional specific checks for nullable formats
    expect(yamlOutput).toContain('type: [string, "null"]'); // OpenAPI 3.1.1 format for string
    expect(yamlOutput).toContain('type: [integer, "null"]'); // OpenAPI 3.1.1 format for integer
    expect(yamlOutput).toContain('type: [boolean, "null"]'); // OpenAPI 3.1.1 format for boolean
  });

  it("should handle nullable complex types using oneOf format", () => {
    // Arrange - Mock with nullable complex types that should use oneOf
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "nullable_object",
              valueShape: {
                type: "nullable",
                shape: {
                  type: "object",
                  properties: [
                    {
                      key: "name",
                      valueShape: { type: "primitive", value: { type: "string" } }
                    }
                  ]
                }
              }
            },
            {
              key: "nullable_array",
              valueShape: {
                type: "nullable",
                shape: {
                  type: "list",
                  itemShape: { type: "primitive", value: { type: "string" } }
                }
              }
            }
          ]
        }
      }],
      responses: [{
        statusCode: 200,
        body: { type: "primitive", value: { type: "string" } }
      }]
    };

    const mockApiDefinition = { types: {} };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, mockApiDefinition);

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/test:
    post:
      operationId: test-endpoint
      summary: test-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [nullable_object, nullable_array]
              properties:
                nullable_object:
                  oneOf:
                    -
                      type: object
                      required: [name]
                      properties:
                        name:
                          type: string
                    -
                      type: "null"
                nullable_array:
                  oneOf:
                    -
                      type: array
                      items:
                        type: string
                    -
                      type: "null"
      responses:
        200:
          description: Response with status 200
          content:
            application/json:
              schema:
                type: string`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());

    // Additional specific checks for nullable complex types
    expect(yamlOutput).toContain('oneOf:'); // Complex types should use oneOf
    expect(yamlOutput).toContain('type: "null"'); // null type in oneOf
    expect(yamlOutput).not.toContain('type: [object'); // Objects should not use array format
    expect(yamlOutput).not.toContain('type: [array'); // Arrays should not use array format
  });

  it("should handle mixed nullable and non-nullable fields", () => {
    // Arrange - Mock with mix of nullable and regular fields
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "required_string",
              valueShape: { type: "primitive", value: { type: "string" } }
            },
            {
              key: "nullable_string",
              valueShape: {
                type: "nullable",
                shape: { type: "primitive", value: { type: "string" } }
              }
            },
            {
              key: "optional_string",
              valueShape: {
                type: "optional",
                shape: { type: "primitive", value: { type: "string" } }
              }
            },
            {
              key: "nullable_optional_string",
              valueShape: {
                type: "nullable",
                shape: {
                  type: "optional",
                  shape: { type: "primitive", value: { type: "string" } }
                }
              }
            }
          ]
        }
      }],
      responses: [{
        statusCode: 200,
        body: { type: "primitive", value: { type: "string" } }
      }]
    };

    const mockApiDefinition = { types: {} };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, mockApiDefinition);

    // Assert - Specific checks for mixed nullable/non-nullable
    expect(yamlOutput).toContain('type: [string, "null"]'); // nullable primitive
    expect(yamlOutput).toMatch(/required_string:\s+type: string/); // regular field
    expect(yamlOutput).toMatch(/optional_string:\s+type: string/); // optional field (no nullable)
    expect(yamlOutput).toMatch(/nullable_optional_string:\s+type: \[string, "null"\]/); // nullable optional

    // Check required array only contains non-optional fields
    expect(yamlOutput).toContain('required: [required_string, nullable_string, nullable_optional_string]');
  });
});