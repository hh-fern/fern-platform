import type { DocsLoader } from "@fern-api/docs-server/docs-loader";
import { createFileResolver } from "@fern-api/docs-server/file-resolver";
import { withLogo } from "@fern-api/docs-server/withLogo";
import type { FileData } from "@fern-api/docs-utils/types/file-data";
import type { Frontmatter } from "@fern-api/fdr-sdk/docs";
import { AbstractLogo } from "@fern-docs/components/abstract/logo";
import { useMemo } from "react";

export function Logo({
    basePath,
    config,
    files,
    frontmatter
}: {
    basePath: string;
    config: Awaited<ReturnType<DocsLoader["getConfig"]>>;
    files: Record<string, FileData>;
    frontmatter: Frontmatter | undefined;
}) {
    const resolveFileSrc = createFileResolver(files);

    const logo = useMemo(
        () => withLogo(config, resolveFileSrc, basePath, frontmatter),
        [config, resolveFileSrc, basePath, frontmatter]
    );

    return <AbstractLogo logo={logo} />;
}
