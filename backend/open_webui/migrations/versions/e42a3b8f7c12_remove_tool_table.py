"""Remove tool table

Revision ID: e42a3b8f7c12
Revises: d31026856c01
Create Date: 2025-12-15 10:24:35.000000

"""

import sqlalchemy as sa
from alembic import op
from open_webui.internal.db import JSONField

revision = "e42a3b8f7c12"
down_revision = "d31026856c01"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("tool")


def downgrade():
    op.create_table(
        "tool",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("specs", JSONField(), nullable=True),
        sa.Column("meta", JSONField(), nullable=True),
        sa.Column("valves", JSONField(), nullable=True),
        sa.Column("access_control", sa.JSON(), nullable=True),
        sa.Column("updated_at", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.BigInteger(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
