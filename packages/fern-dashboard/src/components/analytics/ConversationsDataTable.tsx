"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowRight, MessageSquare } from "lucide-react";

import { FernFai } from "@fern-api/fai-sdk";

import { getConversation } from "@/app/actions/getConversation";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface QueriesDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  baseDocsUrl: string;
}

export function QueriesDataTable<TData, TValue>({
  columns,
  data,
  baseDocsUrl,
}: QueriesDataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="rounded-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MessageSquare className="h-5 w-5" />
          <span className="text-lg font-semibold">Recent Queries</span>
        </div>
        <div>
          <Input
            placeholder="Search..."
            value={(table.getColumn("query")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("query")?.setFilterValue(event.target.value)
            }
            className="h-9 max-w-sm rounded-full"
            autoFocus
          />
        </div>
      </div>
      <div className="">
        <Table className="table-fixed">
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer border-none"
                  onClick={async () => {
                    const conversation = await getConversation({
                      domain: baseDocsUrl,
                      conversationId: (row.original as FernFai.Query)
                        .conversation_id,
                    });
                    console.log(conversation);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "created_at"
                          ? "w-32"
                          : cell.column.id === "actions"
                            ? "w-16"
                            : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export const columns: ColumnDef<FernFai.Query>[] = [
  {
    id: "query",
    accessorFn: (query) => query.text,
    header: "Query",
    cell: ({ row }) => {
      const text = row.getValue("query") as string;
      return (
        <div className="truncate" title={text}>
          {text}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at") as string);
      return (
        <div className="font-medium">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    header: () => {
      return <div></div>;
    },
    id: "actions",
    cell: () => {
      return (
        <div className="text-gray-1100 flex flex-row items-center">
          View
          <ArrowRight className="ml-1 h-3 w-3" />
        </div>
      );
    },
  },
];
