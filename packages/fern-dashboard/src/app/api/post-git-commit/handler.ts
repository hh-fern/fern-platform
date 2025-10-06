import { getFernBotOctokitForRepo } from "@/app/services/auth0/fernBotOctokit";
import { getCurrentSession } from "@/app/services/auth0/getCurrentSession";
import { createDiffMinimizationService } from "@/app/services/diff-minimization";
import type { GithubCommitableFile } from "@/app/services/github/types";

export default async function postGitCommit(request: {
    owner: string;
    repo: string;
    branch: string;
    message: string;
    files: GithubCommitableFile[];
}): Promise<{
    success: boolean;
    error?: string;
    commitSha?: string;
}> {
    const session = await getCurrentSession();
    if (session == null) {
        return { success: false, error: "No session found" };
    }

    const octokitResult = await getFernBotOctokitForRepo(request.owner, request.repo);

    if (!octokitResult.ok) {
        throw new Error(`Failed to get GitHub client: ${octokitResult.error.type}`);
    }

    const octokit = octokitResult.octokit;

    try {
        // Get the current tree SHA for the branch
        const refResponse = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
            owner: request.owner,
            repo: request.repo,
            ref: `heads/${request.branch}`
        });

        if (!refResponse.data.object?.sha) {
            throw new Error("Failed to get branch SHA");
        }
        const baseSha = refResponse.data.object.sha;

        // Get the current commit to get the tree SHA
        const commitResponse = await octokit.request("GET /repos/{owner}/{repo}/git/commits/{commit_sha}", {
            owner: request.owner,
            repo: request.repo,
            commit_sha: baseSha
        });

        if (!commitResponse.data.tree?.sha) {
            throw new Error("Failed to get tree SHA");
        }
        const baseTreeSha = commitResponse.data.tree.sha;

        // Get the base tree to check which files actually exist
        const baseTreeResponse = await octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
            owner: request.owner,
            repo: request.repo,
            tree_sha: baseTreeSha,
            recursive: "true" // Get all files recursively
        });

        // Create a set of existing file paths for quick lookup and also store file SHAs for content retrieval
        const existingFilesMap = new Map(
            baseTreeResponse.data.tree
                ?.filter((item) => item.type === "blob")
                .map((item) => [item.path, item.sha]) || []
        );
        const existingFiles = new Set(existingFilesMap.keys());

        // Minimize diffs using LLM if ANTHROPIC_API_KEY is available
        let minimizedFiles = request.files;
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

        if (anthropicApiKey) {
            const diffMinimizationService = createDiffMinimizationService(anthropicApiKey);
            minimizedFiles = await Promise.all(
                request.files.map(async (file) => {
                    // Skip deleted files and new files (files that don't exist in the base tree)
                    if (file.delete || !existingFiles.has(file.path)) {
                        return file;
                    }

                    try {
                        // Get the original file content from GitHub
                        const fileSha = existingFilesMap.get(file.path);
                        if (!fileSha) {
                            return file;
                        }

                        const blobResponse = await octokit.request("GET /repos/{owner}/{repo}/git/blobs/{file_sha}", {
                            owner: request.owner,
                            repo: request.repo,
                            file_sha: fileSha
                        });

                        const originalContent = Buffer.from(blobResponse.data.content, "base64").toString("utf-8");

                        // Minimize the diff using LLM
                        const result = await diffMinimizationService.minimizeDiff({
                            originalContent,
                            newContent: file.content || "",
                            filePath: file.path
                        });

                        if (result.success && result.minimizedContent) {
                            return {
                                ...file,
                                content: result.minimizedContent
                            };
                        }

                        // If minimization fails, return the original file
                        return file;
                    } catch (error) {
                        console.error(`Failed to minimize diff for ${file.path}:`, error);
                        // On error, return the original file
                        return file;
                    }
                })
            );
        }

        // Create a new tree with the files
        const tree = minimizedFiles
            .map((file) => {
                if (file.delete) {
                    // Only include deletion entries for files that actually exist in the base tree
                    if (!existingFiles.has(file.path)) {
                        return null;
                    }
                    // For deletions of existing files, GitHub still requires mode and type
                    return {
                        path: file.path,
                        mode: (file.mode || "100644") as "100644" | "100755" | "040000" | "160000" | "120000",
                        type: "blob" as const,
                        sha: null
                    };
                } else {
                    // Validate file content exists
                    if (file.content == null) {
                        throw new Error(`File ${file.path} has no content`);
                    }

                    return {
                        path: file.path,
                        mode: (file.mode || "100644") as "100644" | "100755" | "040000" | "160000" | "120000",
                        type: "blob" as const,
                        content: file.content
                    };
                }
            })
            .filter((item) => item != null); // Remove null entries

        const {
            data: { sha: newTreeSha }
        } = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
            owner: request.owner,
            repo: request.repo,
            base_tree: baseTreeSha,
            tree
        });

        // Create a new commit
        const {
            data: { sha: commitSha }
        } = await octokit.request("POST /repos/{owner}/{repo}/git/commits", {
            owner: request.owner,
            repo: request.repo,
            message: request.message,
            tree: newTreeSha,
            parents: [baseSha]
        });

        // Update the branch reference to point to the new commit
        await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
            owner: request.owner,
            repo: request.repo,
            ref: `heads/${request.branch}`,
            sha: commitSha
        });

        return {
            success: true,
            commitSha
        };
    } catch (error) {
        console.error("Failed to commit changes", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}
