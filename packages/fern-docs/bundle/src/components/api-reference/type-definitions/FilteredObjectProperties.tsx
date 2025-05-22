"use client";

import { ApiDefinition } from "@fern-api/fdr-sdk";
import { shouldIncludeObjectProperty, TypeDefinitionPathPart, useTypeDefinitionContext } from "./TypeDefinitionContext";
import { ObjectProperty } from "./ObjectProperty";
import { WithSeparator } from "./TypeDefinitionDetails";
import { FernCollapseWithButtonUncontrolled } from "./FernCollapseWithButtonUncontrolled";

export function FilteredObjectProperties({
    properties,
    types,
}: {
    properties: ApiDefinition.ObjectProperty[];
    types: Record<ApiDefinition.TypeId, ApiDefinition.TypeDefinition>
}) {

    const { isRequest, isResponse } = useTypeDefinitionContext();

    const filteredProperties = properties.filter(property => {
        return shouldIncludeObjectProperty(property, isRequest, isResponse);
    });

    return (
        <FernCollapseWithButtonUncontrolled
            showText={`Show ${filteredProperties.length} properties`}
            hideText={`Hide ${filteredProperties.length} properties`}
        >
            <WithSeparator>
                {filteredProperties.map((property) => (
                    <TypeDefinitionPathPart
                        key={property.key}
                        part={{ type: "objectProperty", propertyName: property.key }}
                    >
                        <ObjectProperty property={property} types={types} />
                    </TypeDefinitionPathPart>
                ))}
            </WithSeparator>
        </FernCollapseWithButtonUncontrolled>

    )
}