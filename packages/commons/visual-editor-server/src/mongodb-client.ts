import { attachDatabasePool } from "@vercel/functions";
import {
  Binary,
  type Collection,
  type Db,
  MongoClient,
  type MongoClientOptions,
} from "mongodb";
import { gunzipSync, gzipSync } from "zlib";

import { DocsV2Read } from "@fern-api/fdr-sdk";

type EditorDocument = {
  _id: string;
  domain: string;
  branchName: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
} & (
  | {
      // Old type for backwards compatibility
      data: DocsV2Read.LoadDocsForUrlResponse;
    }
  | {
      data: Binary;
      originalType: string;
      version: number;
    }
);

export type UnzippedEditorDocument = EditorDocument & {
  data: DocsV2Read.LoadDocsForUrlResponse;
};

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  appName: "fern-visual-editor",
};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
      _mongoClient?: MongoClient;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClient = client;
      globalWithMongo._mongoClientPromise = client.connect();

      attachDatabasePool(client);
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);

    attachDatabasePool(client);

    clientPromise = client.connect();
  }
}

class VisualEditorMongoClient {
  private db: Db | null = null;
  private collection: Collection<EditorDocument> | null = null;

  private async ensureConnection(): Promise<Collection<EditorDocument>> {
    if (this.collection) {
      return this.collection;
    }

    if (!clientPromise) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    const client = await clientPromise;
    this.db = client.db("visual-editor");
    this.collection = this.db.collection<EditorDocument>("fdr-data");

    await this.collection.createIndex(
      { domain: 1, branchName: 1 },
      { unique: true }
    );
    await this.collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );

    return this.collection;
  }

  private getDocumentId(domain: string, branchName: string): string {
    return `${domain}::${branchName}`;
  }

  private compressData(data: DocsV2Read.LoadDocsForUrlResponse): Binary {
    const serialized = JSON.stringify(data);
    return new Binary(gzipSync(Buffer.from(serialized, "utf8")));
  }

  private decompressData(data: Binary): DocsV2Read.LoadDocsForUrlResponse {
    try {
      // Ensure we have a proper Buffer from the Binary data
      const buffer = Buffer.isBuffer(data.buffer)
        ? data.buffer
        : Buffer.from(data.buffer);

      // Decompress the gzipped data
      const decompressed = gunzipSync(buffer);

      // Parse the JSON
      const jsonString = decompressed.toString("utf8");
      return JSON.parse(jsonString) as DocsV2Read.LoadDocsForUrlResponse;
    } catch (error) {
      console.error("Failed to decompress data:", error);
      throw new Error(
        `Failed to decompress data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async set(
    domain: string,
    branchName: string,
    data: DocsV2Read.LoadDocsForUrlResponse
  ): Promise<void> {
    console.log("Setting document", domain, branchName);
    const collection = await this.ensureConnection();

    const now = new Date();

    const document: EditorDocument = {
      _id: this.getDocumentId(domain, branchName),
      domain,
      branchName,
      data: this.compressData(data),
      originalType: "DocsV2Read.LoadDocsForUrlResponse",
      version: 2,
      createdAt: now,
      updatedAt: now,
    };

    await collection.replaceOne({ _id: document._id }, document, {
      upsert: true,
    });
  }

  async get(
    domain: string,
    branchName: string
  ): Promise<DocsV2Read.LoadDocsForUrlResponse | null> {
    const collection = await this.ensureConnection();

    const document = await collection.findOne({
      _id: this.getDocumentId(domain, branchName),
    });

    console.log("[1]DOCUMENT", document);

    if (!document) {
      return null;
    }

    if ("version" in document) {
      if (document.originalType === "DocsV2Read.LoadDocsForUrlResponse") {
        return this.decompressData(document.data);
      }
      throw new Error(`Unsupported compressed type: ${document.originalType}`);
    } else {
      // If there's no version, update the document to the latest (compressed) version
      await this.update(domain, branchName, document.data);
    }

    return document.data;
  }

  async update(
    domain: string,
    branchName: string,
    data: DocsV2Read.LoadDocsForUrlResponse
  ): Promise<void> {
    const collection = await this.ensureConnection();
    await collection.updateOne(
      { _id: this.getDocumentId(domain, branchName) },
      {
        $set: {
          data: this.compressData(data),
          version: 2,
          originalType: "DocsV2Read.LoadDocsForUrlResponse",
          updatedAt: new Date(),
        },
      }
    );
  }

  async findDocumentsForBranches(
    branchNames: string[]
  ): Promise<UnzippedEditorDocument[]> {
    const collection = await this.ensureConnection();

    const documents = await collection
      .find({
        branchName: { $in: branchNames },
      })
      .toArray();

    if (!documents) {
      return [];
    }

    return documents.map((document) => {
      return {
        ...document,
        data:
          "version" in document
            ? this.decompressData(document.data)
            : document.data,
      };
    });
  }
}

export const mongoClient: VisualEditorMongoClient =
  new VisualEditorMongoClient();
