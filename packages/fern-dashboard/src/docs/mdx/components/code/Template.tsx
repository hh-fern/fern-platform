"use client";

import React from "react";

import { template } from "es-toolkit/compat";

import { FernLogger } from "@/utils/logging/logger";
import { DashboardError } from "@/utils/logging/errors";

const TemplateCtx = React.createContext<{
  template: Record<string, string>;
  tooltips: Record<string, React.ReactNode>;
}>({
  template: {},
  tooltips: {},
});

/**
 * provides templates to the code block component
 */
export function Template({
  children,
  data,
  tooltips,
}: {
  children: React.ReactNode;
  data?: Record<string, string>;
  tooltips?: Record<string, React.ReactNode>;
}) {
  return (
    <TemplateCtx.Provider
      value={{ template: data ?? {}, tooltips: tooltips ?? {} }}
    >
      {children}
    </TemplateCtx.Provider>
  );
}

export function useTemplate() {
  return React.useContext(TemplateCtx);
}

export function applyTemplates(code: string, data?: Record<string, string>) {
  if (!data || Object.keys(data).length === 0) {
    return code;
  }

  try {
    return template(code, { interpolate: /{{([^}]+)}}/g })(data);
  } catch (error) {
    FernLogger.error(DashboardError.TEMPLATE_COMPONENT_ERROR, error, {
      component: "Template",
      function: "applyTemplates",
      code: code.slice(0, 100) + (code.length > 100 ? "..." : ""), // First 100 chars for debugging
      dataKeys: data ? Object.keys(data) : [],
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return code;
  }
}
