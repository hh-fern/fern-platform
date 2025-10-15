"""create fern_scribe_improvements table

Revision ID: f12345678901
Revises: f01234567890
Create Date: 2025-10-15 12:01:00.000000

"""

from typing import (
    Sequence,
    Union,
)

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "f12345678901"
down_revision: Union[str, Sequence[str], None] = "f01234567890"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    connection = op.get_bind()

    # Create improvement_status enum if it doesn't exist
    result = connection.execute(
        sa.text("SELECT 1 FROM pg_type WHERE typname = 'improvement_status'")
    )
    if result.fetchone() is None:
        improvement_status_enum = postgresql.ENUM(
            "pending", "analyzing", "ready", "pr_created", "merged", "failed", "skipped", name="improvement_status"
        )
        improvement_status_enum.create(connection)

    # Check if table already exists
    result = connection.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_name='fern_scribe_improvements'"
        )
    )
    if result.fetchone() is not None:
        return  # Table already exists, skip creation

    # Create fern_scribe_improvements table
    op.create_table(
        "fern_scribe_improvements",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("slack_context_id", sa.String(), nullable=False),
        sa.Column("domain", sa.String(), nullable=False),
        sa.Column("question", sa.String(), nullable=False),
        sa.Column("ideal_response", sa.String(), nullable=False),
        sa.Column("citations", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("target_docs_url", sa.String(), nullable=True),
        sa.Column("target_repo", sa.String(), nullable=True),
        sa.Column("target_file_path", sa.String(), nullable=True),
        sa.Column(
            "improvement_status",
            postgresql.ENUM(
                "pending",
                "analyzing",
                "ready",
                "pr_created",
                "merged",
                "failed",
                "skipped",
                name="improvement_status",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("github_pr_url", sa.String(), nullable=True),
        sa.Column("github_branch_name", sa.String(), nullable=True),
        sa.Column("original_content_hash", sa.String(), nullable=True),
        sa.Column("improvement_summary", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("pr_created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pr_merged_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indices
    op.create_index("idx_fern_scribe_slack_context_id", "fern_scribe_improvements", ["slack_context_id"], unique=False)
    op.create_index("idx_fern_scribe_domain", "fern_scribe_improvements", ["domain"], unique=False)
    op.create_index("idx_fern_scribe_status", "fern_scribe_improvements", ["improvement_status"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_fern_scribe_status", table_name="fern_scribe_improvements")
    op.drop_index("idx_fern_scribe_domain", table_name="fern_scribe_improvements")
    op.drop_index("idx_fern_scribe_slack_context_id", table_name="fern_scribe_improvements")
    op.drop_table("fern_scribe_improvements")

    # Drop enum
    improvement_status_enum = postgresql.ENUM(
        "pending", "analyzing", "ready", "pr_created", "merged", "failed", "skipped", name="improvement_status"
    )
    improvement_status_enum.drop(op.get_bind())
