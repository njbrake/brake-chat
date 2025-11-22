"""add chat compactor function

Revision ID: ca9f34c0bfb4
Revises: a5c220713937
Create Date: 2025-11-20 15:28:43.681952

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column, select
import time
from pathlib import Path
import open_webui.internal.db


# revision identifiers, used by Alembic.
revision: str = "ca9f34c0bfb4"
down_revision: Union[str, None] = "a5c220713937"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    function_table = table(
        "function",
        column("id", sa.String()),
        column("user_id", sa.String()),
        column("name", sa.Text()),
        column("type", sa.Text()),
        column("content", sa.Text()),
        column("meta", sa.JSON()),
        column("valves", sa.JSON()),
        column("is_active", sa.Boolean()),
        column("is_global", sa.Boolean()),
        column("updated_at", sa.BigInteger()),
        column("created_at", sa.BigInteger()),
    )

    user_table = table(
        "user",
        column("id", sa.String()),
        column("role", sa.String()),
    )

    conn = op.get_bind()

    admin_user = conn.execute(
        select(user_table.c.id).where(user_table.c.role == "admin").limit(1)
    ).first()

    if not admin_user:
        admin_user = conn.execute(select(user_table.c.id).limit(1)).first()

    if not admin_user:
        print("No users found, skipping chat_compactor function creation")
        return

    user_id = admin_user[0]

    existing = conn.execute(
        select(function_table.c.id).where(function_table.c.id == "chat_compactor")
    ).first()

    if existing:
        print("chat_compactor function already exists, skipping")
        return

    current_file = Path(__file__)
    open_webui_dir = current_file.parent.parent.parent
    function_file = open_webui_dir / "functions" / "chat_compactor.py"

    if not function_file.exists():
        print(f"chat_compactor.py not found at {function_file}, skipping")
        return

    with open(function_file, "r", encoding="utf-8") as f:
        content = f.read()

    meta = {
        "description": "Compacts all chat messages into a concise summary to reduce token usage",
        "manifest": {
            "title": "Chat Compactor",
            "author": "Open WebUI",
            "version": "1.0.0",
            "type": "action",
        },
    }

    current_time = int(time.time())

    conn.execute(
        function_table.insert().values(
            id="chat_compactor",
            user_id=user_id,
            name="Chat Compactor",
            type="action",
            content=content,
            meta=meta,
            valves=None,
            is_active=True,
            is_global=True,
            created_at=current_time,
            updated_at=current_time,
        )
    )

    print("chat_compactor function created successfully")


def downgrade() -> None:
    function_table = table(
        "function",
        column("id", sa.String()),
    )

    conn = op.get_bind()
    conn.execute(function_table.delete().where(function_table.c.id == "chat_compactor"))

    print("chat_compactor function removed")
