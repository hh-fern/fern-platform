import { OpenApiYamlFormatter } from "../../endpointContextToOpenApi";

describe("OpenApiYamlFormatter - Primitive Type Tests", () => {
  let formatter: OpenApiYamlFormatter;

  beforeEach(() => {
    formatter = new OpenApiYamlFormatter();
  });

  it("should handle enum types", () => {
    // Arrange - Endpoint with enum
    const mockEndpoint = {
      id: "enum-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/enum" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "status",
              valueShape: {
                type: "enum",
                values: ["pending", "approved", "rejected"]
              }
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
  /api/enum:
    post:
      operationId: enum-endpoint
      summary: enum-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [status]
              properties:
                status:
                  type: string
                  enum: [pending, approved, rejected]
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });

  it("should handle literal types", () => {
    // Arrange - Endpoint with literal value
    const mockEndpoint = {
      id: "literal-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/literal" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "version",
              valueShape: {
                type: "literal",
                value: "1.0.0"
              }
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
  /api/literal:
    post:
      operationId: literal-endpoint
      summary: literal-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [version]
              properties:
                version:
                  type: string
                  enum: [1.0.0]
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });

  it("should handle set types with uniqueItems", () => {
    // Arrange - Endpoint with set type
    const mockEndpoint = {
      id: "set-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/set" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "tags",
              valueShape: {
                type: "set",
                itemShape: { type: "primitive", value: { type: "string" } }
              }
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
  /api/set:
    post:
      operationId: set-endpoint
      summary: set-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [tags]
              properties:
                tags:
                  type: array
                  items:
                    type: string
                  uniqueItems: true
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });

  it("should handle map types with additionalProperties", () => {
    // Arrange - Endpoint with map type
    const mockEndpoint = {
      id: "map-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/map" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "metadata",
              valueShape: {
                type: "map",
                keyShape: { type: "primitive", value: { type: "string" } },
                valueShape: { type: "primitive", value: { type: "string" } }
              }
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
  /api/map:
    post:
      operationId: map-endpoint
      summary: map-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [metadata]
              properties:
                metadata:
                  type: object
                  additionalProperties:
                    type: string
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });
});
