import pytest

from app.database import _postgres_query, database_backend


def test_database_backend_accepts_sqlite_and_postgres_urls():
    assert database_backend("sqlite:///./backend/.data/test.sqlite3") == "sqlite"
    assert database_backend("postgresql://user:pass@localhost:5432/speakready") == "postgresql"
    assert database_backend("postgres://user:pass@localhost:5432/speakready") == "postgresql"


def test_database_backend_rejects_unknown_urls():
    with pytest.raises(RuntimeError):
        database_backend("mysql://user:pass@localhost:3306/speakready")


def test_postgres_query_uses_psycopg_placeholders():
    query = "SELECT * FROM users WHERE id = ? AND email = ?"
    assert _postgres_query(query) == "SELECT * FROM users WHERE id = %s AND email = %s"
