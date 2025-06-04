import { redirect } from "next/navigation";

import { createEditableDocsLoader } from "@fern-api/docs-loader";

import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import Editor from "@/components/editor/Editor";
import { PosthogFeatureFlag } from "@/components/posthog/feature-flags/flags";
import { FeatureFlaggedServerSide } from "@/components/posthog/feature-flags/server-side";

export default async function Page() {
  const session = await getCurrentSession();

  if (session == null) {
    redirect("/");
  }

  const editableDocsLoader = await createEditableDocsLoader(
    "https://sarah-bawabe.docs.buildwithfern.com",
    "123",
    session?.accessToken
  );

  console.log("[1] docs", editableDocsLoader);
  // const root = await editableDocsLoader.getRoot();
  // console.log("[2] root", root);
  // const foundNode = FernNavigation.utils.findNode(root, slugjoin("/"));
  // if (foundNode.type !== "found") {
  //   console.log("[3] node not found");
  //   return null;
  // }
  // const rootNodePageId = getPageId(foundNode.node);
  // if (rootNodePageId == null) {
  //   console.log("[4] rootNodePageId not found");
  //   return null;
  // }
  // const rootPage = await editableDocsLoader.getPage(rootNodePageId);
  // console.log("[5] rootPage", rootPage);
  // const docs = await getDocsFromUrl({
  //   url: "https://sarah-bawabe.docs.buildwithfern.com",
  //   token: session?.accessToken,
  // });
  // console.log(docs);

  return (
    <FeatureFlaggedServerSide
      flag={PosthogFeatureFlag.ENABLE_DOCS_PAGE}
      redirectWhenDisabled
    >
      <div className="flex h-full w-full flex-col bg-gray-100">
        <Header />
        <Preview />
      </div>
    </FeatureFlaggedServerSide>
  );
}

function Header() {
  return (
    <div className="flex h-12 items-center justify-center border-b border-gray-500 bg-white px-2 shadow-sm">
      <div className="flex-1 text-left">Back | Title</div>
      <div className="flex-1 text-center">ProfPic | Undo | Redo | Settings</div>
      <div className="flex-1 text-right">
        Icons | Preview | Files | Commit | Publish
      </div>
    </div>
  );
}

function Preview() {
  return (
    <div className="border-1 m-2 flex flex-1 flex-col border-gray-500 bg-white shadow-sm">
      <div className="flex flex-col">
        <PreviewHeader />
        <PreviewSubHeader />
      </div>
      <div className="flex flex-1">
        <PreviewSidebar />
        <PreviewBody />
      </div>
    </div>
  );
}

function PreviewHeader() {
  return (
    <div className="flex h-12 items-center justify-center border-b border-gray-500 bg-white px-2">
      <div className="flex-1 text-left">Logo</div>
      <div className="flex-1 text-center">Search</div>
      <div className="flex-1 text-right">...</div>
    </div>
  );
}

function PreviewSubHeader() {
  return (
    <div className="flex h-12 items-center border-b border-gray-500 bg-white px-2">
      <div>Tabs</div>
      <div>...</div>
    </div>
  );
}

function PreviewSidebar() {
  return (
    <div className="w-64 border-r border-gray-500">
      <div>Sidebar</div>
      <div>...</div>
    </div>
  );
}

function PreviewBody() {
  return (
    <div className="flex flex-1 justify-center">
      <Editor className="max-w-[800px] flex-1" />
    </div>
  );
}
