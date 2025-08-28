import React, { useMemo } from "react";

import { useMDXComponents } from "@mdx-js/react";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import DOMPurify from "dompurify";
import { getMDXComponent } from "mdx-bundler/client";

import { ChildrenMiddlewareProvider } from "@fern-docs/components";

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/docs/components/error-boundary";
import { MDX_COMPONENTS } from "@/docs/mdx/components";
import { useOriginalElements } from "@/providers/OriginalElementsContext";

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
  name: string;
  hash: string;
  components: ReturnType<typeof useMDXComponents>;
}

const MDXWrapper = React.memo(
  ({ code, name, hash, components }: MDXWrapperProps) => {
    const MDXComponent = useMemo(() => {
      try {
        console.info(
          "[CustomElementNodeView] Rendering MDX component:",
          name,
          "with hash:",
          hash
        );
        return getMDXComponent(code);
      } catch (error) {
        console.warn(
          "[CustomElementNodeView] Failed to create MDX component:",
          name,
          "with hash:",
          hash,
          "Error:",
          error
        );
        throw error;
      }
    }, [code, name, hash]);

    return <MDXComponent components={components} />;
  }
);
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
  originalElement: any;
  htmlContent: { content: string; css: string[] } | null;
  inlineCss: string[];
  hash: string;
  components: ReturnType<typeof useMDXComponents>;
  textContent: string;
  originalElements: any;
}

const CustomElementRenderer = React.memo(
  ({
    originalElement,
    htmlContent,
    inlineCss,
    hash,
    components,
    textContent,
    originalElements,
  }: CustomElementRendererProps) => {
    // Check if we're about to show the loading skeleton
    if (originalElement?.content && !originalElement?.bundleAttempted) {
      console.info(
        "[CustomElementNodeView] Showing loading skeleton for element with hash:",
        hash,
        "name:",
        originalElement?.name
      );
      return <LoadingComponent />;
    }

    // Step 1: Try MDX rendering if we have code AND a valid MDX component name
    if (
      originalElement?.code &&
      originalElement?.name &&
      typeof MDX_COMPONENTS[originalElement.name] !== "undefined"
    ) {
      try {
        return (
          <MDXWrapper
            code={originalElement.code}
            name={originalElement.name}
            hash={hash}
            components={components}
          />
        );
      } catch (error) {
        console.warn(
          "[CustomElementNodeView] Failed to create MDX component:",
          originalElement.name,
          "with hash:",
          hash,
          "Error:",
          error
        );
        // Fall through to HTML rendering if MDX fails
      }
    } else if (
      originalElement?.code &&
      originalElement?.name &&
      typeof MDX_COMPONENTS[originalElement.name] === "undefined"
    ) {
      console.warn(
        "[CustomElementNodeView] MDX component name not found in MDX_COMPONENTS:",
        originalElement.name,
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
          name={originalElement?.name}
        />
      );
    }

    // Step 3: Fallback to unsupported content
    console.warn(
      "[CustomElementNodeView] Falling back to unsupported content for element with hash:",
      hash,
      "name:",
      originalElement?.name,
      "textContent:",
      textContent,
      "originalElements:",
      originalElements
    );
    return (
      <FallbackWrapper
        code={originalElement?.code}
        name={originalElement?.name}
        textContent={textContent}
      />
    );
  }
);
CustomElementRenderer.displayName = "CustomElementRenderer";

export const CustomElementNodeView = (props: NodeViewProps) => {
  const { attrs, textContent } = props.node;
  const hash = attrs["fve-data-hash"];

  const cssConfig = useCSS();
  const { originalElements } = useOriginalElements();
  const components = useMDXComponents();

  const originalElement = originalElements[hash];

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
        <ChildrenMiddlewareProvider value={(_) => <NodeViewContent />}>
          <CustomElementRenderer
            originalElement={originalElement}
            htmlContent={htmlContent}
            inlineCss={inlineCss}
            hash={hash}
            components={components}
            textContent={textContent}
            originalElements={originalElements}
          />
        </ChildrenMiddlewareProvider>
      </NodeViewWrapper>
    </ErrorBoundary>
  );
};
