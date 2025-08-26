import Image from "next/image";
import { useCallback, useState } from "react";

import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Trash2 } from "lucide-react";

import ImageDropZone from "../ImageDropZone";

export const ImageNodeView = (props: NodeViewProps) => {
  const { node, updateAttributes, deleteNode } = props;
  const { src, alt, title } = node.attrs;
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = useCallback(
    async (file: File) => {
      setIsUploading(true);

      try {
        // Create a data URL for the image (for now - you could upload to a server later)
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        updateAttributes({
          src: dataUrl,
          alt: file.name,
          title: file.name,
        });
      } catch (error) {
        console.error("Failed to process image:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [updateAttributes]
  );

  const handleImageUrl = useCallback(
    (url: string) => {
      updateAttributes({
        src: url,
        alt: "Image",
        title: "Image",
      });
    },
    [updateAttributes]
  );

  const handleDelete = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  // If we have a src, show the image with controls
  if (src) {
    return (
      <NodeViewWrapper className="group relative">
        <div className="relative inline-block w-full">
          <Image
            src={src}
            alt={alt || ""}
            title={title || ""}
            width={1000}
            height={1000}
            className="h-auto max-w-full"
          />

          {/* Delete button - shows on hover */}
          <button
            onClick={handleDelete}
            className="absolute right-2 top-4 cursor-pointer rounded-full bg-red-600 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
            title="Delete image"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </NodeViewWrapper>
    );
  }

  // Show loading state while uploading
  if (isUploading) {
    return (
      <NodeViewWrapper>
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-8">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-blue-600">Uploading image...</p>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Show the drop zone initially
  return (
    <NodeViewWrapper>
      <ImageDropZone
        onImageSelect={handleImageSelect}
        onImageUrl={handleImageUrl}
      />
    </NodeViewWrapper>
  );
};
