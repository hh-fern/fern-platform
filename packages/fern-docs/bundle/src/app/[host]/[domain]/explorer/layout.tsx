import "server-only";

import { createCachedDocsLoader } from "@fern-api/docs-loader";
import { getFernToken } from "@fern-docs/components/fern-token";
import { PlaygroundCloseButton } from "@fern-docs/components/playground/PlaygroundCloseButton";
import { PlaygroundKeyboardTrigger } from "@fern-docs/components/playground/PlaygroundKeyboardTrigger";
import { HorizontalSplitPane } from "@fern-docs/components/playground/VerticalSplitPane";
import { ApiExplorerFlags } from "@fern-docs/components/utils/api-explorer-flags";

export default async function Layout({
  params,
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  params: Promise<{ host: string; domain: string }>;
}) {
  const { host, domain } = await params;

  console.debug(`[${domain}] Loading API Explorer layout`);
  const loader = await createCachedDocsLoader(
    host,
    domain,
    await getFernToken()
  );
  const edgeFlags = await loader.getEdgeFlags();

  return (
    <main className="fixed inset-0">
      <PlaygroundKeyboardTrigger />
      <PlaygroundCloseButton />
      <ApiExplorerFlags
        isFileForgeHackEnabled={edgeFlags.isFileForgeHackEnabled}
        isProxyDisabled={edgeFlags.isProxyDisabled}
        hasVoiceIdPlaygroundForm={edgeFlags.hasVoiceIdPlaygroundForm}
        usesApplicationJsonInFormDataValue={
          edgeFlags.usesApplicationJsonInFormDataValue
        }
        isBinaryOctetStreamAudioPlayer={
          edgeFlags.isBinaryOctetStreamAudioPlayer
        }
      />
      <HorizontalSplitPane
        mode="pixel"
        className="size-full"
        leftClassName="border-border-default border-r hidden lg:block"
      >
        {sidebar}
        {children}
      </HorizontalSplitPane>
    </main>
  );
}
