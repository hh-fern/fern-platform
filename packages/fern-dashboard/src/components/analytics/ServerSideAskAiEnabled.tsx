import { redirect } from "next/navigation";

import { getCurrentSessionOrThrow } from "@/app/services/auth0/getCurrentSession";
import { Auth0OrgName } from "@/app/services/auth0/types";
import { getFaiClient } from "@/app/services/fai/getFaiClient";
import { DocsUrl } from "@/utils/types";

export declare namespace AskAiEnabledServerSide {
  export interface Props {
    docsUrl: DocsUrl;
    children: React.JSX.Element;
  }
}

export async function AskAiEnabledServerSide({
  docsUrl,
  children,
}: AskAiEnabledServerSide.Props) {
  const session = await getCurrentSessionOrThrow();

  const isAskAiEnabled = (
    await getFaiClient({ token: session.accessToken }).settings.getSettings({
      domain: decodeURIComponent(docsUrl),
    })
  ).ask_ai_enabled;

  if (isAskAiEnabled) {
    return children;
  }

  return null;
}
