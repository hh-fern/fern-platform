import { OpenApiYamlFormatter } from "../../endpointContextToOpenApi";

describe("OpenApiYamlFormatter - Union Type Tests", () => {
  let formatter: OpenApiYamlFormatter;

  beforeEach(() => {
    formatter = new OpenApiYamlFormatter();
  });

  it("should handle undiscriminated unions", () => {
    // Arrange - Endpoint with undiscriminated union
    const mockEndpoint = {
      id: "union-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/union" }],
      requests: [{
        body: {
          type: "undiscriminatedUnion",
          union: [
            { type: "primitive", value: { type: "string" } },
            { type: "primitive", value: { type: "integer" } },
            {
              type: "object",
              properties: [
                {
                  key: "name",
                  valueShape: { type: "primitive", value: { type: "string" } }
                }
              ]
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
  /api/union:
    post:
      operationId: union-endpoint
      summary: union-endpoint
      requestBody:
        content:
          application/json:
            schema:
              oneOf:
                -
                  type: string
                -
                  type: integer
                -
                  type: object
                  required: [name]
                  properties:
                    name:
                      type: string
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });

  it("should handle nullable types", () => {
    // Arrange - Endpoint with nullable field
    const mockEndpoint = {
      id: "nullable-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/nullable" }],
      requests: [{
        body: {
          type: "object",
          properties: [
            {
              key: "nullable_field",
              valueShape: {
                type: "nullable",
                shape: { type: "primitive", value: { type: "string" } }
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
  /api/nullable:
    post:
      operationId: nullable-endpoint
      summary: nullable-endpoint
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [nullable_field]
              properties:
                nullable_field:
                  oneOf:
                    -
                      type: string
                    -
                      type: null
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });
});
