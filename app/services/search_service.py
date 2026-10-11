import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.chunk_embedding import ChunkEmbedding
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User

from app.services.embedding_service import (
    cosine_similarity,
    generate_embedding
)


def semantic_search(
    db: Session,
    query: str,
    current_user: User,
    limit: int = 3
) -> list[dict]:

    query_vector = generate_embedding(
        query
    )

    rows = db.execute(
        select(
            DocumentChunk,
            ChunkEmbedding,
            Document
        )
        .join(
            ChunkEmbedding,
            ChunkEmbedding.chunk_id
            == DocumentChunk.id
        )
        .join(
            Document,
            Document.id
            == DocumentChunk.document_id
        )
        .where(
            Document.required_access_level
            <= current_user.access_level
        )
    ).all()

    results = []

    for chunk, embedding, document in rows:

        chunk_vector = json.loads(
            embedding.vector
        )

        score = cosine_similarity(
            query_vector,
            chunk_vector
        )

        if score >= settings.relevance_threshold:

            results.append({
                "document_id": document.id,
                "document_title": document.title,
                "chunk_id": chunk.id,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "score": score
            })

    results.sort(
        key=lambda result: result["score"],
        reverse=True
    )

    return results[:limit]