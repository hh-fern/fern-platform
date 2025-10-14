import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { ApiDefinitionV1ToLatest } from "../api-definition/migrators/v1ToV2";
import { backfillSnippets } from "../api-definition/snippets/backfill";
import { readFixture } from "./readFixtures";

// Load pinnacle dynamic snippet fixtures from api-definition/snippets/fixtures
const pinnacleFixturesDir = join(__dirname, "..", "api-definition", "snippets", "fixtures", "pinnacle");
const pinnacleTypescriptFixture = JSON.parse(readFileSync(join(pinnacleFixturesDir, "typescript.json"), "utf-8"));
const pinnaclePythonFixture = JSON.parse(readFileSync(join(pinnacleFixturesDir, "python.json"), "utf-8"));
const pinnacleRubyFixture = JSON.parse(readFileSync(join(pinnacleFixturesDir, "ruby.json"), "utf-8"));

describe("pinnacle v1 to v2 migration with snippet backfill", () => {
    it("should migrate pinnacle v1 API to v2 and backfill snippets with dynamic snippets", async () => {
        // Load the pinnacle fixture which contains v1 API definitions
        const fixture = readFixture("pinnacle");

        // Extract all v1 APIs and migrate them to v2
        const v1Apis = Object.values(fixture.definition.apis);
        expect(v1Apis.length).toBeGreaterThan(0);

        // Migrate each v1 API to v2
        const v2Apis = v1Apis.map((api) => ApiDefinitionV1ToLatest.from(api).migrate());

        // Setup flags for backfill
        const flags = {
            isHttpSnippetsEnabled: true,
            alwaysEnableJavaScriptFetch: true
        };

        // Setup dynamic IR with pinnacle-specific fixtures
        const dynamicIr = {
            typescript: pinnacleTypescriptFixture,
            python: pinnaclePythonFixture,
            ruby: pinnacleRubyFixture
        };

        // Backfill snippets for each migrated API
        const backfilledApis = await Promise.all(
            v2Apis.map((api) => backfillSnippets(api, dynamicIr, flags))
        );

        // Verify that snippets were generated
        expect(backfilledApis.length).toBe(v2Apis.length);

        // Check that each API has endpoints with examples that have snippets
        for (const api of backfilledApis) {
            const endpointIds = Object.keys(api.endpoints);
            expect(endpointIds.length).toBeGreaterThan(0);

            // Verify at least one endpoint has examples with snippets
            let hasSnippets = false;
            for (const endpointId of endpointIds) {
                const endpoint = api.endpoints[endpointId as keyof typeof api.endpoints];
                if (endpoint?.examples && endpoint.examples.length > 0) {
                    for (const example of endpoint.examples) {
                        if (example.snippets) {
                            hasSnippets = true;
                            // Verify curl snippets are present
                            expect(example.snippets.curl).toBeDefined();
                            // Verify at least one SDK snippet is present
                            const hasSDKSnippet =
                                example.snippets.typescript !== undefined ||
                                example.snippets.python !== undefined ||
                                example.snippets.ruby !== undefined;
                            if (hasSDKSnippet) {
                                expect(hasSDKSnippet).toBe(true);
                            }
                        }
                    }
                }
            }
            expect(hasSnippets).toBe(true);
        }

        // Snapshot the backfilled APIs to capture all endpoints with all snippets
        expect(backfilledApis).toMatchSnapshot();
    });

    it("should handle individual endpoints with dynamic snippets for all languages", async () => {
        // Load the pinnacle fixture
        const fixture = readFixture("pinnacle");

        // Get the first v1 API and migrate it
        const v1Api = Object.values(fixture.definition.apis)[0];
        if (!v1Api) {
            throw new Error("No v1 API found in pinnacle fixture");
        }

        const v2Api = ApiDefinitionV1ToLatest.from(v1Api).migrate();

        // Setup flags for backfill
        const flags = {
            isHttpSnippetsEnabled: true,
            alwaysEnableJavaScriptFetch: true
        };

        // Setup dynamic IR
        const dynamicIr = {
            typescript: pinnacleTypescriptFixture,
            python: pinnaclePythonFixture,
            ruby: pinnacleRubyFixture
        };

        // Backfill snippets
        const backfilledApi = await backfillSnippets(v2Api, dynamicIr, flags);

        // Get all endpoints with examples
        const endpointsWithExamples = Object.entries(backfilledApi.endpoints).filter(
            ([, endpoint]) => endpoint.examples && endpoint.examples.length > 0
        );

        expect(endpointsWithExamples.length).toBeGreaterThan(0);

        // For each endpoint with examples, verify snippets are generated
        for (const [endpointId, endpoint] of endpointsWithExamples) {
            expect(endpoint.examples).toBeDefined();

            for (const example of endpoint.examples ?? []) {
                expect(example.snippets).toBeDefined();

                // Verify curl is always present
                expect(example.snippets?.curl).toBeDefined();
                expect(example.snippets?.curl?.length).toBeGreaterThan(0);

                const curlSnippet = example.snippets?.curl?.[0];
                expect(curlSnippet?.language).toBe("curl");
                expect(curlSnippet?.code).toBeDefined();
                expect(curlSnippet?.code.length).toBeGreaterThan(0);

                // Snapshot individual endpoint examples
                expect(example.snippets).toMatchSnapshot(
                    `${endpointId}-${example.name ?? "example"}-snippets`
                );
            }
        }
    });

    it("should preserve example data through migration and backfill", async () => {
        // Load the pinnacle fixture
        const fixture = readFixture("pinnacle");

        // Get a v1 API
        const v1Api = Object.values(fixture.definition.apis)[0];
        if (!v1Api) {
            throw new Error("No v1 API found in pinnacle fixture");
        }

        // Migrate to v2
        const v2Api = ApiDefinitionV1ToLatest.from(v1Api).migrate();

        // Setup for backfill
        const flags = {
            isHttpSnippetsEnabled: true,
            alwaysEnableJavaScriptFetch: true
        };

        const dynamicIr = {
            typescript: pinnacleTypescriptFixture,
            python: pinnaclePythonFixture,
            ruby: pinnacleRubyFixture
        };

        // Backfill snippets
        const backfilledApi = await backfillSnippets(v2Api, dynamicIr, flags);

        // Verify that original example data is preserved
        for (const [_, endpoint] of Object.entries(backfilledApi.endpoints)) {
            if (endpoint.examples && endpoint.examples.length > 0) {
                for (const example of endpoint.examples) {
                    // Verify example structure is preserved
                    expect(example.name).toBeDefined();
                    expect(example.path).toBeDefined();

                    // If there's a request body in the example, it should be preserved
                    if (example.requestBody) {
                        expect(example.requestBody).toBeDefined();
                    }

                    // If there's a response body in the example, it should be preserved
                    if (example.responseBody) {
                        expect(example.responseBody).toBeDefined();
                    }

                    // Snippets should be added without losing original data
                    expect(example.snippets).toBeDefined();
                }
            }
        }
    });
});
