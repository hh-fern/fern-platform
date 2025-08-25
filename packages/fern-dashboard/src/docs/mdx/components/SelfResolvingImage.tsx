"use client";

import { useContext, useEffect, useState } from "react";

import { FileResolverContext } from "../../../providers/FileResolverContext";
import { Image } from "./html/image";

export const SelfResolvingImage = (
  props: React.ComponentProps<typeof Image>
) => {
  console.log("🖼️ SelfResolvingImage: Component rendering with props:", props);
  
  const { resolveFileSrc } = useContext(FileResolverContext);
  console.log("🔧 SelfResolvingImage: FileResolverContext resolveFileSrc:", typeof resolveFileSrc);
  
  const [resolvedProps, setResolvedProps] =
    useState<React.ComponentProps<typeof Image>>(props);

  console.log("📝 SelfResolvingImage: Initial props:", props);
  console.log("📝 SelfResolvingImage: Current resolvedProps:", resolvedProps);

  useEffect(() => {
    console.log("⚡ SelfResolvingImage: useEffect triggered with props.src:", props.src);
    
    const resolveFile = async () => {
      console.log("🔍 SelfResolvingImage: Starting file resolution...");
      
      if (!props.src || typeof props.src !== "string") {
        console.log("❌ SelfResolvingImage: No src or src is not string, using original props");
        setResolvedProps(props);
        return;
      }

      console.log("🚀 SelfResolvingImage: Calling resolveFileSrc with:", props.src);
      const fileData = await resolveFileSrc(props.src);
      console.log("📦 SelfResolvingImage: Received fileData:", fileData);
      
      if (!fileData) {
        console.log("❌ SelfResolvingImage: No fileData returned, using original props");
        setResolvedProps(props);
        return;
      }

      console.log("✅ SelfResolvingImage: File resolved successfully, setting new props");
      const newResolvedProps = {
        ...props,
        src: fileData.src,
        width: fileData.width || props.width,
        height: fileData.height || props.height,
        blurDataURL: fileData.blurDataURL || props.blurDataURL,
        alt: fileData.alt || props.alt,
      };
      console.log("🎯 SelfResolvingImage: New resolved props:", newResolvedProps);
      setResolvedProps(newResolvedProps);
    };

    void resolveFile();
  }, [props, resolveFileSrc]);

  console.log("🎨 SelfResolvingImage: Rendering Image component with resolvedProps:", resolvedProps);
  return <Image alt={props.alt} {...resolvedProps} />;
};
