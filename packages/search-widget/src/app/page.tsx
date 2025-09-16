"use client";

import { SearchWidget } from "../components/SearchWidget";

// Demo configuration - replace with your actual config
const DEMO_CONFIG = {
  domain: "demo.fern.com",
  apiEndpoint: "/api/chat",
  algolia: {
    appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "demo_app_id",
    apiKey: process.env.NEXT_PUBLIC_ALGOLIA_API_KEY || "demo_api_key",
    indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "demo_index",
  },
  systemPrompt: "You are a helpful AI assistant for documentation search.",
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
            A standalone search widget with Algolia search and Ask AI functionality
          </p>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">Search</h3>
              <p className="text-gray-600">
                Algolia-powered search through your documentation
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">Ask AI</h3>
              <p className="text-gray-600">
                AI-powered chat to get answers about your docs
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">Standalone</h3>
              <p className="text-gray-600">
                Deploy anywhere, embed on any website
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

        <div className="text-center">
          <p className="text-gray-600">
            Click the search button in the bottom-right corner to try it out!
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