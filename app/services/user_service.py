from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.exceptions import ResourceConflictError




def create_user(
    db: Session,
    user_data: UserCreate
) -> User:

    existing_username = db.scalar(
        select(User).where(
            User.username == user_data.username
        )
    )

    if existing_username:
        raise ResourceConflictError(
            "Username already exists"
        )

    existing_email = db.scalar(
        select(User).where(
            User.email == user_data.email
        )
    )

    if existing_email:
        raise ResourceConflictError(
            "Email already exists"
        )

    user = User(
        username=user_data.username,
        email=user_data.email,

        hashed_password=hash_password(
            user_data.password
        ),

        
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()

        raise ResourceConflictError(
            "Username or email already exists"
        )

    return user


def get_users(db: Session) -> list[User]:
    return list(
        db.scalars(
            select(User)
        ).all()
    )


def get_user_by_id(
    db: Session,
    user_id: int
) -> User | None:

    return db.scalar(
        select(User).where(
            User.id == user_id
        )
    )


def get_user_by_username(
    db: Session,
    username: str
) -> User | None:

    return db.scalar(
        select(User).where(
            User.username == username
        )
    )