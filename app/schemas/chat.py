from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(
        min_length=1
    )

    limit: int = Field(
        default=3,
        ge=1,
        le=5
    )

    conversation_id: int | None = None


class ChatSource(BaseModel):
    document_id: int
    document_title: str
    chunk_id: int
    chunk_index: int
    content: str
    score: float


class ChatResponse(BaseModel):
    conversation_id: int
    answer: str
    sources: list[ChatSource]


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime