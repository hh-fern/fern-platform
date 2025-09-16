"use client";

import { SearchWidget } from "../components/SearchWidget";

// Demo configuration - replace with actual domain that has Ask AI enabled
const DEMO_CONFIG = {
  domain: "docs.buildwithfern.com", // Use a real Fern domain with Ask AI
  algolia: {
    appId: "placeholder", // Not needed for FDR endpoint
    apiKey: "placeholder", // Not needed for FDR endpoint
    indexName: "placeholder", // Not needed for FDR endpoint
  },
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Fern Search Widget Demo
          </h1>
          <p className="text-xl text-gray-600">
            A standalone search widget that connects to FDR&apos;s Ask AI endpoint
          </p>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">Ask AI</h3>
              <p className="text-gray-600">
                AI-powered chat using FDR&apos;s existing `/api/fern-docs/search/v2/chat` endpoint
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">Standalone</h3>
              <p className="text-gray-600">
                Deploy anywhere, embed on any website
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">No Backend Needed</h3>
              <p className="text-gray-600">
                Connects directly to your existing Fern documentation AI
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">Customizable</h3>
              <p className="text-gray-600">
                Configure appearance and behavior
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 text-left">
          <h3 className="text-lg font-semibold mb-3">Quick Setup</h3>
          <div className="space-y-2 text-sm font-mono bg-white p-4 rounded border">
            <div>1. Replace <code className="bg-gray-100 px-1 rounded">domain</code> with your Fern docs domain</div>
            <div>2. Ensure Ask AI is enabled for your domain</div>
            <div>3. Deploy and embed anywhere!</div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600">
            Click the search button in the bottom-right corner to try Ask AI!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Current domain: <code className="bg-gray-100 px-1 rounded">{DEMO_CONFIG.domain}</code>
          </p>
        </div>
      </div>

      {/* The search widget */}
      <SearchWidget
        {...DEMO_CONFIG}
        buttonProps={{
          variant: "default",
          size: "default",
        }}
      />
    </div>
  );
}