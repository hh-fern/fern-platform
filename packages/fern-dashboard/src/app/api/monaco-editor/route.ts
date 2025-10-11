import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * In-memory cache for rendered Monaco editors
 * Cache key format: `${code}-${language}-${theme}-${readOnly}`
 */
const renderCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory issues

/**
 * API route to server-side render the Monaco editor with Shiki highlighting
 * This avoids client-side initialization issues with VSCODE_TEXTMATE_DEBUG
 */
export async function GET(req: NextRequest) {
    try {
        // Get code from query params
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code") || "";
        const language = searchParams.get("language") || "javascript";
        const theme = searchParams.get("theme") || "material-theme-darker";
        const readOnly = searchParams.get("readOnly") !== "false"; // default true
        const iframeId = searchParams.get("iframeId") || ""; // iframe ID for identifying postMessage source

        // Create cache key (excluding iframeId since it's unique per instance)
        const cacheKey = `${code.substring(0, 100)}-${language}-${theme}-${readOnly}`;

        // Check in-memory cache first
        if (renderCache.has(cacheKey)) {
            console.log("[monaco-editor] Cache hit for:", { language, theme, codeLength: code.length });
            const cachedHtml = renderCache.get(cacheKey)!;
            // Replace the iframeId in the cached HTML with the current one
            const html = cachedHtml.replace(/iframeId: "[^"]*"/, `iframeId: "${iframeId}"`);
            return new NextResponse(html, {
                headers: {
                    "Content-Type": "text/html",
                    "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
                    "X-Cache": "HIT"
                }
            });
        }

        console.log("[monaco-editor] Cache miss, rendering:", { language, theme, codeLength: code.length });

        // Map language to proper file extension
        const extensionMap: Record<string, string> = {
            javascript: "js",
            typescript: "ts",
            python: "py",
            json: "json",
            html: "html",
            css: "css",
            go: "go",
            java: "java",
            ruby: "rb",
            php: "php",
            bash: "sh",
            shell: "sh",
            yaml: "yaml",
            yml: "yml"
        };
        const extension = extensionMap[language] || language;

        // Import modern-monaco SSR utilities (server-side only)
        const { renderToWebComponent } = await import("modern-monaco/ssr");

        // Render the editor to HTML
        const editorHTML = await renderToWebComponent(
            { code, filename: `example.${extension}` },
            {
                theme,
                padding: { top: 10, bottom: 10 },
                userAgent: req.headers.get("user-agent") || undefined
            }
        );

        // Build the HTML response
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Preload Monaco modules so browser caches them for all iframes -->
  <link rel="modulepreload" href="https://esm.sh/modern-monaco@0.2.2">
  <link rel="modulepreload" href="https://esm.sh/modern-monaco@0.2.2/es2022/shiki.mjs">
  <link rel="modulepreload" href="https://esm.sh/modern-monaco@0.2.2/es2022/workspace.mjs">
  <link rel="modulepreload" href="https://esm.sh/modern-monaco@0.2.2/es2022/dist/shiki-wasm.mjs">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 100%;
      height: 100%;
    }
    monaco-editor {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100%;
    }
  </style>
</head>
<body>
  ${editorHTML}
  <script type="module">
    import { hydrate } from "https://esm.sh/modern-monaco@0.2.2";

    hydrate({
      ${
          !readOnly
              ? `
      onChange: (value) => {
        // Send changes back to parent window with iframe ID
        window.parent.postMessage({
          type: "monaco-value-change",
          value: value,
          iframeId: "${iframeId}"
        }, "*");
      },
      `
              : ""
      }
      lsp: {
        typescript: {
          importMap: {
            imports: {
              "modern-monaco/": "https://esm.sh/modern-monaco@0.2.2/",
              "@shikijs/": "https://esm.sh/@shikijs/",
            },
          },
        },
      },
    });
  </script>
</body>
</html>`;

        // Store in cache (with size limit)
        if (renderCache.size >= MAX_CACHE_SIZE) {
            // Remove oldest entry (first key)
            const firstKey = renderCache.keys().next().value;
            if (firstKey) {
                renderCache.delete(firstKey);
            }
        }
        renderCache.set(cacheKey, html);

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html",
                // Cache for 1 hour - same code/language/theme will return cached version
                "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
                "X-Cache": "MISS"
            }
        });
    } catch (error) {
        console.error("Error rendering Monaco editor:", error);

        // Fallback to a simple read-only code display instead of failing
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code") || "";
        const language = searchParams.get("language") || "plaintext";

        return new NextResponse(
            `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow: auto;
      width: 100%;
      height: 100%;
      background: #1e1e1e;
    }
    pre {
      margin: 0;
      padding: 10px;
      color: #d4d4d4;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 22px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <pre><code>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
</body>
</html>`,
            {
                headers: {
                    "Content-Type": "text/html"
                }
            }
        );
    }
}
