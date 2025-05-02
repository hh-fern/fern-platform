"use client";

import { createContext, useContext } from "react";

import { MdxSerializer } from "@/server/mdx-serializer";

export const MdxSerializerContext = createContext<MdxSerializer | undefined>(
  undefined
);

export function MdxSerializerProvider({
  children,
  serialize,
}: {
  children: React.ReactNode;
  serialize: MdxSerializer;
}) {
  return (
    <MdxSerializerContext.Provider value={serialize}>
      {children}
    </MdxSerializerContext.Provider>
  );
}

export function useMdxSerializer() {
  const context = useContext(MdxSerializerContext);
  if (context === undefined) {
    throw new Error(
      "useMdxSerializer must be used within a MdxSerializerProvider"
    );
  }
  return context;
}
// import { createContext, useContext } from "react";

// import { DocsLoader } from "@/server/docs-loader";
// import {
//   MdxSerializer,
//   createCachedMdxSerializer,
// } from "@/server/mdx-serializer";

// export const MdxSerializerContext = createContext<MdxSerializer | undefined>(
//   undefined
// );

// export function MdxSerializerProvider({
//   children,
//   loader,
//   options,
// }: {
//   children: React.ReactNode;
//   loader: DocsLoader;
//   options?: {
//     scope?: Record<string, string>;
//     replaceHref?: (href: string) => string | undefined;
//   };
// }) {
//   const serialize = createCachedMdxSerializer(loader, options);
//   return (
//     <MdxSerializerContext.Provider value={serialize}>
//       {children}
//     </MdxSerializerContext.Provider>
//   );
// }

// export function useMdxSerializer() {
//   const context = useContext(MdxSerializerContext);
//   if (context === undefined) {
//     throw new Error(
//       "useMdxSerializer must be used within a MdxSerializerProvider"
//     );
//   }
//   return context;
// }
