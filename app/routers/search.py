from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.search import (
    SearchRequest,
    SearchResult
)
from app.services.search_service import semantic_search


router = APIRouter(
    prefix="/search",
    tags=["Search"]
)


@router.post(
    "/",
    response_model=list[SearchResult]
)
def search_documents(
    search_data: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):
    return semantic_search(
        db=db,
        query=search_data.query,
        current_user=current_user,
        limit=search_data.limit
    )