/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
/**
 * Script to load docs definition by domain using FDR SDK (no caching)
 *
 * Usage:
 *   pnpm tsx scripts/load-docs.ts <domain> [--output <file>] [--pretty]
 *
 * Examples:
 *   pnpm tsx scripts/load-docs.ts docs.buildwithfern.com
 *   pnpm tsx scripts/load-docs.ts docs.buildwithfern.com --output output.json
 *   pnpm tsx scripts/load-docs.ts docs.buildwithfern.com --pretty
 */

import { FdrClient } from "@fern-api/fdr-sdk/client";
import { FdrAPI } from "@fern-api/fdr-sdk/client/types";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

interface ScriptOptions {
    domain: string;
    output?: string;
    pretty?: boolean;
}

function parseArgs(): ScriptOptions {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        console.log(`
Usage: pnpm tsx scripts/load-docs.ts <domain> [options]

Arguments:
  domain              The domain to load docs for (e.g., docs.buildwithfern.com)

Options:
  --output, -o <file> Output to file instead of stdout
  --pretty, -p        Pretty-print JSON output
  --help, -h          Show this help message

Examples:
  pnpm tsx scripts/load-docs.ts docs.buildwithfern.com
  pnpm tsx scripts/load-docs.ts docs.buildwithfern.com --output output.json
  pnpm tsx scripts/load-docs.ts docs.buildwithfern.com --pretty
  pnpm tsx scripts/load-docs.ts docs.buildwithfern.com -o output.json -p

Environment Variables:
  FDR_ORIGIN          FDR API origin (default: https://registry.buildwithfern.com)
  FERN_TOKEN          Authentication token for FDR API
        `);
        process.exit(0);
    }

    const domain = args[0];
    if (!domain) {
        console.error("Error: domain is required");
        process.exit(1);
    }

    const options: ScriptOptions = { domain };

    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case "--output":
            case "-o":
                options.output = args[++i];
                break;
            case "--pretty":
            case "-p":
                options.pretty = true;
                break;
            default:
                console.error(`Unknown option: ${arg}`);
                process.exit(1);
        }
    }

    return options;
}

async function loadDocsForDomain(domain: string): Promise<FdrAPI.docs.v2.read.LoadDocsForUrlResponse> {
    const fdrOrigin =
        process.env.FDR_ORIGIN ?? process.env.NEXT_PUBLIC_FDR_ORIGIN ?? "https://registry.buildwithfern.com";
    const fernToken = process.env.FERN_TOKEN;

    console.error(`Loading docs for domain: ${domain}`);
    console.error(`Using FDR origin: ${fdrOrigin}`);
    if (fernToken) {
        console.error("Using FERN_TOKEN for authentication");
    } else {
        console.error("No FERN_TOKEN provided (proceeding without authentication)");
    }

    const client = new FdrClient({
        environment: fdrOrigin,
        token: fernToken
    });

    const response = await client.docs.v2.read.getDocsForUrl({
        url: FdrAPI.Url(domain)
    });

    if (!response.ok) {
        console.error("Failed to load docs:");
        console.error(JSON.stringify(response.error, null, 2));
        process.exit(1);
    }

    return response.body;
}

async function main() {
    const options = parseArgs();

    try {
        const docsDefinition = await loadDocsForDomain(options.domain);

        const json = options.pretty ? JSON.stringify(docsDefinition, null, 2) : JSON.stringify(docsDefinition);

        if (options.output) {
            const outputPath = path.resolve(options.output);
            fs.writeFileSync(outputPath, json, "utf-8");
            console.error(`\nOutput written to: ${outputPath}`);
            console.error(`File size: ${(json.length / 1024).toFixed(2)} KB`);
        } else {
            // Write to stdout
            console.log(json);
        }

        console.error("\n✓ Successfully loaded docs definition");
    } catch (error) {
        console.error("\n✗ Error loading docs:");
        console.error(error);
        process.exit(1);
    }
}

main();
