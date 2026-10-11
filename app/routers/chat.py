from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    MessageResponse
)
from app.services.chat_service import (
    ConversationNotFoundError,
    chat_with_documents,
    prepare_streaming_chat
)
from app.services.conversation_service import (
    add_message,
    delete_conversation,
    get_conversation,
    get_recent_messages,
    get_user_conversations
)

import json

from fastapi.responses import StreamingResponse

from app.services.llm_service import stream_answer

from app.services.conversation_service import add_message




router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


@router.post(
    "/",
    response_model=ChatResponse
)
def chat(
    chat_data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    try:
        return chat_with_documents(
            db=db,
            question=chat_data.question,
            current_user=current_user,
            limit=chat_data.limit,
            conversation_id=chat_data.conversation_id
        )

    except ConversationNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )


@router.get(
    "/conversations",
    response_model=list[ConversationResponse]
)
def read_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):
    return get_user_conversations(
        db,
        current_user
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=list[MessageResponse]
)
def read_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    conversation = get_conversation(
        db,
        conversation_id,
        current_user
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    return get_recent_messages(
        db,
        conversation_id,
        limit=100
    )

@router.post("/stream")
def stream_chat(
    chat_data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    try:
        (
            conversation,
            history,
            search_results
        ) = prepare_streaming_chat(
            db=db,
            question=chat_data.question,
            current_user=current_user,
            limit=chat_data.limit,
            conversation_id=chat_data.conversation_id
        )

    except ConversationNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )

    def generate():

        # First event: conversation information
        metadata = {
            "conversation_id": conversation.id,
            "sources": search_results
        }

        yield (
            f"event: metadata\n"
            f"data: {json.dumps(metadata)}\n\n"
        )

        if not search_results:

            answer = (
                "I couldn't find that information "
                "in the documents you can access."
            )

            yield (
                f"event: token\n"
                f"data: {json.dumps(answer)}\n\n"
            )

            add_message(
                db=db,
                conversation_id=conversation.id,
                role="assistant",
                content=answer
            )

            yield "event: done\ndata: {}\n\n"

            return

        context_parts = []

        for index, result in enumerate(
            search_results,
            start=1
        ):

            context_parts.append(
                f"""
SOURCE {index}
Document: {result["document_title"]}
Chunk: {result["chunk_index"]}

{result["content"]}
"""
            )

        context = "\n".join(
            context_parts
        )

        complete_answer = ""

        for token in stream_answer(
            question=chat_data.question,
            context=context,
            history=history
        ):

            complete_answer += token

            yield (
                f"event: token\n"
                f"data: {json.dumps(token)}\n\n"
            )

        add_message(
            db=db,
            conversation_id=conversation.id,
            role="assistant",
            content=complete_answer
        )

        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )

@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):
    delete_conversation(
        db,
        conversation_id,
        current_user
    )