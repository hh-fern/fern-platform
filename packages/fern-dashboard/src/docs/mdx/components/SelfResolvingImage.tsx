"use client";

import { useContext, useEffect, useState } from "react";

import { FileResolverContext } from "../../../providers/FileResolverContext";
import { Image } from "./html/image";

export const SelfResolvingImage = (
  props: React.ComponentProps<typeof Image>
) => {
  const { resolveFileSrc } = useContext(FileResolverContext);

  const [resolvedProps, setResolvedProps] =
    useState<React.ComponentProps<typeof Image>>(props);

  useEffect(() => {
    const resolveFile = async () => {
      if (!props.src || typeof props.src !== "string") {
        setResolvedProps(props);
        return;
      }

      const fileData = await resolveFileSrc(props.src);

      if (!fileData) {
        setResolvedProps(props);
        return;
      }
      const newResolvedProps = {
        ...props,
        src: fileData.src,
        width: fileData.width || props.width,
        height: fileData.height || props.height,
        blurDataURL: fileData.blurDataURL || props.blurDataURL,
        alt: fileData.alt || props.alt,
      };
      setResolvedProps(newResolvedProps);
    };

    void resolveFile();
  }, [props, resolveFileSrc]);

  return <Image alt={props.alt} {...resolvedProps} />;
};
