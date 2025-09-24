import { createPruneKey } from "@fern-api/docs-loader";
import { DocsLoader } from "@fern-api/docs-server/docs-loader";
import { slugToHref } from "@fern-api/docs-utils";
import { ApiDefinition, FernNavigation } from "@fern-api/fdr-sdk";
import { EndpointDefinition, ObjectProperty } from "@fern-api/fdr-sdk/api-definition";
import { visitDiscriminatedUnion } from "@fern-api/ui-core-utils";
import { slugjoin } from "@fern-api/fdr-sdk/navigation";
import { isNonNullish } from "@fern-api/ui-core-utils";

import { convertToLlmTxtMarkdown } from "./llm-txt-md";
import { generateOpenApiFromEndpointContext } from "./endpointContextToOpenApi";

function generateEndpointSections(
  endpoint: EndpointDefinition,
  apiDefinition?: any
): string[] {
  const sections: string[] = [];

  const path = ApiDefinition.toCurlyBraceEndpointPathLiteral(endpoint.path);
  const method = endpoint.method.toLowerCase();

  // Create EndpointContext mirroring frontend exactly
  const context = {
    endpoint,
    types: apiDefinition?.types || {},
    auth: apiDefinition?.auths && endpoint.auth && endpoint.auth.length > 0 && endpoint.auth[0]
      ? apiDefinition.auths[endpoint.auth[0]]
      : undefined,
    globalHeaders: apiDefinition?.globalHeaders || []
  };

  // Generate OpenAPI spec using frontend-mirroring logic from endpointContextToOpenApi
  const openApiSpec = generateOpenApiFromEndpointContext(context, path, method);

  // Convert to YAML with proper structure
  const openApiYaml = formatOpenApiAsYaml(openApiSpec);
  sections.push(`## OpenAPI Specification\n\n\`\`\`yaml\n${openApiYaml}\n\`\`\``);

  return sections;
}


// Smart YAML string formatting - only quote when necessary
function formatYamlString(value: any, isMultiline = false, isEnum = false): string {
  if (value === null || value === undefined) return 'null';
  if (value === '') return '""';

  // Convert to string if it's not already and strip leading/trailing whitespace
  const stringValue = String(value).trim();
  if (!stringValue) return '""';

  // For enum values, be more permissive with quoting
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

  if (isMultiline && stringValue.length > 80) {
    // Use folded style for long descriptions (preserves line breaks as spaces)
    if (stringValue.includes('\n')) {
      // Use literal style for descriptions with explicit line breaks
      return `|\n${stringValue.split('\n').map(line => `  ${line}`).join('\n')}`;
    } else {
      // Use folded style for long single-line descriptions
      return `>\n  ${stringValue}`;
    }
  }

  if (needsQuoting) {
    // For enums, avoid escaping unless absolutely necessary
    if (isEnum && !stringValue.includes('"')) {
      return `'${stringValue}'`;
    }
    // Escape double quotes and use double quotes
    return `"${stringValue.replace(/"/g, '\\"')}"`;
  }

  return stringValue;
}

