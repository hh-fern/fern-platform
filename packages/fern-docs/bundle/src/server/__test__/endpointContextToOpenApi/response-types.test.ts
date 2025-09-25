import { OpenApiYamlFormatter } from "../../endpointContextToOpenApi";

describe("OpenApiYamlFormatter - Response Type Tests", () => {
  let formatter: OpenApiYamlFormatter;

  beforeEach(() => {
    formatter = new OpenApiYamlFormatter();
  });

  it("should handle streaming text responses", () => {
    // Arrange - Endpoint with streaming text response
    const mockEndpoint = {
      id: "stream-endpoint",
      method: "GET",
      path: [{ type: "literal", value: "/api/stream" }],
      responses: [{
        statusCode: 200,
        body: {
          type: "streamingText"
        }
      }]
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, {});

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/stream:
    get:
      operationId: stream-endpoint
      summary: stream-endpoint
      responses:
        200:
          description: Response with status 200
          content:
            text/plain:
              schema:
                type: string`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });

  it("should handle stream responses with payload", () => {
    // Arrange - Endpoint with stream response containing payload
    const mockEndpoint = {
      id: "stream-endpoint",
      method: "GET",
      path: [{ type: "literal", value: "/api/events" }],
      responses: [{
        statusCode: 200,
        body: {
          type: "stream",
          payload: {
            type: "object",
            properties: [
              {
                key: "event",
                valueShape: { type: "primitive", value: { type: "string" } }
              },
              {
                key: "data",
                valueShape: { type: "primitive", value: { type: "string" } }
              }
            ]
          }
        }
      }]
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, {});

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/events:
    get:
      operationId: stream-endpoint
      summary: stream-endpoint
      responses:
        200:
          description: Response with status 200
          content:
            text/event-stream:
              schema:
                type: object
                required: [event, data]
                properties:
                  event:
                    type: string
                  data:
                    type: string`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });

  it("should handle file download responses", () => {
    // Arrange - Endpoint with file download response
    const mockEndpoint = {
      id: "download-endpoint",
      method: "GET",
      path: [{ type: "literal", value: "/api/download" }],
      responses: [{
        statusCode: 200,
        body: {
          type: "fileDownload"
        }
      }]
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, {});

    // Expected YAML output
    const expectedYaml = `openapi: 3.1.1
paths:
  /api/download:
    get:
      operationId: download-endpoint
      summary: download-endpoint
      responses:
        200:
          description: Response with status 200
          content:
            application/octet-stream:
              schema:
                type: string
                format: binary`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });
});
