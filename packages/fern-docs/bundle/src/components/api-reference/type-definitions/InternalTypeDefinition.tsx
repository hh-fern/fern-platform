import {
    type ObjectProperty as ObjectPropertyType,
    type TypeDefinition,
    type TypeId,
    type TypeReference,
    type TypeShape,
    type TypeShapeOrReference,
    unwrapObjectType
} from "@fern-api/fdr-sdk/api-definition";
import { memo } from "react";
import { UnreachableCaseError } from "ts-essentials";

import { DiscriminatedUnionVariant } from "./DiscriminatedUnionVariant";
import { EnumTypeDefinition } from "./EnumTypeDefinition";
import { EnumValue } from "./EnumValue";
import { FernCollapseWithButtonUncontrolled } from "./FernCollapseWithButtonUncontrolled";
import { ObjectProperty } from "./ObjectProperty";
import { TypeDefinitionPathPart } from "./TypeDefinitionContext";
import { WithSeparator } from "./TypeDefinitionDetails";
import type { PropertyLocation } from "./TypeReferenceDefinitions";
import { UndiscriminatedUnionVariant } from "./UndiscriminatedUnionVariant";

export declare namespace InternalTypeDefinition {
    export interface Props {
        shape: TypeShapeOrReference;
        types: Record<TypeId, TypeDefinition>;
        location?: PropertyLocation;
        additionalProperties?: ObjectPropertyType[];
    }
}

export const InternalTypeDefinition = memo(function InternalTypeDefinition({
    shape,
    types,
    location,
    additionalProperties
}: {
    shape:
        | TypeShape.Enum
        | TypeShape.UndiscriminatedUnion
        | TypeShape.DiscriminatedUnion
        | TypeShape.Object_
        | TypeReference.Primitive;
    types: Record<TypeId, TypeDefinition>;
    location?: PropertyLocation;
    additionalProperties?: ObjectPropertyType[];
}) {
    switch (shape.type) {
        case "enum": {
            return (
                <EnumTypeDefinition
                    elements={shape.values.map((value) => ({
                        element: <EnumValue key={value.value} enumValue={value} />,
                        searchableString: `${value.value} ${value.description ?? ""}`
                    }))}
                />
            );
        }
        case "undiscriminatedUnion":
            return (
                <FernCollapseWithButtonUncontrolled
                    showText={`Show ${shape.variants.length} variants`}
                    hideText={`Hide ${shape.variants.length} variants`}
                >
                    <WithSeparator separatorText="OR">
                        {shape.variants.map((variant, idx) => (
                            <UndiscriminatedUnionVariant
                                key={variant.displayName}
                                unionVariant={variant}
                                idx={idx}
                                types={types}
                                location={location}
                                additionalProperties={additionalProperties}
                            />
                        ))}
                    </WithSeparator>
                </FernCollapseWithButtonUncontrolled>
            );
        case "discriminatedUnion":
            return (
                <FernCollapseWithButtonUncontrolled
                    showText={`Show ${shape.variants.length} variants`}
                    hideText={`Hide ${shape.variants.length} variants`}
                >
                    <WithSeparator separatorText="OR">
                        {shape.variants.map((variant) => (
                            <DiscriminatedUnionVariant
                                discriminant={shape.discriminant}
                                key={variant.displayName}
                                unionVariant={variant}
                                types={types}
                                location={location}
                            />
                        ))}
                    </WithSeparator>
                </FernCollapseWithButtonUncontrolled>
            );
        case "object": {
            const properties = unwrapObjectType(shape, types).properties;

            const filteredProperties = filterDuplicateObjectProperties(
                filterObjectPropertiesByAccess(properties, location)
            );

            if (filteredProperties.length === 0) {
                return null;
            }

            return (
                <FernCollapseWithButtonUncontrolled
                    showText={`Show ${filteredProperties.length + (additionalProperties?.length ?? 0)} properties`}
                    hideText={`Hide ${filteredProperties.length + (additionalProperties?.length ?? 0)} properties`}
                >
                    <WithSeparator>
                        {additionalProperties?.map((property) => (
                            <TypeDefinitionPathPart
                                key={property.key}
                                part={{ type: "objectProperty", propertyName: property.key }}
                            >
                                <ObjectProperty property={property} types={types} location={location} />
                            </TypeDefinitionPathPart>
                        ))}
                        {filteredProperties.map((property) => (
                            <TypeDefinitionPathPart
                                key={property.key}
                                part={{ type: "objectProperty", propertyName: property.key }}
                            >
                                <ObjectProperty property={property} types={types} location={location} />
                            </TypeDefinitionPathPart>
                        ))}
                    </WithSeparator>
                </FernCollapseWithButtonUncontrolled>
            );
        }
        case "primitive":
            return null;
        default:
            throw new UnreachableCaseError(shape);
    }
});

const filterObjectPropertiesByAccess = (properties: ObjectPropertyType[], location: PropertyLocation | undefined) => {
    if (location === undefined) {
        return properties;
    }

    return properties.filter((property) => {
        if (location === "request") {
            return property.propertyAccess !== "READ_ONLY";
        } else if (location === "response") {
            return property.propertyAccess !== "WRITE_ONLY";
        }
        return true;
    });
};

const filterDuplicateObjectProperties = (properties: ObjectPropertyType[]) => {
    return properties.reduce<ObjectPropertyType[]>((acc, property) => {
        if (!acc.some((p) => p.key === property.key)) {
            acc.push(property);
        }
        return acc;
    }, []);
};