function formatOpenApiAsYaml(spec: any): string {
  const lines: string[] = [];

  Object.entries(spec.paths).forEach(([path, pathSpec]: [string, any]) => {
    lines.push(`${path}:`);
    Object.entries(pathSpec).forEach(([method, operation]: [string, any]) => {
      lines.push(`  ${method}:`);
      if (operation.operationId) lines.push(`    operationId: ${formatYamlString(operation.operationId)}`);
      if (operation.summary) lines.push(`    summary: ${formatYamlString(operation.summary)}`);
      if (operation.description) {
        const formattedDesc = formatYamlString(operation.description, true);
        lines.push(`    description: ${formattedDesc}`);
      }
      if (operation.tags && operation.tags.length > 0) {
        lines.push(`    tags: [${operation.tags.map((tag: string) => formatYamlString(tag)).join(', ')}]`);
      }

      if (operation.parameters && operation.parameters.length > 0) {
        lines.push(`    parameters:`);
        operation.parameters.forEach((param: any) => {
          lines.push(`      - name: ${formatYamlString(param.name)}`);
          lines.push(`        in: ${param.in}`);
          if (param.required) lines.push(`        required: true`);
          if (param.description) lines.push(`        description: ${formatYamlString(param.description, true)}`);
          lines.push(`        schema:`);
          formatSchemaYaml(param.schema, lines, '          ');
        });
      }

      if (operation.requestBody) {
        lines.push(`    requestBody:`);
        if (operation.requestBody.description) {
          lines.push(`      description: ${formatYamlString(operation.requestBody.description, true)}`);
        }
        if (operation.requestBody.content && Object.keys(operation.requestBody.content).length > 0) {
          lines.push(`      content:`);
          Object.entries(operation.requestBody.content).forEach(([contentType, content]: [string, any]) => {
            lines.push(`        ${formatYamlString(contentType)}:`);
            lines.push(`          schema:`);
            formatSchemaYaml(content.schema, lines, '            ');
          });
        }
      }

      if (operation.responses && Object.keys(operation.responses).length > 0) {
        lines.push(`    responses:`);
        Object.entries(operation.responses).forEach(([statusCode, response]: [string, any]) => {
          lines.push(`      ${formatYamlString(statusCode)}:`);
          if (response.description) lines.push(`        description: ${formatYamlString(response.description, true)}`);
          if (response.content && Object.keys(response.content).length > 0) {
            lines.push(`        content:`);
            Object.entries(response.content).forEach(([contentType, content]: [string, any]) => {
              lines.push(`          ${formatYamlString(contentType)}:`);
              lines.push(`            schema:`);
              formatSchemaYaml(content.schema, lines, '              ');
            });
          }
        });
      }
    });
  });

  return lines.join('\n');
}

function formatSchemaYaml(schema: any, lines: string[], indent: string): void {
  if (schema.type) {
    lines.push(`${indent}type: ${schema.type}`);
  }
  if (schema.format) {
    lines.push(`${indent}format: ${schema.format}`);
  }
  if (schema.description) {
    const formattedDesc = formatYamlString(schema.description, true);
    if (formattedDesc.startsWith('>') || formattedDesc.startsWith('|')) {
      // Handle folded/literal style with proper indentation
      const styleLines = formattedDesc.split('\n');
      lines.push(`${indent}description: ${styleLines[0]}`);
      styleLines.slice(1).forEach(line => {
        lines.push(`${indent}${line}`);
      });
    } else {
      lines.push(`${indent}description: ${formattedDesc}`);
    }
  }
  if (schema.enum && Array.isArray(schema.enum)) {
    // Use enum-specific formatting to avoid unnecessary escaping
    const formattedEnums = schema.enum.map((e: any) => {
      return formatYamlString(e, false, true);
    });
    lines.push(`${indent}enum: [${formattedEnums.join(', ')}]`);
  }
  // Required should come after type/description but before properties (standard OpenAPI order)
  if (schema.required && Array.isArray(schema.required) && schema.required.length > 0) {
    const formattedRequired = schema.required.map((r: string) => formatYamlString(r));
    lines.push(`${indent}required: [${formattedRequired.join(', ')}]`);
  }

  if (schema.properties && typeof schema.properties === 'object') {
    lines.push(`${indent}properties:`);
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      // Property keys might need quoting if they contain special characters
      const formattedKey = formatYamlString(key);
      if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
        lines.push(`${indent}  ${formattedKey}:`);
      } else {
        lines.push(`${indent}  ${key}:`);
      }
      formatSchemaYaml(value, lines, `${indent}    `);
    });
  }
  if (schema.items) {
    lines.push(`${indent}items:`);
    formatSchemaYaml(schema.items, lines, `${indent}  `);
  }

  if (schema.uniqueItems) {
    lines.push(`${indent}uniqueItems: true`);
  }
  if (schema.additionalProperties !== undefined) {
    lines.push(`${indent}additionalProperties:`);
    if (typeof schema.additionalProperties === 'boolean') {
      lines.push(`${indent}  ${schema.additionalProperties}`);
    } else {
      formatSchemaYaml(schema.additionalProperties, lines, `${indent}  `);
    }
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    lines.push(`${indent}oneOf:`);
    schema.oneOf.forEach((item: any) => {
      lines.push(`${indent}  -`);
      formatSchemaYaml(item, lines, `${indent}    `);
    });
  }
}

