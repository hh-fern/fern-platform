import { OpenApiYamlFormatter } from "../../endpointContextToOpenApi";

describe("OpenApiYamlFormatter - Alias Type Tests", () => {
  let formatter: OpenApiYamlFormatter;

  beforeEach(() => {
    formatter = new OpenApiYamlFormatter();
  });

  it("should handle alias wrapping id reference", () => {
    // Arrange - Endpoint with alias type referencing an id (real-world usage)
    const mockEndpoint = {
      id: "alias-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/alias" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "user",
              valueShape: {
                type: "alias",
                value: {
                  type: "id",
                  id: "User"
                }
              }
            }
          ]
        }
      }]
    };

    const mockApiDefinition = {
      types: {
        User: {
          description: "User object",
          shape: {
            type: "object",
            properties: [
              {
                key: "name",
                valueShape: { type: "primitive", value: { type: "string" } }
              },
              {
                key: "email",
                valueShape: { type: "primitive", value: { type: "string" } }
              }
            ]
          }
        }
      }
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, mockApiDefinition);

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/alias:
    post:
      operationId: alias-endpoint
      summary: alias-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [user]
              properties:
                user:
                  type: object
                  description: User object
                  required: [name, email]
                  properties:
                    name:
                      type: string
                    email:
                      type: string
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });

  it("should handle alias wrapping id reference to enum", () => {
    // Arrange - Endpoint with alias referencing an enum type
    const mockEndpoint = {
      id: "alias-enum-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/alias-enum" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "status",
              valueShape: {
                type: "alias",
                value: {
                  type: "id",
                  id: "StatusEnum"
                }
              }
            }
          ]
        }
      }]
    };

    const mockApiDefinition = {
      types: {
        StatusEnum: {
          description: "Status enumeration",
          shape: {
            type: "enum",
            values: ["pending", "approved", "rejected"]
          }
        }
      }
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, mockApiDefinition);

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/alias-enum:
    post:
      operationId: alias-enum-endpoint
      summary: alias-enum-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [status]
              properties:
                status:
                  type: string
                  description: Status enumeration
                  enum: [pending, approved, rejected]
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });

  it("should handle alias wrapping id reference to discriminated union", () => {
    // Arrange - Endpoint with alias referencing a discriminated union
    const mockEndpoint = {
      id: "alias-union-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/alias-union" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "payment",
              valueShape: {
                type: "alias",
                value: {
                  type: "id",
                  id: "PaymentMethod"
                }
              }
            }
          ]
        }
      }]
    };

    const mockApiDefinition = {
      types: {
        PaymentMethod: {
          description: "Payment method options",
          shape: {
            type: "discriminatedUnion",
            discriminant: "type",
            variants: [
              {
                discriminantValue: "card",
                displayName: "Credit Card",
                properties: [
                  {
                    key: "card_number",
                    valueShape: { type: "primitive", value: { type: "string" } }
                  }
                ],
                extends: [],
                extraProperties: false
              }
            ]
          }
        }
      }
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, mockApiDefinition);

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/alias-union:
    post:
      operationId: alias-union-endpoint
      summary: alias-union-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [payment]
              properties:
                payment:
                  description: Payment method options
                  oneOf:
                    -
                      type: object
                      description: Credit Card variant
                      required: [type, card_number]
                      properties:
                        type:
                          type: string
                          description: "Discriminator value: card"
                          enum: [card]
                        card_number:
                          type: string
                  discriminator:
                    propertyName: type
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });

  it("should handle alias with missing id reference", () => {
    // Arrange - Endpoint with alias referencing a non-existent type
    const mockEndpoint = {
      id: "missing-alias-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/missing-alias" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "missing_type",
              valueShape: {
                type: "alias",
                value: {
                  type: "id",
                  id: "NonExistentType"
                }
              }
            }
          ]
        }
      }]
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, { types: {} });

    // Expected YAML output - should fallback gracefully
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/missing-alias:
    post:
      operationId: missing-alias-endpoint
      summary: missing-alias-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [missing_type]
              properties:
                missing_type:
                  description: Reference to NonExistentType
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });
});
