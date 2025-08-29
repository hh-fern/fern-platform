import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useMDXComponents } from "@mdx-js/react";
import { DOMSerializer } from "@tiptap/pm/model";
import {
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  useCurrentEditor,
} from "@tiptap/react";
import DOMPurify from "dompurify";
import { getMDXComponent } from "mdx-bundler/client";
import { string } from "zod";

import { ChildrenMiddlewareProvider } from "@fern-docs/components";
import { htmlToMdx } from "@fern-docs/mdx";

import { bundleMDX } from "@/app/[orgName]/(visual-editor)/editor/[docsUrl]/[branch]/[...slug]/bundleEditorMdx";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/docs/components/error-boundary";
import { MDX_COMPONENTS } from "@/docs/mdx/components";

import { UnsupportedContent } from "../UnsupportedContent";
import { useCSS } from "./CSSContext";
import { StyleInjector } from "./StyleInjector";
import {
  convertJSXToHTML,
  hasJSXSyntax,
  looksLikeHTML,
} from "./jsx-to-html-converter";

// Separate components to avoid mount-remount cycles
const LoadingComponent = React.memo(() => <Skeleton className="h-24 w-full" />);
LoadingComponent.displayName = "LoadingComponent";

interface MDXWrapperProps {
  code: string;
  hash: string;
  components: ReturnType<typeof useMDXComponents>;
}

const MDXWrapper = React.memo(({ code, hash, components }: MDXWrapperProps) => {
  const MDXComponent = useMemo(() => {
    try {
      console.info(
        "[CustomElementNodeView] Rendering MDX component:",
        "with hash:",
        hash
      );
      return getMDXComponent(code);
    } catch (error) {
      console.warn(
        "[CustomElementNodeView] Failed to create MDX component:",
        "with hash:",
        hash,
        "Error:",
        error
      );
      throw error;
    }
  }, [code, name, hash]);

  return <MDXComponent components={components} />;
});
MDXWrapper.displayName = "MDXWrapper";

interface HTMLWrapperProps {
  content: string;
  css: string[];
  inlineCss: string[];
  hash: string;
  name?: string;
}

const HTMLWrapper = React.memo(
  ({ content, css, inlineCss, hash, name }: HTMLWrapperProps) => {
    console.info(
      "[CustomElementNodeView] Rendering HTML content for element with hash:",
      hash,
      "name:",
      name
    );

    return (
      <>
        <StyleInjector
          styles={[
            ...inlineCss,
            ...css,
            "html-content comment { display: none; }",
          ].join("\n")}
          id={hash}
        />
        <div id={`custom-element-${hash}`} className="custom-element-container">
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(content),
            }}
            className="html-content"
          />
        </div>
      </>
    );
  }
);
HTMLWrapper.displayName = "HTMLWrapper";

interface FallbackWrapperProps {
  code?: string;
  name?: string;
  textContent: string;
}

const FallbackWrapper = React.memo(
  ({ code, name, textContent }: FallbackWrapperProps) => {
    const Component = useMemo(() => {
      if (code && name && typeof MDX_COMPONENTS[name] !== "undefined") {
        try {
          return getMDXComponent(code);
        } catch (error) {
          console.warn("Failed to create fallback MDX component:", error);
        }
      }
      return () => <UnsupportedContent>{textContent}</UnsupportedContent>;
    }, [code, name, textContent]);

    return <Component />;
  }
);
FallbackWrapper.displayName = "FallbackWrapper";

// Main renderer component that handles all the conditional logic internally
interface CustomElementRendererProps {
  name: string;
  code: string | undefined;
  htmlContent: { content: string; css: string[] } | null;
  inlineCss: string[];
  hash: string;
  components: ReturnType<typeof useMDXComponents>;
  textContent: string;
}

const CustomElementRenderer = React.memo(
  ({
    name,
    code,
    htmlContent,
    inlineCss,
    hash,
    components,
    textContent,
  }: CustomElementRendererProps) => {
    // Step 1: Try MDX rendering if we have code AND a valid MDX component name
    if (code != null && typeof MDX_COMPONENTS[name] !== "undefined") {
      try {
        return <MDXWrapper code={code} hash={hash} components={components} />;
      } catch (error) {
        console.warn(
          "[CustomElementNodeView] Failed to create MDX component:",
          name,
          "with hash:",
          hash,
          "Error:",
          error
        );
        // Fall through to HTML rendering if MDX fails
      }
    } else if (code != null && typeof MDX_COMPONENTS[name] === "undefined") {
      console.warn(
        "[CustomElementNodeView] MDX component name not found in MDX_COMPONENTS:",
        name,
        "with hash:",
        hash
      );
    }

    // Step 2: Try HTML rendering if content looks like HTML
    if (htmlContent) {
      return (
        <HTMLWrapper
          content={htmlContent.content}
          css={htmlContent.css}
          inlineCss={inlineCss}
          hash={hash}
          name={name}
        />
      );
    }

    // Step 3: Fallback to unsupported content
    console.warn(
      "[CustomElementNodeView] Falling back to unsupported content for element with hash:",
      hash,
      "name:",
      name,
      "textContent:",
      textContent
    );
    return (
      <FallbackWrapper code={code} name={name} textContent={textContent} />
    );
  }
);
CustomElementRenderer.displayName = "CustomElementRenderer";

