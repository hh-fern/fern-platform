from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    String,
)
from sqlalchemy.dialects.postgresql import ARRAY

from fai.db import Base
from fai.models.types.fern_scribe_types import (
    FernScribeImprovement,
    ImprovementStatus,
)


class FernScribeDb(Base):
    __tablename__ = "fern_scribe_improvements"
    __table_args__ = {"extend_existing": True}

    # Identity
    id = Column(String, primary_key=True)
    slack_context_id = Column(String, nullable=False)  # Reference, not FK for flexibility
    domain = Column(String, nullable=False)

    # Content (denormalized from slack_context for convenience)
    question = Column(String, nullable=False)
    ideal_response = Column(String, nullable=False)
    citations = Column(ARRAY(String), nullable=True)  # URLs from RAG

    # Target identification
    target_docs_url = Column(String, nullable=True)  # Selected citation URL
    target_repo = Column(String, nullable=True)  # "owner/repo"
    target_file_path = Column(String, nullable=True)  # "fern/pages/file.mdx"

    # PR workflow
    improvement_status = Column(
        Enum(ImprovementStatus, name="improvement_status"),
        nullable=False,
        default=ImprovementStatus.PENDING,
    )
    github_pr_url = Column(String, nullable=True)
    github_branch_name = Column(String, nullable=True)

    # Content tracking
    original_content_hash = Column(String, nullable=True)  # SHA for conflict detection
    improvement_summary = Column(String, nullable=True)  # What changed

    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    pr_created_at = Column(DateTime(timezone=True), nullable=True)
    pr_merged_at = Column(DateTime(timezone=True), nullable=True)

    def to_api(self) -> FernScribeImprovement:
        return FernScribeImprovement(
            id=self.id,
            slack_context_id=self.slack_context_id,
            domain=self.domain,
            question=self.question,
            ideal_response=self.ideal_response,
            citations=self.citations,
            target_docs_url=self.target_docs_url,
            target_repo=self.target_repo,
            target_file_path=self.target_file_path,
            improvement_status=self.improvement_status,
            github_pr_url=self.github_pr_url,
            github_branch_name=self.github_branch_name,
            original_content_hash=self.original_content_hash,
            improvement_summary=self.improvement_summary,
            created_at=self.created_at,
            updated_at=self.updated_at,
            pr_created_at=self.pr_created_at,
            pr_merged_at=self.pr_merged_at,
        )
