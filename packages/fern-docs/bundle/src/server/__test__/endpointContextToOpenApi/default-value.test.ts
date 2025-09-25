import { OpenApiYamlFormatter } from "../../endpointContextToOpenApi";

describe("OpenApiYamlFormatter - Default Values", () => {
  let formatter: OpenApiYamlFormatter;

  beforeEach(() => {
    formatter = new OpenApiYamlFormatter();
  });

  it("should handle primitive default values correctly", () => {
    // Arrange - Mock with various primitive default values
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "string_with_default",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "hello world" }
              }
            },
            {
              key: "integer_with_default",
              valueShape: {
                type: "primitive",
                value: { type: "integer", default: 42 }
              }
            },
            {
              key: "boolean_with_default",
              valueShape: {
                type: "primitive",
                value: { type: "boolean", default: true }
              }
            },
            {
              key: "double_with_default",
              valueShape: {
                type: "primitive",
                value: { type: "double", default: 3.14 }
              }
            },
            {
              key: "field_without_default",
              valueShape: {
                type: "primitive",
                value: { type: "string" }
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
              required: [string_with_default, integer_with_default, boolean_with_default, double_with_default, field_without_default]
              properties:
                string_with_default:
                  type: string
                  default: hello world
                integer_with_default:
                  type: integer
                  default: 42
                boolean_with_default:
                  type: boolean
                  default: true
                double_with_default:
                  type: number
                  format: double
                  default: 3.14
                field_without_default:
                  type: string
      responses:
        200:
          description: Response with status 200
          content:
            application/json:
              schema:
                type: string`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());

    // Additional specific checks for default values
    expect(yamlOutput).toMatch(/string_with_default:\s+type: string\s+default: hello world/);
    expect(yamlOutput).toMatch(/integer_with_default:\s+type: integer\s+default: 42/);
    expect(yamlOutput).toMatch(/boolean_with_default:\s+type: boolean\s+default: true/);
    expect(yamlOutput).toMatch(/double_with_default:\s+type: number\s+format: double\s+default: 3\.14/);

    // Verify field without default doesn't have default
    expect(yamlOutput).toMatch(/field_without_default:\s+type: string$/m);
  });

  it("should handle string default values that need quoting", () => {
    // Arrange - Mock with string defaults that need special handling
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "quoted_string",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "hello: world" }
              }
            },
            {
              key: "numeric_string",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "123" }
              }
            },
            {
              key: "boolean_string",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "true" }
              }
            },
            {
              key: "null_string",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "null" }
              }
            },
            {
              key: "empty_string",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "" }
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

    // Assert - Specific checks for quoted strings
    expect(yamlOutput).toContain('default: hello: world'); // colon should be handled
    expect(yamlOutput).toContain('default: 123'); // numeric strings
    expect(yamlOutput).toContain('default: true'); // boolean strings
    expect(yamlOutput).toContain('default: "null"'); // null strings (quoted because it's a string value)
    expect(yamlOutput).toContain('default: '); // empty strings
  });

  it("should handle default values in nullable types", () => {
    // Arrange - Mock with nullable types that have defaults
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "nullable_with_default",
              valueShape: {
                type: "nullable",
                shape: {
                  type: "primitive",
                  value: { type: "string", default: "default_value" }
                }
              }
            },
            {
              key: "nullable_integer_with_default",
              valueShape: {
                type: "nullable",
                shape: {
                  type: "primitive",
                  value: { type: "integer", default: 0 }
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

    // Assert - Nullable types with defaults
    expect(yamlOutput).toMatch(/nullable_with_default:\s+type: \[string, "null"\]\s+default: default_value/);
    expect(yamlOutput).toMatch(/nullable_integer_with_default:\s+type: \[integer, "null"\]\s+default: 0/);
  });

  it("should handle default values in optional types", () => {
    // Arrange - Mock with optional types that have defaults
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "optional_with_default",
              valueShape: {
                type: "optional",
                shape: {
                  type: "primitive",
                  value: { type: "string", default: "optional_default" }
                }
              }
            },
            {
              key: "required_field",
              valueShape: {
                type: "primitive",
                value: { type: "string" }
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

    // Assert - Optional types with defaults
    expect(yamlOutput).toMatch(/optional_with_default:\s+type: string\s+default: optional_default/);

    // Check required array excludes optional field but includes required field
    expect(yamlOutput).toContain('required: [required_field]');
  });

  it("should handle default values in discriminated union variants", () => {
    // Arrange - Mock discriminated union with default values
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "discriminatedUnion",
          discriminant: "type",
          variants: [
            {
              discriminantValue: "user",
              properties: [
                {
                  key: "name",
                  valueShape: {
                    type: "primitive",
                    value: { type: "string", default: "Anonymous" }
                  }
                },
                {
                  key: "age",
                  valueShape: {
                    type: "primitive",
                    value: { type: "integer", default: 18 }
                  }
                }
              ]
            },
            {
              discriminantValue: "admin",
              properties: [
                {
                  key: "permissions",
                  valueShape: {
                    type: "primitive",
                    value: { type: "string", default: "read" }
                  }
                }
              ]
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

    // Assert - Default values in discriminated union variants
    expect(yamlOutput).toContain('default: Anonymous');
    expect(yamlOutput).toContain('default: 18');
    expect(yamlOutput).toContain('default: read');

    // Check discriminator structure
    expect(yamlOutput).toContain('oneOf:');
    expect(yamlOutput).toContain('discriminator:');
    expect(yamlOutput).toContain('propertyName: type');
  });

  it("should handle default values in extended objects", () => {
    // Arrange - Mock object that extends another with default values
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          extends: ["BaseUser"],
          properties: [
            {
              key: "email",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "user@example.com" }
              }
            },
            {
              key: "role",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "member" }
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

    const mockApiDefinition = {
      types: {
        "BaseUser": {
          name: "BaseUser",
          shape: {
            type: "object",
            extends: [],
            properties: [
              {
                key: "id",
                valueShape: {
                  type: "primitive",
                  value: { type: "string", default: "generated-id" }
                }
              },
              {
                key: "name",
                valueShape: { type: "primitive", value: { type: "string" } }
              }
            ]
          }
        }
      }
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, mockApiDefinition);

    // Assert - Default values in extends scenario
    expect(yamlOutput).toContain('default: generated-id'); // From BaseUser
    expect(yamlOutput).toContain('default: user@example.com'); // From current object
    expect(yamlOutput).toContain('default: member'); // From current object

    // Check for allOf structure
    expect(yamlOutput).toContain('allOf:');
  });

  it("should handle complex default values (arrays, objects)", () => {
    // Arrange - Mock with complex default values
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "tags",
              valueShape: {
                type: "list",
                itemShape: { type: "primitive", value: { type: "string" } },
                default: ["tag1", "tag2"]
              }
            },
            {
              key: "metadata",
              valueShape: {
                type: "primitive",
                value: {
                  type: "string",
                  default: '{"key": "value", "count": 0}'
                }
              }
            },
            {
              key: "flags",
              valueShape: {
                type: "map",
                keyShape: { type: "primitive", value: { type: "string" } },
                valueShape: { type: "primitive", value: { type: "boolean" } },
                default: { "enabled": true, "debug": false }
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

    // Assert - Complex default values
    expect(yamlOutput).toMatch(/tags:\s+type: array/);
    expect(yamlOutput).toMatch(/metadata:\s+type: string/);
    expect(yamlOutput).toMatch(/flags:\s+type: object/);

    // Check that defaults are present (exact format may vary for complex types)
    expect(yamlOutput).toContain('default:');
  });

  it("should handle mixed default values with deprecated and nullable", () => {
    // Arrange - Mock with combination of default, deprecated, and nullable
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/test" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "normal_field",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "normal_default" }
              }
            },
            {
              key: "deprecated_with_default",
              valueShape: {
                type: "primitive",
                value: { type: "string", default: "deprecated_default" }
              },
              availability: { status: "deprecated" }
            },
            {
              key: "nullable_with_default",
              valueShape: {
                type: "nullable",
                shape: {
                  type: "primitive",
                  value: { type: "integer", default: 999 }
                }
              }
            },
            {
              key: "optional_deprecated_with_default",
              valueShape: {
                type: "optional",
                shape: {
                  type: "primitive",
                  value: { type: "boolean", default: false }
                }
              },
              availability: { status: "deprecated" }
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

    // Assert - All combinations work together
    expect(yamlOutput).toMatch(/normal_field:\s+type: string\s+default: normal_default/);
    expect(yamlOutput).toMatch(/deprecated_with_default:\s+type: string\s+default: deprecated_default\s+deprecated: true/);
    expect(yamlOutput).toMatch(/nullable_with_default:\s+type: \[integer, "null"\]\s+default: 999/);
    expect(yamlOutput).toMatch(/optional_deprecated_with_default:\s+type: boolean\s+default: false\s+deprecated: true/);

    // Check required array
    expect(yamlOutput).toContain('required: [normal_field, deprecated_with_default, nullable_with_default]');
  });
});