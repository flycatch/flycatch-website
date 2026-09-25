from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import ENUM, JSON, UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from flycatch_api.config import settings


@compiles(UUID, "sqlite")
def _compile_uuid_sqlite(_type, _compiler, **_kw):
    return "CHAR(36)"


@compiles(ENUM, "sqlite")
def _compile_enum_sqlite(_type, _compiler, **_kw):
    return "VARCHAR(64)"


@compiles(JSON, "sqlite")
def _compile_json_sqlite(_type, _compiler, **_kw):
    return "JSON"

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
