import type { Auth0OrgName } from "@fern-dashboard/services/auth/types";
import { DEFAULT_PR_TITLE } from "@/shared/github";
import type { VisualEditorApiClient } from "../providers/VisualEditorApiClientContext";

export async function handleCreatePr({
    client,
    orgName,
    branch,
    owner,
    site,
    repo,
    baseBranch,
    title,
    onAiGenerationComplete
}: {
    client: VisualEditorApiClient;
    orgName: Auth0OrgName;
    branch: string;
    owner: string;
    site: string;
    repo: string;
    baseBranch: string;
    title?: string;
    onAiGenerationComplete?: () => void;
}): Promise<string | undefined> {
    try {
        const response = await client.postCreatePr({
            orgName,
            owner,
            repo,
            site,
            head: branch,
            base: baseBranch,
            title: title || DEFAULT_PR_TITLE,
            draft: true
        });
        if (response.success) {
            try {
                // No need to await this, we just want to try to generate a PR description.
                void handleGeneratePrDescription({
                    client,
                    orgName,
                    branch,
                    owner,
                    site,
                    repo,
                    baseBranch
                }).then((result) => {
                    if (result.success && onAiGenerationComplete) {
                        onAiGenerationComplete();
                    }
                });
            } catch (error) {
                // Silently fail if we can't generate a PR description.
                // biome-ignore lint/suspicious/noConsole: allow console.error for now
                console.error("Error generating PR description:", error);
            }
            return response.prUrl;
        } else {
            // biome-ignore lint/suspicious/noConsole: allow console.error for now
            console.error("Failed to create PR:", response.error);
        }
    } catch (error) {
        // biome-ignore lint/suspicious/noConsole: allow console.error for now
        console.error("Error creating PR:", error);
    }
    return undefined;
}

export async function handleGeneratePrDescription({
    client,
    orgName,
    branch,
    owner,
    site,
    repo,
    baseBranch
}: {
    client: VisualEditorApiClient;
    orgName: Auth0OrgName;
    branch: string;
    owner: string;
    site: string;
    repo: string;
    baseBranch: string;
}): Promise<{
    success: boolean;
    error?: string;
    newTitle?: string;
}> {
    return await client.generatePrDescription({
        orgName,
        owner,
        site,
        repo,
        branch,
        baseBranch
    });
}
