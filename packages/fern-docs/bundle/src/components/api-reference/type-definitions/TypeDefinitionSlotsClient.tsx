"use client";

import React from "react";

import { TypeDefinition } from "@fern-api/fdr-sdk/api-definition";

import {
  PropertyLocation,
  TypeReferenceDefinitions,
} from "./TypeReferenceDefinitions";

const TypeDefinitionSlots = React.createContext<
  (id: string) => React.ReactNode | undefined
>(() => undefined);

export function TypeDefinitionSlotsProvider({
  types,
  children,
}: {
  types: Record<string, TypeDefinition>;
  children: React.ReactNode;
}) {
  const getElementById = React.useMemo(() => {
    return (id: string): React.ReactNode | undefined => {
      return getTypeDefinitionElement(id, types);
    };
  }, [types]);

  return (
    <TypeDefinitionSlots.Provider value={getElementById}>
      {children}
    </TypeDefinitionSlots.Provider>
  );
}

export function useTypeDefinitionSlots(id: string) {
  const getElementById = React.useContext(TypeDefinitionSlots);
  return getElementById(id);
}

export function TypeDefinitionSlot({
  id,
  location,
}: {
  id: string;
  location: PropertyLocation | undefined;
}) {
  const augmentedId = location ? getTypeIdWithLocation(id, location) : id;
  return useTypeDefinitionSlots(augmentedId);
}

function createPropertyAccessTypeVariants(
  type: TypeDefinition,
  types: Record<string, TypeDefinition>
) {
  return {
    default: <TypeReferenceDefinitions shape={type.shape} types={types} />,
    request: (
      <TypeReferenceDefinitions
        shape={type.shape}
        types={types}
        location="request"
      />
    ),
    response: (
      <TypeReferenceDefinitions
        shape={type.shape}
        types={types}
        location="response"
      />
    ),
  };
}

function parseTypeIdWithLocation(id: string): {
  baseId: string;
  location: PropertyLocation | undefined;
} {
  const locationSuffix = "_location:";
  const locationIndex = id.lastIndexOf(locationSuffix);

  if (locationIndex === -1) {
    return { baseId: id, location: undefined };
  }

  const baseId = id.substring(0, locationIndex);
  const locationPart = id.substring(locationIndex + locationSuffix.length);

  if (locationPart === "request" || locationPart === "response") {
    return { baseId, location: locationPart };
  }

  // If location part is not valid, treat the whole thing as baseId
  return { baseId: id, location: undefined };
}

function getTypeDefinitionElement(
  id: string,
  types: Record<string, TypeDefinition>
): React.ReactNode | undefined {
  const { baseId, location } = parseTypeIdWithLocation(id);

  const type = types[baseId];
  if (!type) return undefined;

  const variants = createPropertyAccessTypeVariants(type, types);

  if (location === "request") {
    return variants.request;
  } else if (location === "response") {
    return variants.response;
  } else {
    return variants.default;
  }
}

function getTypeIdWithLocation(id: string, location: PropertyLocation) {
  return `${id}_location:${location}`;
}
