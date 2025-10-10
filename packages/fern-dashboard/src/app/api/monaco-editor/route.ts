import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

        // Return HTML with hydration script
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
        // Send changes back to parent window
        window.parent.postMessage({
          type: "monaco-value-change",
          value: value
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
</html>`,
            {
                headers: {
                    "Content-Type": "text/html"
                }
            }
        );
    } catch (error) {
        console.error("Error rendering Monaco editor:", error);
        return new NextResponse(
            `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: #1e1e1e;
      color: #d4d4d4;
    }
  </style>
</head>
<body>
  <div>Error rendering editor: ${error instanceof Error ? error.message : "Unknown error"}</div>
</body>
</html>`,
            {
                status: 500,
                headers: {
                    "Content-Type": "text/html"
                }
            }
        );
    }
}
