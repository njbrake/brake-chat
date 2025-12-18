"""Update folder table data

Revision ID: d31026856c01
Revises: 3781e22d8b01
Create Date: 2025-07-13 03:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

revision = "d31026856c01"
down_revision = "3781e22d8b01"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("folder", sa.Column("data", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("folder", "data")
