"use client";

import { useCallback, useState } from "react";

import { PlusCircleIcon } from "lucide-react";

import { usePages } from "@/providers/NavigationPagesContext";
import { DocsUrl } from "@/utils/types";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { ErrorFullCommitToast } from "./EditorToasts";

export function AddNewPageModal({ docsUrl }: { docsUrl: DocsUrl }) {
  const { addNewPage } = usePages();

  const [formData, setFormData] = useState({
    pagePath: "",
    slug: "",
    title: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNewPagePress = useCallback(() => {
    // setIsCommitting(true);

    const newPagePath = formData.pagePath || "new-page.mdx";
    const newSlug = formData.slug || newPagePath.replace(".mdx", "");
    const newTitle = formData.title || "New Page";

    console.log("newPagePath", newPagePath);
    console.log("newSlug", newSlug);
    console.log("newTitle", newTitle);

    try {
      //   addNewPage({
      //     type: "page",
      //     title: newTitle,
      //     slug: FernNavigation.Slug(newSlug),
      //     canonicalSlug: FernNavigation.Slug(newSlug),
      //     icon: "📄",
      //     hidden: false,
      //     authed: false,
      //   });
    } catch (error) {
      ErrorFullCommitToast();
      console.error("Error committing changes:", error); // TODO: errors should be logged to Sentry, not to console
    } finally {
      //   setIsCommitting(false);
    }
  }, [addNewPage, formData]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <PlusCircleIcon />
          Add New Page
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border fixed inset-0 z-50 flex flex-col items-center justify-center gap-0 border bg-white pt-0">
        <div className="flex w-full max-w-md flex-col gap-6 p-8">
          <div className="text-center">
            <p className="font-bold">Add a new page to your docs site</p>
            <form className="mt-4 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter page title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="pagePath"
                  className="block text-sm font-medium text-gray-700"
                >
                  Page Path
                </label>
                <Input
                  id="pagePath"
                  type="text"
                  placeholder="e.g., getting-started.mdx"
                  value={formData.pagePath}
                  onChange={(e) =>
                    handleInputChange("pagePath", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700"
                >
                  Slug
                </label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="e.g., getting-started"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                />
              </div>
            </form>
          </div>
          <div className="flex justify-center gap-2">
            <DialogTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button onClick={handleNewPagePress}>Create Page</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
