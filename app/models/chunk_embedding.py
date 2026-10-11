from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ChunkEmbedding(Base):
    __tablename__ = "chunk_embeddings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    chunk_id: Mapped[int] = mapped_column(
        ForeignKey("document_chunks.id"),
        unique=True,
        nullable=False,
        index=True
    )

    vector: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )