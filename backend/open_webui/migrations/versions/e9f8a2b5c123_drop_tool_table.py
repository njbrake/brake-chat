"""Drop tool table

Revision ID: e9f8a2b5c123
Revises: d31026856c01
Create Date: 2025-12-16 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

revision = "e9f8a2b5c123"
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
        sa.Column("specs", sa.JSON(), nullable=True),
        sa.Column("meta", sa.JSON(), nullable=True),
        sa.Column("valves", sa.JSON(), nullable=True),
        sa.Column("access_control", sa.JSON(), nullable=True),
        sa.Column("updated_at", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.BigInteger(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
