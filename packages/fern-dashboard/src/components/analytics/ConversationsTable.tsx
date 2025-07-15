"use client";

import { FernFai } from "@fern-api/fai-sdk";

import { QueriesDataTable, columns } from "./ConversationsDataTable";

export function ConversationsTable({
  queries,
  baseDocsUrl,
}: {
  queries: FernFai.Query[];
  baseDocsUrl: string;
}) {
  return (
    <div>
      <QueriesDataTable
        columns={columns}
        data={queries}
        baseDocsUrl={baseDocsUrl}
      />
    </div>
  );
}
