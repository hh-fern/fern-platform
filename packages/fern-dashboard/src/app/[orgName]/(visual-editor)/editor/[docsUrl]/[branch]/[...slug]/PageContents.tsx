"use client";

import { useCallback, useEffect, useRef } from "react";

import { MdxToHtmlResponse, OriginalElements, mdxToHtml } from "@fern-docs/mdx";

import { AIAssistant } from "@/components/editor/ai-assistant";
import { useMdxState } from "@/providers/MdxStateContext";
import {
  WithCode,
  useOriginalElements,
} from "@/providers/OriginalElementsContext";

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

        // Debug logging
        console.log("=== AI CONTENT INSERTION DEBUG ===");
        console.log("Original HTML:", html);
        console.log("New originalElements:", newOriginalElements);
        console.log(
          "Existing originalElements keys:",
          Object.keys(originalElements)
        );

        // Let's try a simpler approach - just proceed normally and see what actually happens
        const uniqueElements: OriginalElements = {};
        const updatedHtml = html;

        Object.entries(newOriginalElements).forEach(([hash, element]) => {
          if (originalElements[hash]) {
            console.log(`COLLISION DETECTED for hash: ${hash}`);
            console.log("Existing element:", originalElements[hash]);
            console.log("New element:", element);
          }
          uniqueElements[hash] = element;
        });

        console.log("Final uniqueElements:", uniqueElements);
        console.log("Updated HTML:", updatedHtml);

        // Add the elements to the global state (allowing overwrites for now to debug)
        const newGlobalElements = {
          ...originalElements,
          ...uniqueElements,
        };

        console.log("Setting originalElements to:", newGlobalElements);
        setOriginalElements(newGlobalElements as WithCode<OriginalElements>);

        if (editorRef.current) {
          console.log("Inserting content into TipTap editor");
          // Pass the complete merged originalElements to ensure the new elements are included in stageChanges
          editorRef.current.insertContent(
            updatedHtml,
            response.placement,
            newGlobalElements
          );
        }
      } catch (error) {
        console.error("Error converting generated markdown to HTML:", error);
      }
    },
    [setOriginalElements, originalElements]
  );

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
      <AIAssistant
        currentHtml={initialHtml}
        pageContext={`Documentation page: ${title || "Untitled"}`}
        onContentGenerated={handleContentGenerated}
        getCurrentContent={() => editorRef.current?.getHTML() || initialHtml}
      />
    </>
  );
}
