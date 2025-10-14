import {
    type APIV1Read,
    convertDbAPIDefinitionToRead,
    convertDocsDefinitionToRead,
    type DocsV1Db,
    DocsV1Read,
    type DocsV2Read,
    FdrAPI,
    FernNavigation,
    migrateDocsDbDefinition
} from "@fern-api/fdr-sdk";
import { AuthType } from "@prisma/client";
import type { Pool } from "pg";
import { DomainNotRegisteredError, UnauthorizedError } from "../errors";
import { checkUserBelongsToOrg } from "../utils/auth";
import { getPresignedDocsAssetsDownloadUrl } from "../utils/s3";
import { readBuffer } from "../utils/serde";

const DOCS_DOMAIN_REGX = /^([^.\s]+)/;

export async function getDocsForUrl(
    url: URL,
    pool: Pool,
    authHeader: string | undefined
): Promise<DocsV2Read.LoadDocsForUrlResponse> {
    // Try to load from DocsV2
    const dbDocs = await loadDocsForURLFromDatabase(url, pool);

    if (dbDocs != null) {
        // Check authorization - user must belong to the org that owns these docs
        await checkUserBelongsToOrg({
            authHeader,
            orgId: dbDocs.orgId
        });

        // Fetch API definitions referenced by the docs
        const apiDefinitions = await fetchApiDefinitions(dbDocs.docsDefinition.referencedApis, pool);

        // Convert docs definition to read format
        const filesV2 = await getFilesV2(dbDocs.docsDefinition, dbDocs.hasPublicS3Assets);

        const definition = convertDocsDefinitionToRead({
            docsDbDefinition: dbDocs.docsDefinition,
            filesV2,
            apis: apiDefinitions.apiV1Definitions,
            apisV2: apiDefinitions.apiV2Definitions,
            id: dbDocs.docsConfigInstanceId ?? undefined
        });

        return {
            orgId: dbDocs.orgId,
            baseUrl: {
                domain: dbDocs.domain,
                basePath: dbDocs.path.trim() === "" ? undefined : dbDocs.path.trim()
            },
            definition,
            lightModeEnabled: definition.config.colorsV3?.type !== "dark"
        };
    }

    // Fallback to V1 docs
    const v1Domain = url.hostname.match(DOCS_DOMAIN_REGX)?.[1];
    if (v1Domain == null) {
        throw new DomainNotRegisteredError();
    }

    const v1Docs = await getDocsForDomainV1(v1Domain, pool);
    if (v1Docs == null) {
        throw new DomainNotRegisteredError();
    }

    // V1 docs don't have org IDs, but still require valid auth
    // We can't check org membership, but we ensure user is authenticated
    if (authHeader == null) {
        throw new UnauthorizedError("Authorization header is required");
    }

    return {
        orgId: FdrAPI.OrgId("dummy"), // V1 doesn't have org IDs
        baseUrl: {
            domain: url.hostname,
            basePath: undefined
        },
        definition: v1Docs.response,
        lightModeEnabled: v1Docs.response.config.colorsV3?.type !== "dark"
    };
}

interface LoadDocsDefinitionByUrlResponse {
    orgId: FdrAPI.OrgId;
    domain: string;
    path: string;
    docsDefinition: DocsV1Db.DocsDefinitionDb.V3;
    docsConfigInstanceId: string | null;
    authType: AuthType;
    hasPublicS3Assets: boolean;
}

async function loadDocsForURLFromDatabase(url: URL, pool: Pool): Promise<LoadDocsDefinitionByUrlResponse | undefined> {
    const result = await pool.query(
        `SELECT "orgID", "domain", "path", "docsDefinition", "docsConfigInstanceId",
                "authType", "hasPublicS3Assets"
         FROM "DocsV2"
         WHERE "domain" = $1
         ORDER BY "updatedTime" DESC
         LIMIT 1`,
        [url.hostname]
    );

    if (result.rows.length === 0) {
        return undefined;
    }

    const row = result.rows[0];
    return {
        orgId: FdrAPI.OrgId(row.orgID),
        domain: row.domain,
        path: row.path,
        docsDefinition: migrateDocsDbDefinition(readBuffer(row.docsDefinition)),
        docsConfigInstanceId: row.docsConfigInstanceId,
        authType: row.authType as AuthType,
        hasPublicS3Assets: row.hasPublicS3Assets
    };
}

