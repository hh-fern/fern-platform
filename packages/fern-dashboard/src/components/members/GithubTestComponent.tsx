"use client";

import React from "react";

import { Loadable, getLoadableValue } from "@fern-ui/loadable";

import { GithubRepo } from "@/app/services/github/types";

export declare namespace GithubTestComponent {
  export interface Props {
    repos: Loadable<GithubRepo[]>;
  }
}

export function GithubTestComponent({ repos }: GithubTestComponent.Props) {
  const loadedRepos = getLoadableValue(repos);

  if (!loadedRepos) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="mb-2 text-lg font-semibold">User GitHub Repositories</h2>
      <ul className="list-inside list-disc space-y-1">
        {loadedRepos.map((repo) => (
          <li key={repo.url}>
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {repo.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
