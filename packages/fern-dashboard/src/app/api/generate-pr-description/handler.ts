import { getFernBotOctokitForRepo } from "@fern-dashboard/services/auth/fernBotOctokit";
import { getCurrentSession } from "@fern-dashboard/services/auth/getCurrentSession";
import { createPrDescriptionService } from "@/app/services/pr-description";

export default async function generatePrDescription(request: {
    owner: string;
    repo: string;
    branch: string;
    baseBranch?: string;
}): Promise<{
    success: boolean;
    error?: string;
    newTitle?: string;
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

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
        return { success: false, error: "ANTHROPIC_API_KEY not configured" };
    }

    const prDescriptionService = createPrDescriptionService(octokit, anthropicApiKey, {
        name: session.user.name,
        email: session.user.email
    });

    return await prDescriptionService.generateAndUpdatePrTitleAndDescription(request);
}