interface CustomElementBundling {
  type: "BUNDLING";
}

interface CustomElementError {
  type: "ERROR";
  message: string;
}

interface CustomElementBundled {
  type: "BUNDLED";
  code: string;
}

type CustomElementState =
  | CustomElementBundling
  | CustomElementBundled
  | CustomElementError;

export const CustomElementNodeView = (props: NodeViewProps) => {
  const [state, setState] = useState<CustomElementState>({ type: "BUNDLING" });
  const { node, getPos } = props;
  const { attrs, textContent } = node;

  // Access the editor instance
  const { editor } = useCurrentEditor();

  // Get the HTML representation of this specific node
  const getNodeHTML = useCallback(() => {
    if (!editor || typeof getPos !== "function") return "";

    const pos = getPos();
    if (pos == null) {
      return "<span />";
    }

    const nodeSize = node.nodeSize;

    // Create a slice containing just this node
    const slice = editor.state.doc.slice(pos, pos + nodeSize);

    // Convert the slice to HTML using the editor's serializer
    const dom = DOMSerializer.fromSchema(editor.schema).serializeFragment(
      slice.content
    );
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(dom);

    return tempDiv.innerHTML;
  }, [editor, node, getPos]);

  const originalHTML = getNodeHTML();
  console.log("Original HTML:", originalHTML);
  const { mdx } = htmlToMdx(originalHTML);
  console.log("Corresponding MDX: ", mdx);

  useEffect(() => {
    (async () => {
      const result = await bundleMDX(mdx);
      setState({ type: "BUNDLED", code: result.code });
      console.log(result);
    })();
  }, [mdx, setState]);

  const name = attrs["fve-data-name"];
  const hash = attrs["fve-data-hash"];

  const cssConfig = useCSS();
  const components = useMDXComponents();

  const originalElement: any = undefined;

  // Extract CSS from config
  const inlineCss = useMemo(() => {
    return cssConfig?.inline && Array.isArray(cssConfig.inline)
      ? cssConfig.inline
      : [];
  }, [cssConfig?.inline]);

  // Process HTML content if available
  const htmlContent = useMemo(() => {
    if (!originalElement?.content) {
      return null;
    }

    let content = originalElement.content;
    let extractedCSS: string[] = [];

    // Check if content has JSX syntax first
    if (hasJSXSyntax(originalElement.content)) {
      try {
        // TODO: investigate if we can use mdxToHtml function from convert.ts instead
        const result = convertJSXToHTML(originalElement.content);
        content = result.html;
        extractedCSS = result.css;
        return { content, css: extractedCSS };
      } catch (error) {
        console.warn("Failed to convert JSX to HTML:", error);
        // Fall back to original content
        content = originalElement.content;
      }
    }

    // Check if it looks like HTML (after JSX conversion)
    if (looksLikeHTML(content)) {
      return { content, css: extractedCSS };
    }

    return null;
  }, [originalElement?.content]);

  return (
    <ErrorBoundary
      fallback={
        <NodeViewWrapper>
          <UnsupportedContent>{textContent}</UnsupportedContent>
        </NodeViewWrapper>
      }
    >
      <NodeViewWrapper>
        {state.type === "BUNDLING" ? (
          <LoadingComponent />
        ) : state.type === "ERROR" ? (
          <UnsupportedContent>{textContent}</UnsupportedContent>
        ) : (
          <ChildrenMiddlewareProvider value={(_) => <NodeViewContent />}>
            <CustomElementRenderer
              name={name}
              code={state.code}
              htmlContent={htmlContent}
              inlineCss={inlineCss}
              hash={hash}
              components={components}
              textContent={textContent}
            />
          </ChildrenMiddlewareProvider>
        )}
      </NodeViewWrapper>
    </ErrorBoundary>
  );
};
