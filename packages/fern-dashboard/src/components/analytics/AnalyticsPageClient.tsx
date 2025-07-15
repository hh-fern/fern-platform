"use client";

import { useEffect, useState } from "react";

import { FernFai } from "@fern-api/fai-sdk";

import { AnalyticsHistogram } from "./AnalyticsHistogram";
import { TimeRangeSelect } from "./AnalyticsHistogramRangeSelector";
import { AnalyticsHistogramTabBar } from "./AnalyticsHistogramTabBar";
import { ConversationsTable } from "./ConversationsTable";
import { TimeRange } from "./get-request-params";

export type RenderType = "QUESTIONS" | "CONVERSATIONS";

export function AnalyticsPageClient({
  baseDocsUrl,
  initialQueriesData,
  initialHistogramData,
}: {
  baseDocsUrl: string;
  initialQueriesData: FernFai.Query[];
  initialHistogramData: FernFai.HistogramAnalytics;
}) {
  const [renderType, setRenderType] = useState<RenderType>("QUESTIONS");
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.LAST_WEEK);
  const [histogramData, setHistogramData] = useState(initialHistogramData);

  useEffect(() => {
    async function fetchHistogramData() {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docsUrl: baseDocsUrl, timeRange }),
      });

      if (res.ok) {
        const data = await res.json();
        setHistogramData(data);
      } else {
        console.error("Failed to fetch histogram data");
      }
    }

    void fetchHistogramData();
  }, [baseDocsUrl, timeRange]);

  const chartConfig = {
    queries: {
      label: "Queries",
      color: "var(--chart-1)",
    },
  };

  const chartData = histogramData.bars.map((bar) => ({
    label: bar.label,
    count: renderType === "QUESTIONS" ? bar.queryCount : bar.conversationCount,
  }));

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "80%",
          flexDirection: "column",
          alignItems: "center",
          border: "1px solid #ccc",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            borderBottom: "1px solid #ccc",
          }}
        >
          <AnalyticsHistogramTabBar
            renderType={renderType}
            onChangeRenderType={setRenderType}
          />
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        <AnalyticsHistogram
          chartData={chartData}
          renderType={renderType}
          chartConfig={chartConfig}
        />
      </div>
      <div
        style={{
          display: "flex",
          width: "80%",
          flexDirection: "column",
          alignItems: "center",
          border: "1px solid #ccc",
          borderRadius: "16px",
          padding: "16px",
        }}
      >
        <ConversationsTable
          queries={initialQueriesData}
          baseDocsUrl={baseDocsUrl}
        />
      </div>
    </div>
  );
}
