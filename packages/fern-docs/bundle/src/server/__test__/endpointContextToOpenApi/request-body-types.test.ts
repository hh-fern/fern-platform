import { OpenApiYamlFormatter } from "../../endpointContextToOpenApi";

describe("OpenApiYamlFormatter - Request Body Type Tests", () => {
  let formatter: OpenApiYamlFormatter;

  beforeEach(() => {
    formatter = new OpenApiYamlFormatter();
  });

  it("should handle bytes request body", () => {
    // Arrange - Endpoint with bytes request body
    const mockEndpoint = {
      id: "upload-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/upload" }],
      requests: [{
        body: {
          type: "bytes"
        }
      }]
    };

    // Act
    const yamlOutput = formatter.generateYamlFromEndpoint(mockEndpoint as any, {});

    // Assert
    expect(yamlOutput).toContain("application/octet-stream:");
    expect(yamlOutput).toContain("type: string");
    expect(yamlOutput).toContain("format: binary");
  });

  it("should handle form data request body", () => {
    // Arrange - Endpoint with form data
    const mockEndpoint = {
      id: "form-endpoint",
      method: "POST",
      path: [{ type: "literal", value: "/api/form" }],
      requests: [{
        body: {
          type: "formData",
          fields: [
            {
              key: "name",
              valueShape: { type: "primitive", value: { type: "string" } }
            },
            {
              key: "file",
              valueShape: { type: "primitive", value: { type: "string" } }
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
  /api/form:
    post:
      operationId: form-endpoint
      summary: form-endpoint
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                name:
                  type: string
                file:
                  type: string
      responses:
        200:
          description: Successful response`;

    // Assert - Compare complete YAML output
    expect(yamlOutput.trim()).toBe(expectedYaml.trim());
  });
});
