import { Auth0OrgName } from "@/app/services/auth0/types";
import { DocsSiteNavBarItem } from "@/components/docs-page/DocsSiteNavBarItem";
import { AskAiEnabledServerSide } from "@/components/analytics/ServerSideAskAiEnabled";
import { DocsUrl } from "@/utils/types";

export default async function DocsSiteNavbar({
  params,
}: Readonly<{ params: Promise<{ orgName: Auth0OrgName; docsUrl: DocsUrl }> }>) {
  const { orgName, docsUrl } = await params;
  return (
    <div className="flex">
      <DocsSiteNavBarItem title="Overview" href="" />
      <AskAiEnabledServerSide
        docsUrl={docsUrl}
      >
        <DocsSiteNavBarItem title="Ask Fern" href="ask-fern" />
      </AskAiEnabledServerSide>
      <DocsSiteNavBarItem title="Settings" href="settings" />
    </div>
  );
}
