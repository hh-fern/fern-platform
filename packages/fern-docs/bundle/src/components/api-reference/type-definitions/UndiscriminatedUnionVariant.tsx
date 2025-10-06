import {
    type ObjectProperty,
    type TypeDefinition,
    type TypeShapeOrReference,
    type UndiscriminatedUnionVariant as UndiscriminatedUnionVariantType,
    unwrapReference
} from "@fern-api/fdr-sdk/api-definition";
import type { Slug, TypeId } from "@fern-api/fdr-sdk/navigation";
import { visitDiscriminatedUnion } from "@fern-api/ui-core-utils";
import type { ReactElement } from "react";
import React from "react";
import { PropertyWithShape } from "./ObjectProperty";
import type { PropertyLocation } from "./TypeReferenceDefinitions";

type IconInfo = {
    content: string;
    size: number;
};

function getIconInfoForTypeReference(
    typeRef: TypeShapeOrReference,
    types: Record<TypeId, TypeDefinition>
): IconInfo | null {
    return visitDiscriminatedUnion(unwrapReference(typeRef, types).shape)._visit<IconInfo | null>({
        primitive: (primitive) =>
            visitDiscriminatedUnion(primitive.value, "type")._visit<IconInfo | null>({
                string: () => ({ content: "abc", size: 6 }),
                boolean: () => ({ content: "true", size: 6 }),
                integer: () => ({ content: "123", size: 6 }),
                uint: () => ({ content: "123", size: 6 }),
                uint64: () => ({ content: "123", size: 6 }),
                double: () => ({ content: "1.2", size: 6 }),
                long: () => ({ content: "123", size: 6 }),
                datetime: () => ({ content: "abc", size: 6 }),
                uuid: () => ({ content: "abc", size: 6 }),
                base64: () => ({ content: "abc", size: 6 }),
                date: () => ({ content: "abc", size: 6 }),
                bigInteger: () => ({ content: "123", size: 6 }),
                _other: () => null
            }),
        literal: () => ({ content: "!", size: 6 }),
        object: () => null,
        undiscriminatedUnion: () => null,
        discriminatedUnion: () => null,
        enum: () => null,
        list: (list) => getIconInfoForTypeReference(list.itemShape, types),
        set: (set) => getIconInfoForTypeReference(set.itemShape, types),
        map: () => ({ content: "{}", size: 9 }),
        unknown: () => ({ content: "{}", size: 6 }),
        _other: () => null
    });
}

function getIconForTypeReference(
    typeRef: TypeShapeOrReference,
    types: Record<TypeId, TypeDefinition>
): ReactElement<any> | null {
    const info = getIconInfoForTypeReference(typeRef, types);
    if (info == null) {
        return null;
    }
    const { content, size } = info;
    return (
        <div
            className="border-border-default rounded-1 flex size-6 items-center justify-center self-center border"
            style={{ fontSize: size }}
        >
            {content}
        </div>
    );
}

export declare namespace UndiscriminatedUnionVariant {
    export interface Props {
        unionVariant: UndiscriminatedUnionVariantType;
        anchorIdParts: readonly string[];
        slug: Slug;
        idx: number;
        types: Record<TypeId, TypeDefinition>;
    }
}

export function UndiscriminatedUnionVariant({
    unionVariant,
    types,
    location,
    additionalProperties
}: {
    unionVariant: UndiscriminatedUnionVariantType;
    idx: number;
    types: Record<TypeId, TypeDefinition>;
    location?: PropertyLocation;
    additionalProperties?: ObjectProperty[];
}) {
    return (
        <PropertyWithShape
            icon={getIconForTypeReference(unionVariant.shape, types)}
            name={unionVariant.displayName}
            availability={unionVariant.availability}
            description={unionVariant.description}
            shape={unionVariant.shape}
            types={types}
            location={location}
            additionalProperties={additionalProperties}
        />
    );
}
