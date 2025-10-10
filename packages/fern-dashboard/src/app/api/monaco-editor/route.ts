import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * API route to server-side render the Monaco editor with Shiki highlighting
 * Based on: https://github.com/pi0/modern-monaco-demo
 */
export async function GET(req: NextRequest) {
    try {
        // Get code from query params or use default
        const { searchParams } = new URL(req.url);
        const code =
            searchParams.get("code") ||
            `console.log('Hello, world!');

// Try editing this code!
function greet(name) {
  return \`Hello, \${name}!\`;
}

greet('Fern');`;

        const language = searchParams.get("language") || "javascript";
        const theme = searchParams.get("theme") || "material-theme-darker";

        // Map language to proper file extension
        const extensionMap: Record<string, string> = {
            javascript: "js",
            typescript: "ts",
            python: "py",
            json: "json",
            html: "html",
            css: "css"
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
      min-height: 500px;
    }
  </style>
</head>
<body>
  ${editorHTML}
  <script type="module">
    import { hydrate } from "https://esm.sh/modern-monaco";

    hydrate({
      lsp: {
        typescript: {
          importMap: {
            imports: {
              "modern-monaco/": "https://esm.sh/modern-monaco/",
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
        return new NextResponse("Error rendering editor", { status: 500 });
    }
}
