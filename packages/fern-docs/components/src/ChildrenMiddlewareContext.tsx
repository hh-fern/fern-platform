"use client";

import React, { ReactNode, createContext, useContext } from "react";

interface Wrapper<T extends keyof React.JSX.IntrinsicElements = 'div'> {
  as?: T
  props: object
}

type ChildrenMiddleware = ({ children, wrapper }: { children: ReactNode, wrapper?: Wrapper }) => ReactNode;

const ChildrenMiddlewareContext = createContext<ChildrenMiddleware>(
  ({ children, wrapper }) => {
    if (wrapper) {
      const Component = wrapper.as || 'div';
      return React.createElement(Component, wrapper.props, children);
    }
    return children;
  }
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

export const useChildrenMiddleware = ({ children, wrapper }: { children: ReactNode, wrapper?: Wrapper }): ReactNode => {
  const middleware = useContext(ChildrenMiddlewareContext);
  return middleware({ children, wrapper });
};
