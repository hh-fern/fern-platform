"use client";

import { useContext } from "react";

import { FileResolverContext } from "../../../providers/FileResolverContext";
import { Image } from "./html";

export const SelfResolvingImage = (
  props: React.ComponentProps<typeof Image>
) => {
  const { resolveFileSrc } = useContext(FileResolverContext);

  const resolvedFileData = resolveFileSrc(props.src);

  console.log("[SelfResolvingImage] resolvedFileData", resolvedFileData);

  return (
    <Image
      {...props}
      src={resolvedFileData?.src}
      alt={props.alt}
      noZoom
      contentEditable={false} // Prevent text cursor
      draggable={true} // Enable dragging
      data-drag-handle // Tiptap drag handle
    />
  );
};
