"use client";

import type { PropsWithChildren, ReactElement } from "react";
import { createContext, useContext } from "react";

const LocalPreviewContext = createContext<boolean>(false);

export const useIsLocalPreview = (): boolean => {
  return useContext(LocalPreviewContext);
};

export const LocalPreviewContextProvider = ({
  children,
}: PropsWithChildren): ReactElement<any> => {
  return (
    <LocalPreviewContext.Provider value={true}>
      {children}
    </LocalPreviewContext.Provider>
  );
};
