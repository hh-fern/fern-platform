from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class ImprovementStatus(str, Enum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    READY = "ready"
    PR_CREATED = "pr_created"
    MERGED = "merged"
    FAILED = "failed"
    SKIPPED = "skipped"


class FernScribeImprovement(BaseModel):
    id: str
    slack_context_id: str
    domain: str
    question: str
    ideal_response: str
    citations: list[str] | None
    target_docs_url: str | None
    target_repo: str | None
    target_file_path: str | None
    improvement_status: ImprovementStatus
    github_pr_url: str | None
    github_branch_name: str | None
    original_content_hash: str | None
    improvement_summary: str | None
    created_at: datetime
    updated_at: datetime
    pr_created_at: datetime | None
    pr_merged_at: datetime | None


class CreatePRRequest(BaseModel):
    """Request to create a PR for a docs improvement"""

    slack_context_id: str


class CreatePRResponse(BaseModel):
    """Response from creating a PR"""

    success: bool
    pr_url: str | None
    error: str | None
    improvement_id: str | None
