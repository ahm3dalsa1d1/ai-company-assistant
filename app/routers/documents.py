from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status
)
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import (
    get_current_user,
    require_access_level
)
from app.models.user import User
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse
)
from app.services.document_service import (
    create_document,
    get_accessible_documents,
    get_document_by_id,
    get_document_chunks,
    get_document_for_user
)
from app.services.file_service import (
    EmptyDocumentError,
    UnsupportedFileTypeError,
    extract_text_from_file
)

from app.schemas.document_chunk import DocumentChunkResponse
from app.services.document_service import delete_document


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.post(
    "/",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_document(
    document_data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_access_level(2)
    )
):
    return create_document(
        db,
        document_data,
        current_user
    )


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_document(
    file: UploadFile = File(...),

    required_access_level: int = Form(
        default=1,
        ge=1,
        le=2
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_access_level(2)
    )
):
    file_content = await file.read()

    max_file_size = 5 * 1024 * 1024

    if len(file_content) > max_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File is too large. Maximum size is 5 MB."
        )

    try:
        extracted_text = extract_text_from_file(
            file.filename or "",
            file_content
        )

    except (
        UnsupportedFileTypeError,
        EmptyDocumentError
    ) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    document_data = DocumentCreate(
        title=file.filename or "Untitled document",
        content=extracted_text,
        required_access_level=required_access_level
    )

    return create_document(
        db,
        document_data,
        current_user
    )


@router.get(
    "/",
    response_model=list[DocumentResponse]
)
def read_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_accessible_documents(
        db,
        current_user
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_access_level(2)
    )
):
    delete_document(
        db,
        document_id
    )


@router.get(
    "/{document_id}/chunks",
    response_model=list[DocumentChunkResponse]
)
def read_document_chunks(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_document_for_user(
        db,
        document_id,
        current_user
    )

    return get_document_chunks(
        db,
        document_id
    )

@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_access_level(2)
    )
):
    delete_document(
        db,
        document_id
    )