"use client";

import React, { ReactNode, createContext, useContext } from "react";

type ChildrenMiddleware = (children: ReactNode) => ReactNode;

const ChildrenMiddlewareContext = createContext<ChildrenMiddleware>(
  (children) => children
);

export const ChildrenMiddlewareProvider: React.FC<{
  value: ChildrenMiddleware;
  children: ReactNode;
}> = ({ value, children }) => {
  return (
    <ChildrenMiddlewareContext.Provider value={value}>
      {children}
    </ChildrenMiddlewareContext.Provider>
  );
};

export const useChildrenMiddleware = (children: ReactNode): ReactNode => {
  const middleware = useContext(ChildrenMiddlewareContext);
  return middleware(children);
};
