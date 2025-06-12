import { AuthorizationURLOptions } from "@workos-inc/node";

import { isLocal } from "../isLocal";
import { isSelfHosted } from "../isSelfHosted";

let workOsInstance: any;

export function getWorkOs(): any {
  if (isLocal() || isSelfHosted()) {
    throw new Error("workOS is not accessible in local preview mode");
  }

  if (!workOsInstance) {
    const mod = require("@workos-inc/node");
    const { WorkOS } = mod;
    workOsInstance = new WorkOS(getWorkOSApiKey());
  }

  return workOsInstance;
}

export function getWorkOSApiKey(): string {
  const apiKey = process.env.WORKOS_API_KEY;
  if (apiKey != null) {
    return apiKey;
  }
  throw new Error("WORKOS_API_KEY is not set");
}

export function getWorkOSClientId(): string {
  if (isLocal() || isSelfHosted()) {
    throw new Error("workOS is not accessible in local preview mode");
  }

  const clientId = process.env.WORKOS_CLIENT_ID;

  if (clientId != null) {
    return clientId;
  }

  throw new Error("WORKOS_CLIENT_ID is not set");
}

export function getJwtSecretKey(): string {
  if (isLocal() || isSelfHosted()) {
    throw new Error("workOS is not accessible in local preview mode");
  }

  const secret = process.env.JWT_SECRET_KEY;

  if (secret != null) {
    return secret;
  }

  throw new Error("JWT_SECRET_KEY is not set");
}

export function getWorkosSSOAuthorizationUrl(
  options: Omit<AuthorizationURLOptions, "clientId">
): string {
  const workOs = getWorkOs();
  const authorizationUrl = workOs.sso.getAuthorizationUrl({
    ...options,
    provider: options.provider ?? "authkit",
    clientId: getWorkOSClientId(),
    redirectUri: options.redirectUri,
  });
  return authorizationUrl;
}

