// import "server-only";
import { TypeDefinition } from "@fern-api/fdr-sdk/api-definition";

import { TypeDefinitionSlotsProvider } from "./TypeDefinitionSlotsClient";
import { PropertyLocation } from "./TypeReferenceDefinitions";

export function TypeDefinitionSlotsServer({
  types,
  children,
}: {
  types: Record<string, TypeDefinition>;
  children: React.ReactNode;
}) {
  return (
    <TypeDefinitionSlotsProvider types={types}>
      {children}
    </TypeDefinitionSlotsProvider>
  );
}

export function getTypeIdWithLocation(id: string, location: PropertyLocation) {
  return `${id}_location:${location}`;
}
