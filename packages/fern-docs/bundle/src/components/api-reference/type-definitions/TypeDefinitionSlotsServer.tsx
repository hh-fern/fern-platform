// import "server-only";
import { TypeDefinition } from "@fern-api/fdr-sdk/api-definition";

import { TypeDefinitionSlotsProvider } from "./TypeDefinitionSlotsClient";

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
