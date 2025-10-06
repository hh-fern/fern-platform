import { TypeDefinitionSlotsServer as SharedTypeDefinitionSlotsServer } from "@fern-api/endpoint-snippet-dependencies";
import type { TypeDefinition } from "@fern-api/fdr-sdk/api-definition";
import { Chip, ChipSizeProvider } from "@/client/docs/components/Chip";
import { MdxContent } from "@/client/docs/mdx/components/MdxContent";

import { PropertyContainer, TypeDefinitionAnchor } from "../endpoints/TypeDefinitionAnchor";
import { TypeShorthand } from "./TypeShorthand";

// Re-export for convenience
export { getTypeIdWithLocation } from "@fern-api/endpoint-snippet-dependencies";

/**
 * Dashboard-specific wrapper for TypeDefinitionSlotsServer that injects
 * dashboard-specific component implementations
 */
export function TypeDefinitionSlotsServer({
    types,
    children
}: {
    types: Record<string, TypeDefinition>;
    children: React.ReactNode;
}) {
    return (
        <SharedTypeDefinitionSlotsServer
            types={types}
            TypeShorthand={TypeShorthand}
            PropertyContainer={PropertyContainer}
            TypeDefinitionAnchor={TypeDefinitionAnchor}
            MdxRenderer={MdxContent}
            Chip={Chip}
            ChipSizeProvider={ChipSizeProvider}
        >
            {children}
        </SharedTypeDefinitionSlotsServer>
    );
}
