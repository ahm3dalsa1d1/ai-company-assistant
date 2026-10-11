from pydantic import BaseModel, ConfigDict, Field


class DocumentCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200
    )

    content: str = Field(
        min_length=1
    )

    required_access_level: int = Field(
        default=1,
        ge=1,
        le=2
    )


class DocumentResponse(BaseModel):
    id: int
    title: str
    content: str
    required_access_level: int
    created_by_id: int

    model_config = ConfigDict(
        from_attributes=True
    )