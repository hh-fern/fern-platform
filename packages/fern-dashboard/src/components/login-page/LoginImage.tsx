"use client";

import { useTheme } from "next-themes";
import Image from "next/image";

import { useIsFirstClientSideRender } from "@/utils/useIsFirstClientSideRender";

import loginPreviewLight from "../../../public/login-image-light.png";
import loginPreviewDark from "../../../public/login-page-light.png";

export function LoginImage() {
  const { resolvedTheme = "light" } = useTheme();

  // render `null` on the first render to match the SSR and avoid hydration errors
  const isFirstClientSideRender = useIsFirstClientSideRender();
  if (isFirstClientSideRender) {
    return null;
  }

  return (
    <div className="perspective-normal absolute bottom-24 left-0 right-16 top-6 m-auto flex w-[754px] justify-center">
      <Image
        src={resolvedTheme === "light" ? loginPreviewLight : loginPreviewDark}
        className="object-fit w-auto min-w-0 object-contain"
        alt="preview of fern docs"
        priority
      />
    </div>
  );
}
