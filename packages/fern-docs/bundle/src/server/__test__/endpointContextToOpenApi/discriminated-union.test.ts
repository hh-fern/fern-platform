import { OpenApiYamlFormatter } from "../../endpointContextToOpenApi";

describe("OpenApiYamlFormatter - Discriminated Union Conversion", () => {
  let formatter: OpenApiYamlFormatter;

  beforeEach(() => {
    formatter = new OpenApiYamlFormatter();
  });

  it("should convert a simple discriminated union to proper OpenAPI format", () => {
    // Arrange - Mock a simple discriminated union endpoint
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
              displayName: "User",
              description: "User variant",
              properties: [
                {
                  key: "name",
                  valueShape: { type: "primitive", value: { type: "string" } }
                },
                {
                  key: "email",
                  valueShape: { type: "primitive", value: { type: "string" } }
                }
              ],
              extends: [],
              extraProperties: false
            },
            {
              discriminantValue: "admin",
              displayName: "Admin",
              description: "Admin variant",
              properties: [
                {
                  key: "name",
                  valueShape: { type: "primitive", value: { type: "string" } }
                },
                {
                  key: "permissions",
                  valueShape: {
                    type: "list",
                    itemShape: { type: "primitive", value: { type: "string" } }
                  }
                }
              ],
              extends: [],
              extraProperties: false
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
      types: {}
    };

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
              oneOf:
                -
                  type: object
                  description: User variant
                  required: [type, name, email]
                  properties:
                    type:
                      type: string
                      description: "Discriminator value: user"
                      enum: [user]
                    name:
                      type: string
                    email:
                      type: string
                -
                  type: object
                  description: Admin variant
                  required: [type, name, permissions]
                  properties:
                    type:
                      type: string
                      description: "Discriminator value: admin"
                      enum: [admin]
                    name:
                      type: string
                    permissions:
                      type: array
                      items:
                        type: string
              discriminator:
                propertyName: type
      responses:
        200:
          description: Response with status 200
          content:
            application/json:
              schema:
                type: string`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());

    // Additional specific checks for discriminator properties
    expect(yamlOutput).toContain("discriminator:");
    expect(yamlOutput).toContain("propertyName: type");
    expect(yamlOutput).toContain('enum: [user]');
    expect(yamlOutput).toContain('enum: [admin]');
  });

  it("should generate proper YAML structure for discriminated union variants", () => {
    // Arrange - Mock endpoint with nested discriminated union in response
    const mockEndpoint = {
      id: "test-endpoint",
      method: "GET",
      path: [{ type: "literal", value: "/api/shapes" }],
      responses: [{
        statusCode: 200,
        body: {
          type: "discriminatedUnion",
          discriminant: "shape_type",
          variants: [
            {
              discriminantValue: "circle",
              displayName: "Circle",
              properties: [
                {
                  key: "radius",
                  valueShape: { type: "primitive", value: { type: "double" } }
                }
              ],
              extends: [],
              extraProperties: false
            },
            {
              discriminantValue: "rectangle",
              displayName: "Rectangle",
              properties: [
                {
                  key: "width",
                  valueShape: { type: "primitive", value: { type: "double" } }
                },
                {
                  key: "height",
                  valueShape: { type: "primitive", value: { type: "double" } }
                }
              ],
              extends: [],
              extraProperties: false
            }
          ]
        }
      }]
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, {});

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/shapes:
    get:
      operationId: test-endpoint
      summary: test-endpoint
      responses:
        200:
          description: Response with status 200
          content:
            application/json:
              schema:
                oneOf:
                  -
                    type: object
                    description: Circle variant
                    required: [shape_type, radius]
                    properties:
                      shape_type:
                        type: string
                        description: "Discriminator value: circle"
                        enum: [circle]
                      radius:
                        type: number
                        format: double
                  -
                    type: object
                    description: Rectangle variant
                    required: [shape_type, width, height]
                    properties:
                      shape_type:
                        type: string
                        description: "Discriminator value: rectangle"
                        enum: [rectangle]
                      width:
                        type: number
                        format: double
                      height:
                        type: number
                        format: double
                discriminator:
                  propertyName: shape_type`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());

    // Additional specific checks for discriminator properties
    expect(yamlOutput).toContain("discriminator:");
    expect(yamlOutput).toContain("propertyName: shape_type");
    expect(yamlOutput).toContain('enum: [circle]');
    expect(yamlOutput).toContain('enum: [rectangle]');
  });

  it("should handle discriminated union with optional properties correctly", () => {
    // Arrange - Mock with optional properties
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/optional" }],
      requests: [{
        body: {
          type: "discriminatedUnion",
          discriminant: "type",
          variants: [
            {
              discriminantValue: "basic",
              properties: [
                {
                  key: "name",
                  valueShape: { type: "primitive", value: { type: "string" } }
                },
                {
                  key: "optional_field",
                  valueShape: {
                    type: "optional",
                    shape: { type: "primitive", value: { type: "string" } }
                  }
                }
              ],
              extends: [],
              extraProperties: false
            }
          ]
        }
      }]
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, {});

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/optional:
    post:
      operationId: test-endpoint
      summary: test-endpoint
      requestBody:
        content:
          application/json:
            schema:
              oneOf:
                -
                  type: object
                  required: [type, name]
                  properties:
                    type:
                      type: string
                      description: "Discriminator value: basic"
                      enum: [basic]
                    name:
                      type: string
                    optional_field:
                      type: string
              discriminator:
                propertyName: type
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());

    // Additional specific checks for optional properties
    expect(yamlOutput).toContain("required: [type, name]");
    expect(yamlOutput).toContain("optional_field:");
    expect(yamlOutput).toContain("discriminator:");
    expect(yamlOutput).toContain("propertyName: type");
  });

  it("should generate complete valid OpenAPI 3.1 discriminated union YAML", () => {
    // Arrange - Comprehensive discriminated union test
    const mockEndpoint = {
      id: "payment-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/payment" }],
      requests: [{
        body: {
          type: "discriminatedUnion",
          discriminant: "payment_method",
          variants: [
            {
              discriminantValue: "card",
              displayName: "Credit Card",
              description: "Credit card payment",
              properties: [
                {
                  key: "card_number",
                  valueShape: { type: "primitive", value: { type: "string" } }
                },
                {
                  key: "expiry",
                  valueShape: { type: "primitive", value: { type: "string" } }
                }
              ],
              extends: [],
              extraProperties: false
            },
            {
              discriminantValue: "paypal",
              displayName: "PayPal",
              description: "PayPal payment",
              properties: [
                {
                  key: "email",
                  valueShape: { type: "primitive", value: { type: "string" } }
                }
              ],
              extends: [],
              extraProperties: false
            }
          ]
        }
      }]
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, {});

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/payment:
    post:
      operationId: payment-endpoint
      summary: payment-endpoint
      requestBody:
        content:
          application/json:
            schema:
              oneOf:
                -
                  type: object
                  description: Credit card payment
                  required: [payment_method, card_number, expiry]
                  properties:
                    payment_method:
                      type: string
                      description: "Discriminator value: card"
                      enum: [card]
                    card_number:
                      type: string
                    expiry:
                      type: string
                -
                  type: object
                  description: PayPal payment
                  required: [payment_method, email]
                  properties:
                    payment_method:
                      type: string
                      description: "Discriminator value: paypal"
                      enum: [paypal]
                    email:
                      type: string
              discriminator:
                propertyName: payment_method
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());

    // Additional specific checks for discriminator properties
    expect(yamlOutput).toContain("discriminator:");
    expect(yamlOutput).toContain("propertyName: payment_method");
    expect(yamlOutput).toContain('enum: [card]');
    expect(yamlOutput).toContain('enum: [paypal]');
  });

  it("should handle discriminated union variants that extend other types", () => {
    // Arrange - Mock with discriminated union variants extending base types
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/events" }],
      requests: [{
        body: {
          type: "discriminatedUnion",
          discriminant: "event_type",
          variants: [
            {
              discriminantValue: "message-start",
              displayName: "Message Start",
              extends: ["ChatMessageStartEvent"],
              properties: [] // No additional properties beyond extended type
            },
            {
              discriminantValue: "debug",
              displayName: "Debug Event",
              extends: ["ChatDebugEvent"],
              properties: [
                {
                  key: "debug_info",
                  valueShape: { type: "primitive", value: { type: "string" } }
                }
              ]
            }
          ]
        }
      }]
    };

    const mockApiDefinition = {
      types: {
        "ChatMessageStartEvent": {
          name: "ChatMessageStartEvent",
          shape: {
            type: "object",
            extends: ["ChatStreamEvent"],
            properties: [
              {
                key: "message_id",
                valueShape: { type: "primitive", value: { type: "string" } }
              }
            ]
          }
        },
        "ChatStreamEvent": {
          name: "ChatStreamEvent",
          shape: {
            type: "object",
            extends: [],
            properties: [
              {
                key: "event_timestamp",
                valueShape: { type: "primitive", value: { type: "string" } }
              }
            ]
          }
        },
        "ChatDebugEvent": {
          name: "ChatDebugEvent",
          shape: {
            type: "object",
            extends: ["ChatStreamEvent"],
            properties: [
              {
                key: "prompt",
                valueShape: {
                  type: "optional",
                  shape: { type: "primitive", value: { type: "string" } }
                }
              }
            ]
          }
        }
      }
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, mockApiDefinition);

    // Expected YAML output - should include properties from extended types
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/events:
    post:
      operationId: test-endpoint
      summary: test-endpoint
      requestBody:
        content:
          application/json:
            schema:
              oneOf:
                -
                  type: object
                  description: Message Start variant
                  required: [event_type, event_timestamp, message_id]
                  properties:
                    event_type:
                      type: string
                      description: "Discriminator value: message-start"
                      enum: [message-start]
                    event_timestamp:
                      type: string
                    message_id:
                      type: string
                -
                  type: object
                  description: Debug Event variant
                  required: [event_type, event_timestamp, debug_info]
                  properties:
                    event_type:
                      type: string
                      description: "Discriminator value: debug"
                      enum: [debug]
                    event_timestamp:
                      type: string
                    prompt:
                      type: string
                    debug_info:
                      type: string
              discriminator:
                propertyName: event_type
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());

    // Additional specific checks for extended properties
    expect(yamlOutput).toContain("event_timestamp:"); // From ChatStreamEvent
    expect(yamlOutput).toContain("message_id:"); // From ChatMessageStartEvent
    expect(yamlOutput).toContain("prompt:"); // From ChatDebugEvent
    expect(yamlOutput).toContain("debug_info:"); // From variant itself
  });

  it("should handle object types that extend other object types", () => {
    // Arrange - Mock with regular object types that have extends
    const mockEndpoint = {
      id: "test-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/users" }],
      requests: [{
        body: {
          type: "object",
          extends: ["BaseUser", "TimestampFields"],
          properties: [
            {
              key: "email",
              valueShape: { type: "primitive", value: { type: "string" } }
            }
          ]
        }
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
                valueShape: { type: "primitive", value: { type: "string" } }
              },
              {
                key: "name",
                valueShape: { type: "primitive", value: { type: "string" } }
              }
            ]
          }
        },
        "TimestampFields": {
          name: "TimestampFields",
          shape: {
            type: "object",
            extends: [],
            properties: [
              {
                key: "created_at",
                valueShape: { type: "primitive", value: { type: "datetime" } }
              },
              {
                key: "updated_at",
                valueShape: {
                  type: "optional",
                  shape: { type: "primitive", value: { type: "datetime" } }
                }
              }
            ]
          }
        }
      }
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, mockApiDefinition);

    // Expected YAML output - should include properties from all extended types
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/users:
    post:
      operationId: test-endpoint
      summary: test-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [id, name, created_at, email]
              properties:
                id:
                  type: string
                name:
                  type: string
                created_at:
                  type: string
                  format: date-time
                updated_at:
                  type: string
                  format: date-time
                email:
                  type: string
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());

    // Additional specific checks for extended properties
    expect(yamlOutput).toContain("id:"); // From BaseUser
    expect(yamlOutput).toContain("name:"); // From BaseUser
    expect(yamlOutput).toContain("created_at:"); // From TimestampFields
    expect(yamlOutput).toContain("updated_at:"); // From TimestampFields (optional)
    expect(yamlOutput).toContain("email:"); // From object itself
    expect(yamlOutput).toContain("required: [id, name, created_at, email]"); // Only required fields
  });
});
