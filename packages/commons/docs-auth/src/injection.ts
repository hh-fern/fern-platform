import { z } from "zod";

export type APIKeyInjectionConfigDisabled = {
  enabled: false;
  returnToQueryParam: string;
};

export const APIKeyInjectionConfigDisabledSchema: z.ZodType<APIKeyInjectionConfigDisabled> =
  z.object({
    enabled: z.literal(false),
    returnToQueryParam: z.string(),
  });

export type APIKeyInjectionConfigUnauthorized = {
  enabled: true;
  authenticated: false;
  authorizationUrl: string;
  partner?: string;
  returnToQueryParam: string;
};

export const APIKeyInjectionConfigUnauthorizedSchema: z.ZodType<APIKeyInjectionConfigUnauthorized> =
  z.object({
    enabled: z.literal(true),
    authenticated: z.literal(false),
    authorizationUrl: z.string(),
    partner: z.string().optional(),
    returnToQueryParam: z.string(),
  });

export type APIKeyInjectionConfigAuthorized = {
  enabled: true;
  authenticated: true;
  access_token: string;
  partner?: string;
  returnToQueryParam: string;
};

export const APIKeyInjectionConfigAuthorizedSchema: z.ZodType<APIKeyInjectionConfigAuthorized> =
  z.object({
    enabled: z.literal(true),
    authenticated: z.literal(true),
    access_token: z.string(),
    partner: z.string().optional(),
    returnToQueryParam: z.string(),
  });

export type APIKeyInjectionConfigEnabled =
  | APIKeyInjectionConfigUnauthorized
  | APIKeyInjectionConfigAuthorized;

export const APIKeyInjectionConfigEnabledSchema: z.ZodType<APIKeyInjectionConfigEnabled> =
  z.union([
    APIKeyInjectionConfigUnauthorizedSchema,
    APIKeyInjectionConfigAuthorizedSchema,
  ]);

export type APIKeyInjectionConfig =
  | APIKeyInjectionConfigDisabled
  | APIKeyInjectionConfigEnabled;

export const APIKeyInjectionConfigSchema: z.ZodType<APIKeyInjectionConfig> =
  z.union([
    APIKeyInjectionConfigDisabledSchema,
    APIKeyInjectionConfigEnabledSchema,
  ]);
