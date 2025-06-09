"use client";

import { FernLinkButton } from "@fern-docs/components/FernLinkButton";

import { useBasePath } from "./utils/navigation";

export default function ReturnHomeButton() {
  const basePath = useBasePath();
  return <FernLinkButton href={basePath} text="Return home" intent="primary" />;
}
