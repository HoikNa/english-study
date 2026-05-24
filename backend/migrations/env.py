import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

# backend/ 디렉터리를 sys.path에 추가 (app.config import 용)
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import get_settings

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = None


def get_url() -> str:
    settings = get_settings()
    url = settings.database_url
    # SQLite는 로컬 개발 전용. 마이그레이션은 PostgreSQL(Supabase) 대상.
    if url.startswith("sqlite"):
        raise RuntimeError(
            "Alembic 마이그레이션은 PostgreSQL(Supabase)에서 실행하세요.\n"
            ".env의 DATABASE_URL을 Supabase 연결 문자열로 변경 후 재실행하세요."
        )
    return url


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = get_url()
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
