import { NextRequest, NextResponse } from "next/server";

import { GitHubLoader } from "@/app/services/github/github-loader";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch") || "main";

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Owner and repo are required" },
        { status: 400 }
      );
    }

    const githubUrl = `https://github.com/${owner}/${repo}`;
    const githubLoader = new GitHubLoader(githubUrl);

    // Fetch the current docs.yml content
    const docsYmlContent = await githubLoader.getFileContent(
      owner,
      repo,
      branch,
      "fern/docs.yml"
    );

    return NextResponse.json({
      content: docsYmlContent,
      success: true,
    });
  } catch (error) {
    console.error("Failed to fetch docs.yml:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch docs.yml content",
        content: null,
        success: false,
      },
      { status: 500 }
    );
  }
}
