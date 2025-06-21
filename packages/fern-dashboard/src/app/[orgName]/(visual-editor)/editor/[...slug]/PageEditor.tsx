"use client";

import { EditorEvents } from "@tiptap/react";

import TiptapEditor from "@/components/editor/TiptapEditor";

import { htmlToMdx } from "./htmlToMdx";
import { savePageVersion } from "./savePageVersion";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardApiClient } from "@/app/services/dashboard-api/client";

const TEST_BRANCH = "mike/458bb34e";

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
            path: `fern/${filename}`,
            content: mdxForCommit || "",
            mode: "100644",
          },
        ],
      });
        if (response.success) {
          console.log("Successfully committed changes:", response.commitSha);
        } else {
          console.error("Failed to commit changes:", response.error);
        }
    } catch (error) {
      console.error("Error committing changes:", error);
    } finally {
      setIsCommitting(false);
    }

  }

  async function handleCreatePr() {
    const response = await DashboardApiClient.postCreatePr({
      owner: "fern-api",
      repo: "fern",
      head: TEST_BRANCH,
      base: "main",
      title: `Update ${slug}`,
    });
    if (response.success) {
      console.log("Successfully created PR:", response.prUrl);
      window.open(response.prUrl, "_blank");
    } else {
      console.error("Failed to create PR:", response.error);
      if(typeof response.error === "string" && response.error.includes("A pull request already exists")) {
        window.open(`https://github.com/fern-api/fern/compare/main...${TEST_BRANCH}`, "_blank");
      }
    }
  }

  async function handleGeneratePrDescription() {
    const response = await DashboardApiClient.generatePrDescription({
      owner: "fern-api",
      repo: "fern",
      branch: TEST_BRANCH,
      baseBranch: "main",
    });
    if (response.success) {
      console.log("Successfully generated PR description:", response.newTitle);
    } else {
      console.error("Failed to generate PR description:", response.error);
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
        <Button onClick={handleCreatePr}>Create PR</Button>
        <Button onClick={handleGeneratePrDescription}>Generate PR Description</Button>
      </div>
      <TiptapEditor
          className={className}
          content={initialHtml}
          onUpdate={onTiptapEditorUpdate} />
    </>
  );
}