export async function getMarkdownForPath(
  node: FernNavigation.NavigationNodePage,
  loader: DocsLoader,
  domain?: string
): Promise<{ content: string; contentType: "markdown" | "mdx" } | undefined> {
  if (FernNavigation.isApiLeaf(node)) {
    const apiDefinition = await loader.getPrunedApi(
      node.apiDefinitionId,
      createPruneKey(node)
    );
    if (apiDefinition == null) {
      return undefined;
    }
    if (node.type === "endpoint") {
      const endpoint = apiDefinition.endpoints[node.endpointId];
      if (endpoint == null) {
        return undefined;
      }
      return {
        content: endpointDefinitionToMarkdown(endpoint, node, domain, apiDefinition),
        contentType: "mdx",
      };
    }
  }

  const pageId = FernNavigation.getPageId(node);
  if (pageId == null) {
    return undefined;
  }

  const page = await loader.getPage(pageId);
  if (!page) {
    return undefined;
  }

  return {
    content: convertToLlmTxtMarkdown(
      page.markdown,
      node.title,
      pageId.endsWith(".mdx") ? "mdx" : "md"
    ),
    contentType: pageId.endsWith(".mdx") ? "mdx" : "markdown",
  };
}

export function getPageNodeForPath(
  root: FernNavigation.RootNode | undefined,
  path: string
): FernNavigation.NavigationNodePage | undefined {
  if (root == null) {
    return undefined;
  }
  const found = FernNavigation.utils.findNode(root, slugjoin(path));
  if (found.type !== "found" || !FernNavigation.isPage(found.node)) {
    return undefined;
  }
  return found.node;
}

export function endpointDefinitionToMarkdown(
  endpoint: EndpointDefinition,
  node: FernNavigation.NavigationNodePage,
  domain?: string,
  apiDefinition?: any
): string {
  const pageHref = slugToHref(node.canonicalSlug ?? node.slug);
  const fullUrl = domain ? `https://${domain}${pageHref}` : undefined;

  const endpointSections = generateEndpointSections(endpoint, apiDefinition);
  
  const examplesContent = endpoint.examples
    ?.flatMap((example) => {
      
      // We have examples for all status codes (although the code will be repeated)
      // So only process examples with response status code 201
      // Only skip if the status code is not a 2xx "OK" HTTP status code
      if (typeof example.responseStatusCode !== "number" || example.responseStatusCode < 200 || example.responseStatusCode >= 300) {
        return [];
      }
      
      return Object.entries(example.snippets ?? {}).flatMap(([language, snippets]) => {
        // Filter out curl snippets, since AI should know how to use curl. SDK examples are specific to that generated SDK, so that would be helpful to use.
        if (language === "curl") {
          return [];
        }
        
        return snippets.map(
          (snippet) => {
            return ({
              language,
              snippet,
              name: snippet.name ?? example.name,
            }) as const;
          }
        );
      });
    })
    .map(
      ({ language, snippet, name }) =>
        `\`\`\`${language}${name != null ? ` ${name}` : ""}\n${snippet.code}\n\`\`\``
    )
    .join("\n\n");

  const hasExamples = examplesContent && examplesContent.trim().length > 0;

  return [
    `# ${node.title}`,
    [
      `${endpoint.method} ${endpoint.environments?.find((env) => env.id === endpoint.defaultEnvironment)?.baseUrl ?? endpoint.environments?.[0]?.baseUrl ?? ""}${ApiDefinition.toCurlyBraceEndpointPathLiteral(endpoint.path)}`,
      endpoint.requests?.[0] != null
        ? `Content-Type: ${endpoint.requests[0].contentType}`
        : undefined,
    ]
      .filter(isNonNullish)
      .join("\n"),
    typeof endpoint.description === "string" ? endpoint.description : undefined,
    fullUrl ? `Reference: ${fullUrl}` : undefined,
    hasExamples ? "## SDK Examples" : undefined,
    hasExamples ? examplesContent : undefined,
    ...endpointSections,
  ]
    .filter(isNonNullish)
    .join("\n\n");
}
