import { once } from "es-toolkit/function";

import { FdrClient } from "@fern-api/fdr-sdk/client";

import { fernToken_admin } from "./env-variables";
import { isLocal } from "./isLocal";

function getEnvironment() {
  // environment variable is used by local development
  // process.env.NEXT_PUBLIC_FDR_ORIGIN ?? "https://registry.buildwithfern.com"
  console.log("==================== CONFUSING ====================")
  return (
    "http://localhost:8080"
  );
}

// either we aren't hitting local FDR or the FDR we have running isn't local : (

export const provideRegistryService = once(() => {
  console.log("getEnvironment", getEnvironment());
  console.log("isLocal", isLocal());
  console.log(process.env.NEXT_PUBLIC_FDR_ORIGIN);
  return new FdrClient({
    environment: getEnvironment(),
    token: isLocal() ? undefined : fernToken_admin(),
  });
});
