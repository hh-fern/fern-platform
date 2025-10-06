import { Anthropic } from "@anthropic-ai/sdk";

export interface DiffMinimizationService {
    minimizeDiff: (params: { originalContent: string; newContent: string; filePath: string }) => Promise<{
        success: boolean;
        error?: string;
        minimizedContent?: string;
    }>;
}

export class DiffMinimizationServiceImpl implements DiffMinimizationService {
    constructor(private readonly anthropicApiKey: string) {}

    async minimizeDiff({
        originalContent,
        newContent,
        filePath
    }: {
        originalContent: string;
        newContent: string;
        filePath: string;
    }): Promise<{
        success: boolean;
        error?: string;
        minimizedContent?: string;
    }> {
        try {
            const anthropic = new Anthropic({
                apiKey: this.anthropicApiKey
            });

            const prompt = `You are a helpful assistant that minimizes diffs by removing unnecessary whitespace changes and other non-functional differences while preserving all meaningful changes.

File path: ${filePath}

Original content:
\`\`\`
${originalContent}
\`\`\`

New content:
\`\`\`
${newContent}
\`\`\`

Please analyze the differences between the original and new content. Your task is to produce a minimized version of the new content that:
1. Preserves all meaningful changes (actual content/code changes)
2. Removes unnecessary whitespace differences (trailing spaces, extra blank lines, etc.)
3. Maintains consistent formatting with the original file where possible
4. Avoids introducing unnecessary diff noise

Return ONLY the minimized content, without any explanation or markdown code blocks. The output should be the exact file content that should be committed.`;

            const response = await anthropic.messages.create({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 8000,
                temperature: 0,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            const minimizedContent = response.content[0]?.type === "text" ? response.content[0].text : null;

            if (!minimizedContent) {
                return {
                    success: false,
                    error: "Failed to generate minimized content"
                };
            }

            return {
                success: true,
                minimizedContent
            };
        } catch (error) {
            console.error("Error minimizing diff:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred"
            };
        }
    }
}

export function createDiffMinimizationService(anthropicApiKey: string): DiffMinimizationService {
    return new DiffMinimizationServiceImpl(anthropicApiKey);
}
