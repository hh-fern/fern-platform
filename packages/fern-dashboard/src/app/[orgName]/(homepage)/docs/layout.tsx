import { MaybeInvalidateDocsSiteQuery } from "@fern-docs/components/docs-page/MaybeInvalidateDocsSiteQuery";

export default async function Layout({
  children,
}: Readonly<{
  children: React.JSX.Element;
}>) {
  return (
    <>
      <MaybeInvalidateDocsSiteQuery />
      {children}
    </>
  );
}
