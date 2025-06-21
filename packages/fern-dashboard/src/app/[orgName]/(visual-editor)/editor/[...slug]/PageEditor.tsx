"use client";

import { EditorEvents } from "@tiptap/react";

import TiptapEditor from "@/components/editor/TiptapEditor";

import { htmlToMdx } from "./htmlToMdx";
import { savePageVersion } from "./savePageVersion";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardApiClient } from "@/app/services/dashboard-api/client";

const TEST_BRANCH = "mike/8503561e";

export declare namespace PageEditor {
  export interface Props {
    className?: string;
    initialHtml: string;
    orgName: string;
    slug: string;
    editThisPageUrl?: string;
    filename: string;
  }
}

// SEE: https://tiptap.dev/docs/editor/getting-started/install/react
export default function PageEditor({
  className,
  initialHtml,
  orgName,
  slug,
  filename,
}: PageEditor.Props) {
  const originalMdx = htmlToMdx(initialHtml);
  const [mdxForCommit, setmdxForCommit] = useState<string | null>(htmlToMdx(initialHtml));
  const [isCommitting, setIsCommitting] = useState(false);

  function onTiptapEditorUpdate(props: EditorEvents["update"]) {
    const html = props.editor.getHTML();
    const mdx = htmlToMdx(html);
    setmdxForCommit(mdx);
    void savePageVersion({ orgName, slug, mdx });
  }

  async function handleCommit() {
    if (mdxForCommit === originalMdx) {
      console.log("No changes to commit");
      return;
    }
    setIsCommitting(true);
    try {
      const response = await DashboardApiClient.postGitCommit({
        owner: "fern-api",
        repo: "fern",
        branch: TEST_BRANCH,
        message: `Update ${slug}`,
        files: [
          {
            path: `fern/docs/${filename}`,
            content: mdxForCommit || "",
            mode: "100644",
          },
        ],
      });
        if (response.success) {
          console.log("Successfully committed changes:", response.commitSha);
          setOriginalMdx(mdxForCommit);
        } else {
          console.error("Failed to commit changes:", response.error);
        }
    } catch (error) {
      console.error("Error committing changes:", error);
    } finally {
      setIsCommitting(false);
    }
  

  }

  return (
    <>
      <div className="flex flex-row gap-2">
        <Button 
          onClick={handleCommit}
          disabled={isCommitting || mdxForCommit === originalMdx}
        >
          {isCommitting ? "Committing..." : "Commit"}
        </Button>
        <a href={`https://github.com/fern-api/fern/compare/main...${TEST_BRANCH}`}>Compare on GitHub</a>
      </div>
      <TiptapEditor
          className={className}
          content={initialHtml}
          onUpdate={onTiptapEditorUpdate} />
    </>
  );
}
