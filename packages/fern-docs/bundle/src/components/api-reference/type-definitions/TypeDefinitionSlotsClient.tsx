"use client";

import React from "react";

import { TypeDefinition } from "@fern-api/fdr-sdk/api-definition";

import { getTypeIdWithLocation } from "./TypeDefinitionSlotsServer";
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

function getTypeDefinitionElement(
  id: string,
  types: Record<string, TypeDefinition>
): React.ReactNode | undefined {
  // Check if the id has location suffix
  const locationMatch = id.match(/^(.+)_location:(request|response)$/);

  if (locationMatch) {
    const baseId = locationMatch[1];
    const location = locationMatch[2];
    if (!baseId || !location) return undefined;

    const type = types[baseId];
    if (!type) return undefined;

    const variants = createPropertyAccessTypeVariants(type, types);
    return location === "request" ? variants.request : variants.response;
  }

  // No location suffix, return default variant
  const type = types[id];
  if (!type) return undefined;

  const variants = createPropertyAccessTypeVariants(type, types);
  return variants.default;
}
