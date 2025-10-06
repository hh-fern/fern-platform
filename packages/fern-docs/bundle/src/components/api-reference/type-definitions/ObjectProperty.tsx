import {
    type Availability,
    type ObjectProperty as ObjectPropertyType,
    type TypeDefinition,
    type TypeId,
    type TypeShape,
    unwrapReference
} from "@fern-api/fdr-sdk/api-definition";
import { AvailabilityBadge } from "@fern-docs/components/badges";
import { compact } from "es-toolkit/array";
import React from "react";

import { MdxServerComponentProseSuspense } from "@/mdx/components/server-component";

import { PropertyContainer, TypeDefinitionAnchor } from "../endpoints/TypeDefinitionAnchor";
import { PropertyKey } from "./PropertyKey";
import { TypeDefinitionAnchorPart, TypeDefinitionCollapsible } from "./TypeDefinitionContext";
import { type PropertyLocation, TypeReferenceDefinitions } from "./TypeReferenceDefinitions";
import { TypeShorthand } from "./TypeShorthand";

export const ObjectProperty = React.memo(function ObjectProperty({
    property,
    types,
    location
}: {
    property: ObjectPropertyType;
    types: Record<TypeId, TypeDefinition>;
    location?: PropertyLocation;
}) {
    const unwrapped = unwrapReference(property.valueShape, types);
    const description = compact([property.description, ...unwrapped.descriptions])[0];

    return (
        <PropertyWithShape
            name={property.key}
            availability={property.availability}
            description={description}
            shape={property.valueShape}
            types={types}
            location={location}
        />
    );
});

export const PropertyWithShape = React.memo(function PropertyWithShape({
    name,
    description,
    shape,
    availability,
    types,
    location,
    additionalProperties
}: {
    icon?: React.ReactNode;
    name?: string;
    description: string | undefined;
    availability: Availability | null | undefined;
    shape: TypeShape;
    types: Record<string, TypeDefinition>;
    location?: PropertyLocation;
    additionalProperties?: ObjectPropertyType[];
}) {
    return (
        <PropertyRenderer
            name={name}
            description={description}
            typeShorthand={<TypeShorthand shape={shape} />}
            availability={availability}
        >
            <TypeReferenceDefinitions
                shape={shape}
                types={types}
                location={location}
                additionalProperties={additionalProperties}
            />
        </PropertyRenderer>
    );
});

export const PropertyRenderer = React.memo(function PropertyRenderer({
    icon,
    name,
    availability,
    description,
    typeShorthand,
    children
}: {
    icon?: React.ReactNode;
    name?: string;
    description: string | undefined;
    typeShorthand: React.ReactNode;
    availability: Availability | null | undefined;
    children?: React.ReactNode;
}) {
    const child = (
        <PropertyContainer>
            <TypeDefinitionAnchor sideOffset={6}>
                {icon}
                {name != null && <PropertyKey className="fern-api-property-key">{name}</PropertyKey>}
                {typeShorthand}
                {availability != null && <AvailabilityBadge availability={availability} size="sm" rounded />}
            </TypeDefinitionAnchor>

            <MdxServerComponentProseSuspense mdx={description} size="sm" className="text-(color:--grayscale-a11)" />

            <TypeDefinitionCollapsible>{children}</TypeDefinitionCollapsible>
        </PropertyContainer>
    );

    if (name != null) {
        return <TypeDefinitionAnchorPart part={name}>{child}</TypeDefinitionAnchorPart>;
    }

    return child;
});
