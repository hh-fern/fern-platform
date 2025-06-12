import React, { useState } from "react";

import { DashboardApiClient } from "@/app/services/dashboard-api/client";

const ManualBranchCreator: React.FC = () => {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [newBranch, setNewBranch] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    try {
      await DashboardApiClient.createGithubBranch({
        repo,
        owner,
        baseBranch,
        newBranch,
      });
      setStatus(`✅ Created branch '${newBranch}' in ${owner}/${repo}`);
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Failed: ${err.message}`);
    }
  };

  return (
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium">Owner</label>
        <input
          type="text"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="e.g. octocat"
          className="w-full rounded border px-2 py-1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Repository</label>
        <input
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="e.g. hello-world"
          className="w-full rounded border px-2 py-1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Base Branch</label>
        <input
          type="text"
          value={baseBranch}
          onChange={(e) => setBaseBranch(e.target.value)}
          placeholder="e.g. main"
          className="w-full rounded border px-2 py-1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">New Branch</label>
        <input
          type="text"
          value={newBranch}
          onChange={(e) => setNewBranch(e.target.value)}
          placeholder="e.g. feature/cool-thing"
          className="w-full rounded border px-2 py-1"
          required
        />
      </div>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Create Branch
      </button>

      {status && <p className="mt-2 text-sm">{status}</p>}
    </form>
  );
};

export default ManualBranchCreator;
