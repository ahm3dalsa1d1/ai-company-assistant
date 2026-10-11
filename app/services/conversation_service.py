from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.core.exceptions import ResourceNotFoundError


def create_conversation(
    db: Session,
    current_user: User,
    first_question: str
) -> Conversation:

    title = first_question[:100]

    conversation = Conversation(
        user_id=current_user.id,
        title=title
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


def get_conversation(
    db: Session,
    conversation_id: int,
    current_user: User
) -> Conversation | None:

    return db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )


def add_message(
    db: Session,
    conversation_id: int,
    role: str,
    content: str
) -> Message:

    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


def get_recent_messages(
    db: Session,
    conversation_id: int,
    limit: int = 6
) -> list[Message]:

    messages = db.scalars(
        select(Message)
        .where(
            Message.conversation_id == conversation_id
        )
        .order_by(
            Message.id.desc()
        )
        .limit(limit)
    ).all()

    return list(reversed(messages))


def get_user_conversations(
    db: Session,
    current_user: User
) -> list[Conversation]:

    conversations = db.scalars(
        select(Conversation)
        .where(
            Conversation.user_id == current_user.id
        )
        .order_by(
            Conversation.id.desc()
        )
    ).all()

    return list(conversations)

def delete_conversation(
    db: Session,
    conversation_id: int,
    current_user: User
) -> None:

    conversation = get_conversation(
        db,
        conversation_id,
        current_user
    )

    if conversation is None:
        raise ResourceNotFoundError(
            "Conversation not found"
        )

    messages = db.scalars(
        select(Message).where(
            Message.conversation_id
            == conversation.id
        )
    ).all()

    try:
        for message in messages:
            db.delete(message)

        db.delete(conversation)

        db.commit()

    except Exception:
        db.rollback()
        raise