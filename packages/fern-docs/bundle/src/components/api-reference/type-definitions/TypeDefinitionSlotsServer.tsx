// import "server-only";
import { TypeDefinition } from "@fern-api/fdr-sdk/api-definition";

import { TypeDefinitionSlotsProvider } from "./TypeDefinitionSlotsClient";
import {
  PropertyLocation,
  TypeReferenceDefinitions,
} from "./TypeReferenceDefinitions";
import { useMemo } from "react";

export function TypeDefinitionSlotsServer({
  types,
  children,
}: {
  types: Record<string, TypeDefinition>;
  children: React.ReactNode;
}) {
  const slots = useMemo(() => createTypeDefinitionSlots(types), [types])
  return (
    <TypeDefinitionSlotsProvider slots={slots}>
      {children}
    </TypeDefinitionSlotsProvider>
  );
}

function createTypeDefinitionSlots(types: Record<string, TypeDefinition>) {
  return Object.fromEntries(
    Object.entries(types).flatMap(([id, type]) => {
      const variants = createPropertyAccessTypeVariants(id, type, types);
      return [
        [id, variants.default],
        [getTypeIdWithLocation(id, "request"), variants.request],
        [getTypeIdWithLocation(id, "response"), variants.response],
      ];
    })
  );
}

function createPropertyAccessTypeVariants(
  id: string,
  type: TypeDefinition,
  types: Record<string, TypeDefinition>
) {
  return {
    default: <TypeReferenceDefinitions shape={type.shape} types={types} />,
    request: (
      <TypeReferenceDefinitions
        shape={type.shape}
        types={types}
        location="request"
      />
    ),
    response: (
      <TypeReferenceDefinitions
        shape={type.shape}
        types={types}
        location="response"
      />
    ),
  };
}

export function getTypeIdWithLocation(id: string, location: PropertyLocation) {
  return `${id}_location:${location}`;
}
