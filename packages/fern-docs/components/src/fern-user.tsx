import "server-only";

import { createCachedDocsLoader } from "@fern-api/docs-loader";
import { getFernToken } from "@fern-docs/components/fern-token";
import { SetFernUser } from "@fern-ui/state/fern-user";

export async function FernUser({
  host,
  domain,
}: {
  host: string;
  domain: string;
}) {
  const loader = await createCachedDocsLoader(
    host,
    domain,
    await getFernToken()
  );
  const authState = await loader.getAuthState();
  return <SetFernUser value={authState.authed ? authState.user : undefined} />;
}
