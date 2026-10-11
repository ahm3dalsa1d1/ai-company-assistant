import logging


logger = logging.getLogger(__name__)
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentCreate
from app.models.document_chunk import DocumentChunk
from app.services.chunk_service import split_text_into_chunks
import json
from app.models.chunk_embedding import ChunkEmbedding
from app.services.embedding_service import generate_embedding
from app.core.exceptions import (
    PermissionDeniedError,
    ResourceNotFoundError
)


def create_document(
    db: Session,
    document_data: DocumentCreate,
    current_user: User
) -> Document:

    document = Document(
        title=document_data.title,
        content=document_data.content,
        required_access_level=document_data.required_access_level,
        created_by_id=current_user.id
    )

    try:
        db.add(document)

        # Gives us document.id without committing yet
        db.flush()

        chunks = split_text_into_chunks(
            document_data.content
        )

        for index, chunk_content in enumerate(chunks):

            chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=index,
                content=chunk_content
            )

            db.add(chunk)

            # Gives us chunk.id
            db.flush()

            vector = generate_embedding(
                chunk_content
            )

            chunk_embedding = ChunkEmbedding(
                chunk_id=chunk.id,
                vector=json.dumps(vector)
            )

            db.add(chunk_embedding)

        db.commit()
        db.refresh(document)
        logger.info(
            "Document created: id=%s title=%s user=%s",
            document.id,
            document.title,
            current_user.id
            )   
        

        return document

        

    except Exception:
        db.rollback()
        raise

    


def get_accessible_documents(
    db: Session,
    current_user: User
) -> list[Document]:

    documents = db.scalars(
        select(Document).where(
            Document.required_access_level
            <= current_user.access_level
        )
    ).all()

    return list(documents)


def get_document_by_id(
    db: Session,
    document_id: int
) -> Document | None:

    return db.scalar(
        select(Document).where(
            Document.id == document_id
        )
    )

def get_document_chunks(
    db: Session,
    document_id: int
) -> list[DocumentChunk]:

    chunks = db.scalars(
        select(DocumentChunk)
        .where(
            DocumentChunk.document_id == document_id
        )
        .order_by(
            DocumentChunk.chunk_index
        )
    ).all()

    return list(chunks)




def get_document_for_user(
    db: Session,
    document_id: int,
    current_user: User
) -> Document:

    document = get_document_by_id(
        db,
        document_id
    )

    if document is None:
        raise ResourceNotFoundError(
            "Document not found"
        )

    if (
        current_user.access_level
        < document.required_access_level
    ):
        raise PermissionDeniedError(
            "You do not have permission to access this document"
        )

    return document

def delete_document(
    db: Session,
    document_id: int
) -> None:

    document = get_document_by_id(
        db,
        document_id
    )

    if document is None:
        raise ResourceNotFoundError(
            "Document not found"
        )

    chunks = db.scalars(
        select(DocumentChunk).where(
            DocumentChunk.document_id == document_id
        )
    ).all()

    try:
        for chunk in chunks:

            embedding = db.scalar(
                select(ChunkEmbedding).where(
                    ChunkEmbedding.chunk_id == chunk.id
                )
            )

            if embedding:
                db.delete(embedding)

            db.delete(chunk)

        db.delete(document)

        db.commit()
        logger.info(
            "Document deleted: id=%s",
            document_id
            )

    except Exception:
        db.rollback()
        raise