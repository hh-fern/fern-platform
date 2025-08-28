import React, { useMemo } from "react";

import { useMDXComponents } from "@mdx-js/react";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import DOMPurify from "dompurify";
import { getMDXComponent } from "mdx-bundler/client";

import {
  ChildrenMiddlewareProvider,
  useChildrenMiddleware,
} from "@fern-docs/components";

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

export const CustomElementNodeView = (props: NodeViewProps) => {
  const { attrs, textContent } = props.node;
  const hash = attrs["fve-data-hash"];

  const cssConfig = useCSS();
  const { originalElements } = useOriginalElements();
  const components = useMDXComponents();

  const originalElement = originalElements[hash];

  // Check that the element has code and is supported, otherwise return undefined
  function getComponentIfExists(
    code: string | undefined,
    name: string | undefined
  ) {
    return code && name && typeof MDX_COMPONENTS[name] !== "undefined"
      ? getMDXComponent(code)
      : undefined;
  }

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

  const Component = useMemo(() => {
    // Logging: Check if we're about to show the loading skeleton
    if (originalElement?.content && !originalElement?.bundleAttempted) {
      console.info(
        "[CustomElementNodeView] Showing loading skeleton for element with hash:",
        hash,
        "name:",
        originalElement?.name
      );
      const LoadingComponent = () => <Skeleton className="h-24 w-full" />;
      LoadingComponent.displayName = "LoadingComponent";
      return LoadingComponent;
    }

    // Step 1: Try MDX rendering if we have code AND a valid MDX component name
    if (
      originalElement?.code &&
      originalElement?.name &&
      typeof MDX_COMPONENTS[originalElement.name] !== "undefined"
    ) {
      try {
        console.info(
          "[CustomElementNodeView] Rendering MDX component:",
          originalElement.name,
          "with hash:",
          hash
        );
        const MDXComponent = getMDXComponent(originalElement.code);
        const MDXWrapper = () => <MDXComponent components={components} />;
        MDXWrapper.displayName = "MDXWrapper";
        return MDXWrapper;
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
      console.info(
        "[CustomElementNodeView] Rendering HTML content for element with hash:",
        hash,
        "name:",
        originalElement?.name
      );
      const HTMLWrapper = () => (
        <>
          <StyleInjector
            styles={[
              ...inlineCss,
              ...htmlContent.css,
              "html-content comment { display: none; }",
            ].join("\n")}
            id={hash}
          />
          <div
            id={`custom-element-${hash}`}
            className="custom-element-container"
          >
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(htmlContent.content),
              }}
              className="html-content"
            />
          </div>
        </>
      );
      HTMLWrapper.displayName = "HTMLWrapper";
      return HTMLWrapper;
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
    const fallbackComponent =
      getComponentIfExists(originalElement?.code, originalElement?.name) ??
      (() => <UnsupportedContent>{textContent}</UnsupportedContent>);
    return fallbackComponent;
  }, [
    originalElement?.code,
    originalElement?.name,
    originalElement?.bundleAttempted,
    originalElement?.content,
    htmlContent,
    inlineCss,
    hash,
    components,
    textContent,
  ]);

  return (
    <ErrorBoundary
      fallback={
        <NodeViewWrapper>
          <UnsupportedContent>{textContent}</UnsupportedContent>
        </NodeViewWrapper>
      }
    >
      <NodeViewWrapper>
        {/* <ChildrenMiddlewareProvider value={(_) => <NodeViewContent />}>
          <Component />
        </ChildrenMiddlewareProvider> */}
        <ChildrenMiddlewareProvider value={(_) => <NodeViewContent />}>
          <Testing />
        </ChildrenMiddlewareProvider>
      </NodeViewWrapper>
    </ErrorBoundary>
  );
};

function Testing({ children }: React.PropsWithChildren) {
  const intercepted = useChildrenMiddleware(children);
  return intercepted;
}
