import React from "react";

import { compact } from "es-toolkit/array";

import * as ApiDefinition from "@fern-api/fdr-sdk/api-definition";
import { AvailabilityBadge } from "@fern-docs/components/badges";

import {
  PropertyContainer,
  TypeDefinitionAnchor,
} from "../endpoints/TypeDefinitionAnchor";
import { PropertyKey } from "./PropertyKey";
import {
  TypeDefinitionAnchorPart,
  TypeDefinitionCollapsible,
} from "./TypeDefinitionContext";
import {
  PropertyLocation,
  TypeReferenceDefinitions,
} from "./TypeReferenceDefinitions";
import { TypeShorthand } from "./TypeShorthand";
import { Prose } from "@fern-docs/components/mdx/prose";
import { Markdown } from "@/mdx/components/Markdown";
import { mdxToHtml } from "@fern-docs/mdx";

export const ObjectProperty = React.memo(function ObjectProperty({
  property,
  types,
  location,
}: {
  property: ApiDefinition.ObjectProperty;
  types: Record<ApiDefinition.TypeId, ApiDefinition.TypeDefinition>;
  location?: PropertyLocation;
}) {
  const unwrapped = ApiDefinition.unwrapReference(property.valueShape, types);
  const description = compact([
    property.description,
    ...unwrapped.descriptions,
  ])[0];

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
  additionalProperties,
}: {
  icon?: React.ReactNode;
  name?: string;
  description: string | undefined;
  availability: ApiDefinition.Availability | null | undefined;
  shape: ApiDefinition.TypeShape;
  types: Record<string, ApiDefinition.TypeDefinition>;
  location?: PropertyLocation;
  additionalProperties?: ApiDefinition.ObjectProperty[];
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

function wrappedMdxToHtml(mdx: string): { error: boolean, html: string | undefined } {
  try {
    const result = mdxToHtml(mdx)
    return { error: false, html: result.html }
  } catch (e) {
    console.log("[wrappedMdxToHtml] mdxToHtml failed. Falling back to unparsed mdx.", mdx, e)
    return { error: true, html: undefined }
  }
}

export const PropertyRenderer = React.memo(function PropertyRenderer({
  icon,
  name,
  availability,
  description,
  typeShorthand,
  children,
}: {
  icon?: React.ReactNode;
  name?: string;
  description: string | undefined;
  typeShorthand: React.ReactNode;
  availability: ApiDefinition.Availability | null | undefined;
  children?: React.ReactNode;
}) {
  const { error, html } = wrappedMdxToHtml(description || "")
  const child = (
    <PropertyContainer>
      <TypeDefinitionAnchor sideOffset={6}>
        {icon}
        {name != null && (
          <PropertyKey className="fern-api-property-key">{name}</PropertyKey>
        )}
        {typeShorthand}
        {availability != null && (
          <AvailabilityBadge availability={availability} size="sm" rounded />
        )}
      </TypeDefinitionAnchor>

      {description && <Prose size="sm" className="text-(color:--grayscale-a11)">
        {error ? <p>${description}</p> : 
        <div dangerouslySetInnerHTML={{ __html: html! }} />}
      </Prose>}

      <TypeDefinitionCollapsible>{children}</TypeDefinitionCollapsible>
    </PropertyContainer>
  );

  if (name != null) {
    return (
      <TypeDefinitionAnchorPart part={name}>{child}</TypeDefinitionAnchorPart>
    );
  }

  return child;
});
