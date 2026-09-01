from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BulkIds(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ids: list[UUID] = Field(min_length=1, max_length=100)


class BulkActionResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    count: int = Field(ge=0)
