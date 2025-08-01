"use client";

import { useCallback, useEffect, useRef } from "react";

import { MdxToHtmlResponse, OriginalElements, mdxToHtml } from "@fern-docs/mdx";

import { useMdxState } from "@/providers/MdxStateContext";
import {
  WithCode,
  useOriginalElements,
} from "@/providers/OriginalElementsContext";

import { useAIAssistant } from "./AIAssistantProvider";
import PageEditor, { PageEditorRef } from "./PageEditor";
import PageSubtitle from "./PageSubtitle";
import PageTitle from "./PageTitle";
import { bundleOriginalElements } from "./bundleOriginalElements";

export declare namespace PageContents {
  export interface Props {
    filename: string;
    initialHtml: MdxToHtmlResponse["html"];
    initialFrontmatter: MdxToHtmlResponse["frontmatter"];
    initialOriginalElements: MdxToHtmlResponse["originalElements"];
  }
}

export default function PageContents({
  filename,
  initialHtml,
  initialFrontmatter,
  initialOriginalElements,
}: PageContents.Props) {
  const { title, subtitle } = initialFrontmatter ?? {};
  const editorRef = useRef<PageEditorRef>(null);

  const { updateDependencies, changedMdxFiles, syncChanges } = useMdxState();

  const { originalElements, setOriginalElements } = useOriginalElements();
  const { setupAI } = useAIAssistant();

  useEffect(() => {
    void bundleOriginalElements(originalElements).then((bundled) => {
      setOriginalElements(bundled);
    });
  }, [originalElements, setOriginalElements]);

  useEffect(() => {
    updateDependencies(filename, {
      html: initialHtml,
      frontmatter: initialFrontmatter,
      originalElements: initialOriginalElements,
    });
  }, [
    filename,
    initialHtml,
    initialFrontmatter,
    initialOriginalElements,
    updateDependencies,
  ]);

  const changedMdxFile = changedMdxFiles[filename];

  // Watch for changes and sync to server
  useEffect(() => {
    syncChanges(filename);
  }, [changedMdxFile, filename, syncChanges]);

  const handleContentGenerated = useCallback(
    async (response: { content: string; placement: string }) => {
      try {
        // Clean up the generated markdown by trimming whitespace
        const cleanedMarkdown = response.content.trim();

        // Convert markdown to HTML for the TipTap editor and get originalElements
        const { html, originalElements: newOriginalElements } = mdxToHtml(
          cleanedMarkdown,
          {
            treatAsCustomElement: ["code"],
            treatAsUnsupported: ["math"],
          }
        );

        // Merge new AI-generated elements with existing ones
        const mergedElements = {
          ...originalElements,
          ...newOriginalElements,
        };

        // Update global originalElements state
        setOriginalElements(mergedElements as WithCode<OriginalElements>);

        if (editorRef.current) {
          // Debug: Log the placement value
          console.log("AI Content Placement Debug:", {
            placement: response.placement,
            contentPreview: html.substring(0, 100),
          });

          // Pass the complete merged originalElements to ensure new elements are included in stageChanges
          editorRef.current.insertContent(
            html,
            response.placement,
            mergedElements
          );
        }
      } catch (error) {
        console.error("Error converting generated markdown to HTML:", error);
      }
    },
    [setOriginalElements, originalElements]
  );

  // Helper function to clean HTML for AI processing
  const getCleanContent = useCallback(() => {
    if (!editorRef.current) return initialHtml;

    const html = editorRef.current.getHTML();

    // Remove data-hash attributes and other editor-specific attributes
    const cleanHtml = html
      .replace(/\s*data-hash="[^"]*"/g, "")
      .replace(/\s*data-[^=]*="[^"]*"/g, "")
      .replace(/\s*class="[^"]*"/g, "")
      .replace(/\s*style="[^"]*"/g, "")
      .trim();

    return cleanHtml;
  }, [initialHtml]);

  // Setup AI assistant when component mounts
  useEffect(() => {
    setupAI({
      currentHtml: initialHtml,
      pageContext: `Documentation page: ${title || "Untitled"}`,
      onContentGenerated: (response) => void handleContentGenerated(response),
      getCurrentContent: getCleanContent,
    });
  }, [setupAI, initialHtml, title, handleContentGenerated, getCleanContent]);

  return (
    <>
      <div className="max-w-content-width-wide mx-auto w-full">
        <PageTitle
          className="w-full"
          filename={filename}
          initialText={title ? String(title) : undefined}
        />
        <PageSubtitle
          className="w-full"
          filename={filename}
          initialText={subtitle ? String(subtitle) : undefined}
        />
        <PageEditor
          ref={editorRef}
          className="w-full"
          filename={filename}
          initialHtml={initialHtml}
        />
      </div>
    </>
  );
}
