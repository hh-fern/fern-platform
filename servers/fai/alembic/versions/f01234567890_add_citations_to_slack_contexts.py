"""add citations to slack_contexts

Revision ID: f01234567890
Revises: 461b2caaffc7
Create Date: 2025-10-15 12:00:00.000000

"""

from typing import (
    Sequence,
    Union,
)

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "f01234567890"
down_revision: Union[str, Sequence[str], None] = "461b2caaffc7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add citations column to slack_contexts table if it doesn't exist
    connection = op.get_bind()
    result = connection.execute(
        sa.text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='slack_contexts' AND column_name='citations'"
        )
    )
    if result.fetchone() is None:
        op.add_column("slack_contexts", sa.Column("citations", postgresql.ARRAY(sa.String()), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("slack_contexts", "citations")
