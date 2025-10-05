"use client";

import { createContext, useContext } from "react";
import type { GithubPrStatus } from "@/shared/github";

type GithubIdentification = { site: string; owner: string; repo: string } | { site: string; githubUrl: string };

export interface VisualEditorApiClient {
    generateSignedUploadUrl: (request: {
        fileName: string;
        contentType: string;
        docsUrl: string;
        slug: string;
    }) => Promise<{
        uploadUrl: string;
        imageUrl: string;
        key: string;
    }>;
    getPrForBranch: (
        request: GithubIdentification & {
            orgName: string;
            branch: string;
            baseBranch?: string;
        }
    ) => Promise<{
        success: boolean;
        error?: string;
        title?: string;
        prNumber?: number;
        prUrl?: string;
        status?: string;
        draft?: boolean;
        merged?: boolean;
        nodeId?: string;
    }>;
    generatePrDescription: (
        request: GithubIdentification & {
            orgName: string;
            branch: string;
            baseBranch?: string;
        }
    ) => Promise<{
        success: boolean;
        error?: string;
        newTitle?: string;
    }>;
    postCreatePr: (
        request: GithubIdentification & {
            orgName: string;
            head: string;
            base: string;
            title: string;
            body?: string;
            draft?: boolean;
        }
    ) => Promise<{
        success: boolean;
        error?: string;
        prUrl?: string;
        prNumber?: number;
        response?: any;
    }>;
    postGitCommit: (
        request: GithubIdentification & {
            orgName: string;
            owner: string;
            repo: string;
            branch: string;
            message: string;
            files: Array<
                | {
                      path: string;
                      delete: true;
                      mode?: "100644" | "100755" | "040000" | "160000" | "120000";
                  }
                | {
                      path: string;
                      content: string;
                      mode?: "100644" | "100755" | "040000" | "160000" | "120000";
                      delete?: false;
                  }
            >;
        }
    ) => Promise<{
        success: boolean;
        error?: string;
        commitSha?: string;
    }>;
    updatePrStatus: (
        request: GithubIdentification & {
            orgName: string;
            branch: string;
            status: "open" | "draft";
            baseBranch?: string;
        }
    ) => Promise<
        | {
              success: false;
              error: string;
          }
        | {
              success: true;
              status?: GithubPrStatus;
              prNumber?: number;
              prUrl?: string;
          }
    >;
    updatePrTitle: (
        request: GithubIdentification & {
            orgName: string;
            branch: string;
            title: string;
            baseBranch?: string;
        }
    ) => Promise<{
        success: boolean;
        error?: string;
        title?: string;
        prNumber?: number;
        prUrl?: string;
    }>;
}

const VisualEditorApiClientContext = createContext<VisualEditorApiClient | null>(null);

export const VisualEditorApiClientProvider = VisualEditorApiClientContext.Provider;

export const useVisualEditorApiClient = () => {
    const context = useContext(VisualEditorApiClientContext);
    if (!context) {
        throw new Error("useVisualEditorApiClient must be used within a VisualEditorApiClientProvider");
    }
    return context;
};
