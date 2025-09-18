"use client";

import { SearchModal } from "@/components/search";
import { SearchWidgetTrigger } from "@/state/search";

export function TestPageClient() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mock Dashboard Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Merge Dashboard
              </h1>
              <nav className="flex space-x-6">
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Overview
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Documentation
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  API
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Settings
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5-5-5h5zm0-10h5l-5-5-5 5h5z"
                  />
                </svg>
              </button>
              <div className="h-8 w-8 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Mock Dashboard Content */}
      <main className="p-6">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Mock Cards */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              API Calls
            </h3>
            <p className="text-3xl font-bold text-blue-600">24,567</p>
            <p className="text-sm text-gray-500">+12% from last month</p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Active Users
            </h3>
            <p className="text-3xl font-bold text-green-600">1,234</p>
            <p className="text-sm text-gray-500">+8% from last month</p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Response Time
            </h3>
            <p className="text-3xl font-bold text-purple-600">125ms</p>
            <p className="text-sm text-gray-500">-3ms from last month</p>
          </div>
        </div>

        {/* Mock Chart Area */}
        <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            API Usage Over Time
          </h3>
          <div className="flex h-64 items-center justify-center rounded bg-gray-100">
            <p className="text-gray-500">Chart placeholder</p>
          </div>
        </div>

        {/* Mock Table */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">
              Recent API Calls
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    /api/users
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      200
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">145ms</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    2 minutes ago
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    /api/documents
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      200
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">89ms</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    5 minutes ago
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">/api/auth</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                      401
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">234ms</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    8 minutes ago
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Search Widget - Bottom Right Corner */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-4">
        <SearchWidgetTrigger />
        <SearchModal />
      </div>
    </div>
  );
}
