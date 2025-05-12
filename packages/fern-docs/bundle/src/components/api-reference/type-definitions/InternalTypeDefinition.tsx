import { memo } from "react";

import { UnreachableCaseError } from "ts-essentials";

import * as ApiDefinition from "@fern-api/fdr-sdk/api-definition";

import { DiscriminatedUnionVariant } from "./DiscriminatedUnionVariant";
import { EnumTypeDefinition } from "./EnumTypeDefinition";
import { EnumValue } from "./EnumValue";
import { FernCollapseWithButtonUncontrolled } from "./FernCollapseWithButtonUncontrolled";
import { ObjectProperty } from "./ObjectProperty";
import {
  IncludeObjectProperty,
  TypeDefinitionPathPart
} from "./TypeDefinitionContext";
import { WithSeparator } from "./TypeDefinitionDetails";
import { UndiscriminatedUnionVariant } from "./UndiscriminatedUnionVariant";

export declare namespace InternalTypeDefinition {
  export interface Props {
    shape: ApiDefinition.TypeShapeOrReference;
    types: Record<ApiDefinition.TypeId, ApiDefinition.TypeDefinition>;
  }
}

export const InternalTypeDefinition = memo(function InternalTypeDefinition({
  shape,
  types,
}: {
  shape:
    | ApiDefinition.TypeShape.Enum
    | ApiDefinition.TypeShape.UndiscriminatedUnion
    | ApiDefinition.TypeShape.DiscriminatedUnion
    | ApiDefinition.TypeShape.Object_
    | ApiDefinition.TypeReference.Primitive;
  types: Record<ApiDefinition.TypeId, ApiDefinition.TypeDefinition>;
}) {

  switch (shape.type) {
    case "enum": {
      return (
        <EnumTypeDefinition
          elements={shape.values.map((value) => ({
            element: <EnumValue key={value.value} enumValue={value} />,
            searchableString: `${value.value} ${value.description ?? ""}`,
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
              />
            ))}
          </WithSeparator>
        </FernCollapseWithButtonUncontrolled>
      );
    case "object": {
      console.log("SHAPE");
      console.log(JSON.stringify(shape, null, 2));
      const properties = ApiDefinition.unwrapObjectType(
        shape,
        types
      ).properties;
      console.log("PROPERTIES");
      console.log(JSON.stringify(properties, null, 2));
      return (
        <FernCollapseWithButtonUncontrolled
          showText={`Show ${properties.length} properties`}
          hideText={`Hide ${properties.length} properties`}
        >
          <WithSeparator>
            {properties.map((property) => (
              <IncludeObjectProperty
                key={property.key}
                property={property}
              >
                <TypeDefinitionPathPart
                  key={property.key}
                  part={{ type: "objectProperty", propertyName: property.key }}
                >
                  <ObjectProperty property={property} types={types} />
                </TypeDefinitionPathPart>
              </IncludeObjectProperty>
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
