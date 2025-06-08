import React from "react";

import type * as ApiDefinition from "@fern-api/fdr-sdk/api-definition";
import { Chip } from "@fern-docs/components/Chip";

import { MdxServerComponentProseSuspense } from "../../mdx/components/server-component";

export function EnumValue({
  enumValue,
}: {
  enumValue: ApiDefinition.EnumValue;
}) {
  return (
    <Chip
      name={enumValue.value}
      description={
        enumValue.description && (
          <MdxServerComponentProseSuspense
            mdx={enumValue.description}
            size="xs"
          />
        )
      }
    />
  );
}
