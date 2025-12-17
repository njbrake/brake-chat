"""Drop function table

Revision ID: f1a2b3c4d5e6
Revises: e9f8a2b5c123
Create Date: 2025-12-16 20:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from open_webui.internal.db import JSONField

revision = "f1a2b3c4d5e6"
down_revision = "e9f8a2b5c123"
branch_labels = None
depends_on = None


def upgrade():
    # Check if index exists and drop it if it does
    try:
        op.drop_index("is_global_idx", table_name="function")
    except:
        pass

    op.drop_table("function")


def downgrade():
    op.create_table(
        "function",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("type", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("meta", JSONField(), nullable=True),
        sa.Column("valves", JSONField(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("is_global", sa.Boolean(), nullable=True),
        sa.Column("updated_at", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.BigInteger(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Recreate index if it existed
    try:
        op.create_index("is_global_idx", "function", ["is_global"])
    except:
        pass