async function fetchApiDefinitions(
    referencedApis: string[],
    pool: Pool
): Promise<{
    apiV1Definitions: Record<string, APIV1Read.ApiDefinition>;
    apiV2Definitions: Record<string, FdrAPI.api.latest.ApiDefinition>;
}> {
    if (referencedApis.length === 0) {
        return {
            apiV1Definitions: {},
            apiV2Definitions: {}
        };
    }

    // Fetch API definitions from both tables
    const [apiV1Result, apiV2Result] = await Promise.all([
        pool.query(
            `SELECT "apiDefinitionId", "definition"
             FROM "ApiDefinitionsV2"
             WHERE "apiDefinitionId" = ANY($1::text[])`,
            [referencedApis]
        ),
        pool.query(
            `SELECT "apiDefinitionId", "definition"
             FROM "ApiDefinitionsLatest"
             WHERE "apiDefinitionId" = ANY($1::text[])`,
            [referencedApis]
        )
    ]);

    const apiV1Definitions: Record<string, APIV1Read.ApiDefinition> = {};
    for (const row of apiV1Result.rows) {
        const apiDefinitionJson = readBuffer(row.definition);
        apiV1Definitions[row.apiDefinitionId] = convertDbAPIDefinitionToRead(apiDefinitionJson);
    }

    const apiV2Definitions: Record<string, FdrAPI.api.latest.ApiDefinition> = {};
    for (const row of apiV2Result.rows) {
        apiV2Definitions[row.apiDefinitionId] = readBuffer(row.definition) as FdrAPI.api.latest.ApiDefinition;
    }

    return {
        apiV1Definitions,
        apiV2Definitions
    };
}

async function getFilesV2(
    docsDbDefinition: DocsV1Db.DocsDefinitionDb.V3,
    usesPublicS3: boolean
): Promise<Record<DocsV1Read.FileId, DocsV1Read.File_>> {
    const promisedFiles = Object.entries(docsDbDefinition.files).map(
        async ([fileId, fileDbInfo]): Promise<[DocsV1Read.FileId, DocsV1Read.File_]> => {
            const presignedUrl = await getPresignedDocsAssetsDownloadUrl({
                key: fileDbInfo.s3Key,
                isPrivate: !usesPublicS3
            });

            const readFile: DocsV1Read.File_ =
                fileDbInfo.type === "image"
                    ? {
                          type: "image",
                          url: presignedUrl,
                          width: fileDbInfo.width,
                          height: fileDbInfo.height,
                          blurDataUrl: fileDbInfo.blurDataUrl,
                          alt: fileDbInfo.alt
                      }
                    : { type: "url", url: presignedUrl };

            return [DocsV1Read.FileId(fileId), readFile];
        }
    );

    return Object.fromEntries(await Promise.all(promisedFiles));
}

async function getDocsForDomainV1(
    domain: string,
    pool: Pool
): Promise<{ response: DocsV1Read.DocsDefinition; dbFiles: Record<DocsV1Read.FileId, DocsV1Db.DbFileInfoV2> } | null> {
    const result = await pool.query(
        `SELECT "docsDefinition"
         FROM "Docs"
         WHERE "url" = $1
         LIMIT 1`,
        [domain]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const docsDefinitionJson = readBuffer(result.rows[0].docsDefinition);
    const docsDbDefinition = migrateDocsDbDefinition(docsDefinitionJson);

    // Fetch referenced API definitions
    const apiDefinitions = await fetchApiDefinitions(Array.from(docsDbDefinition.referencedApis), pool);

    // Get files
    const filesV2 = await getFilesV2(docsDbDefinition, false); // V1 uses private S3

    const definition = convertDocsDefinitionToRead({
        docsDbDefinition,
        filesV2,
        apis: apiDefinitions.apiV1Definitions,
        apisV2: apiDefinitions.apiV2Definitions,
        id: undefined
    });

    return {
        response: definition,
        dbFiles: docsDbDefinition.files ?? {}
    };
}
