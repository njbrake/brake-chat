"""Add encryption fields to auth table

Revision ID: e5a8c9d1f234
Revises: d31026856c01
Create Date: 2025-11-04 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

revision = "e5a8c9d1f234"
down_revision = "d31026856c01"
branch_labels = None
depends_on = None


def upgrade():
    # Add encryption_key column to store the encrypted encryption key
    op.add_column("auth", sa.Column("encryption_key", sa.Text(), nullable=True))

    # Add encryption_salt column to store the salt used for key derivation
    op.add_column("auth", sa.Column("encryption_salt", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("auth", "encryption_salt")
    op.drop_column("auth", "encryption_key")
