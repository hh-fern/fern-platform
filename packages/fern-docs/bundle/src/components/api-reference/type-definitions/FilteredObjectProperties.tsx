"use client";

import { ApiDefinition } from "@fern-api/fdr-sdk";

import { FernCollapseWithButtonUncontrolled } from "./FernCollapseWithButtonUncontrolled";
import { ObjectProperty } from "./ObjectProperty";
import {
  TypeDefinitionPathPart,
  shouldIncludeObjectProperty,
  useTypeDefinitionContext,
} from "./TypeDefinitionContext";
import { WithSeparator } from "./TypeDefinitionDetails";

export function FilteredObjectProperties({
  properties,
  types,
}: {
  properties: ApiDefinition.ObjectProperty[];
  types: Record<ApiDefinition.TypeId, ApiDefinition.TypeDefinition>;
}) {
  const { isRequest, isResponse } = useTypeDefinitionContext();

  const filteredProperties = properties.filter((property) => {
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
  );
}
