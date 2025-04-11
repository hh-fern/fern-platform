import express from 'express';


const app = express();
const port = 3001;

const mockDocsData = {
  message: "Mock response from the docs-loader server."
};

const mockLoadDocsForUrlResponse = {
  baseUrl: {
    domain: "example.com",
    basePath: "/docs",
  },
  definition: {
    apisV2: {
      "api-1": {
        id: "api-1",
        name: "Example API",
        endpoints: {
          "endpoint-1": {
            id: "endpoint-1",
            method: "GET",
            path: "/example",
            description: "Example endpoint",
          },
        },
      },
    },
    pages: {
      "page-1": {
        id: "page-1",
        title: "Example Page",
        content: "Example page content.",
      },
    },
  },
  lightModeEnabled: true,
};

async function mockLoadWithUrl(domain: string) {
  return mockLoadDocsForUrlResponse;
}


app.get('/api/docs', (_, res) => {
  res.json(mockDocsData);
});

app.get('/api/metadata', (_, res) => {
  res.json({
    domain: "example.com",
    basePath: "/docs",
    url: "https://example.com/docs",
    org: "Example Org",
    isPreview: false,
  });
});

app.get('/api/files', (_, res) => {
  res.json({
    "file-1": {
      src: "https://example.com/file-1",
    },
  });
});

app.get('/api/pruned-api/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    name: "Example API",
    endpoints: {
      "endpoint-1": {
        id: "endpoint-1",
        method: "GET",
        path: "/example",
        description: "An example endpoint",
      },
    },
  });
});

app.get('/api/endpoint/:apiId/:endpointId', (req, res) => {
  const { apiId, endpointId } = req.params;
  res.json({
    apiId,
    endpoint: {
      id: endpointId,
      method: "GET",
      path: "/example",
      description: "An example endpoint",
    },
  });
});

app.get('/api/page/:pageId', (req, res) => {
  const { pageId } = req.params;
  res.json({
    filename: pageId,
    markdown: "This is an example page content.",
  });
});

// Start server
app.listen(port, () => {
  console.log(`Mock docs-loader server running at http://localhost:${port}`);
});