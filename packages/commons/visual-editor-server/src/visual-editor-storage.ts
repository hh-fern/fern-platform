import type { DocsV2Read } from "@fern-api/fdr-sdk";

import { type UnzippedEditorDocument, mongoClient } from "./mongodb-client";

const inflightRequests = new Map<string, Promise<any>>();

export class VisualEditorStorage {
  private _generateInflightRequestKey(
    domain: string,
    branchName: string,
    type: "store" | "get"
  ): string {
    return `${domain}::${branchName}::${type}`;
  }

  async storeFdrSnapshot(
    domain: string,
    branchName: string,
    fdrResponse: DocsV2Read.LoadDocsForUrlResponse
  ): Promise<void> {
    const uniqueRunId = crypto.randomUUID();
    const startTimestamp = Date.now();
    console.log(
      `[VisualEditorStorage] Storing FDR for ${domain}:${branchName}`,
      {
        uniqueRunId,
        timestamp: startTimestamp,
      }
    );

    try {
      const key = this._generateInflightRequestKey(domain, branchName, "store");
      if (inflightRequests.has(key)) {
        console.log("[storeFdrSnapshot] Returning inflight request");
        return await inflightRequests.get(key);
      }

      const promiseResponse = mongoClient.set(domain, branchName, fdrResponse);
      console.log(
        "[storeFdrSnapshot] Inflight request not found: reaching out to mongo"
      );
      inflightRequests.set(key, promiseResponse);
      const endTimestamp = Date.now();
      const duration = endTimestamp - startTimestamp;
      console.log(
        `[VisualEditorStorage] FDR successfully stored for ${domain}:${branchName}`,
        {
          uniqueRunId,
          duration,
        }
      );
      return await promiseResponse;
    } catch (error) {
      console.error(
        `[VisualEditorStorage] Failed to store FDR for ${domain}:${branchName}`,
        error
      );
      throw error;
    }
  }

  async getFdrSnapshot(
    domain: string,
    branchName: string
  ): Promise<DocsV2Read.LoadDocsForUrlResponse | null> {
    const uniqueRunId = crypto.randomUUID();
    const startTimestamp = Date.now();
    console.log(
      `[VisualEditorStorage] Retrieving FDR for ${domain}:${branchName}`,
      {
        uniqueRunId,
      }
    );

    try {
      const key = this._generateInflightRequestKey(domain, branchName, "get");
      if (inflightRequests.has(key)) {
        console.log("[getFdrSnapshot] Returning inflight request");
        return await inflightRequests.get(key);
      }

      const promiseResponse = mongoClient.get(domain, branchName);
      console.log(
        "[getFdrSnapshot] Inflight request not found: reaching out to mongo"
      );
      inflightRequests.set(key, promiseResponse);
      const endTimestamp = Date.now();
      const duration = endTimestamp - startTimestamp;
      console.log(
        `[VisualEditorStorage] FDR successfully retrieved for ${domain}:${branchName}`,
        {
          uniqueRunId,
          duration,
        }
      );
      return await promiseResponse;
    } catch (error) {
      const endTimestamp = Date.now();
      const duration = endTimestamp - startTimestamp;
      console.error(
        `[VisualEditorStorage] Failed to retrieve FDR for ${domain}:${branchName}`,
        error,
        {
          uniqueRunId,
          duration,
        }
      );
      return null;
    }
  }

  async getDocumentsForBranches(
    branchNames: string[]
  ): Promise<UnzippedEditorDocument[]> {
    try {
      const documents = await mongoClient.findDocumentsForBranches(branchNames);
      return documents;
    } catch (error) {
      console.error(
        `[VisualEditorStorage] Failed to retrieve documents for ${branchNames.length} branches`,
        error
      );
      return [];
    }
  }
}

export const visualEditorStorage: VisualEditorStorage =
  new VisualEditorStorage();
