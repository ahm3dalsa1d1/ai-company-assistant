from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.dependencies.auth import (
    get_current_user,
    require_access_level
)


from app.db.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import (
    create_user,
    get_users,
    get_user_by_id
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    return create_user(
        db,
        user_data
    )

@router.get(
    "/",
    response_model=list[UserResponse]
)
def read_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_access_level(2)
    )
):
    return get_users(db)



@router.get(
    "/me",
    response_model=UserResponse
)
def read_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_access_level(2)
    )
):
    user = get_user_by_id(
        db,
        user_id
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


