from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(
        min_length=1
    )

    limit: int = Field(
        default=3,
        ge=1,
        le=10
    )


class SearchResult(BaseModel):
    document_id: int
    document_title: str

    chunk_id: int
    chunk_index: int

    content: str

    score: float