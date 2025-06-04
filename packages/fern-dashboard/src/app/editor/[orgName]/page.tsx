import { redirect } from "next/navigation";

import { PosthogFeatureFlag } from "@/components/posthog/feature-flags/flags";
import { FeatureFlaggedServerSide } from "@/components/posthog/feature-flags/server-side";

import { getCurrentSession } from "../../services/auth0/getCurrentSession";
import Editor from "./Editor";

export default async function Page() {
  const session = await getCurrentSession();

  if (session == null) {
    redirect("/");
  }

  const docs = await createEditableDocsLoader(
    "https://sarah-bawabe.docs.buildwithfern.com",
    "123",
    session?.accessToken
  );
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
