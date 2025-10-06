import type { DocsV2Read } from "@fern-api/fdr-sdk";
import { type ApiDefinition, ApiDefinitionV1ToLatest } from "@fern-api/fdr-sdk/api-definition";
import { type RootNode, utils } from "@fern-api/fdr-sdk/navigation";
import { mapValues } from "es-toolkit/object";
import fs from "fs";
import path from "path";

const fixturesDir = path.join(__dirname, "../../../../../../fdr-sdk/src/__test__/fixtures");

export function readFixture(fixture: string): [DocsV2Read.LoadDocsForUrlResponse, snapshotFilepath: string] {
    const fixturePath = path.join(fixturesDir, `${fixture}.json`);
    const content = fs.readFileSync(fixturePath, "utf-8");
    return [
        JSON.parse(content) as DocsV2Read.LoadDocsForUrlResponse,
        path.join(__dirname, `__snapshots__/${fixture}.json`)
    ];
}

export function readFixtureToRootNode(fixture: DocsV2Read.LoadDocsForUrlResponse): {
    root: RootNode;
    apis: Record<string, ApiDefinition>;
    pages: Record<string, string>;
} {
    const root = utils.toRootNode(fixture);
    const apis = {
        ...Object.fromEntries(
            Object.values(fixture.definition.apis).map((api) => {
                return [
                    api.id,
                    ApiDefinitionV1ToLatest.from(api, {
                        useJavaScriptAsTypeScript: false,
                        alwaysEnableJavaScriptFetch: false,
                        usesApplicationJsonInFormDataValue: false
                    }).migrate()
                ];
            })
        ),
        ...fixture.definition.apisV2
    };
    const pages = mapValues(fixture.definition.pages, (page) => page.markdown);
    return { root, apis, pages };
}
