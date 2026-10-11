from sqlalchemy.orm import Session

from app.models.user import User
from app.services.conversation_service import (
    add_message,
    create_conversation,
    get_conversation,
    get_recent_messages
)
from app.services.llm_service import (
    generate_answer,
    stream_answer
    )
from app.services.search_service import semantic_search


class ConversationNotFoundError(Exception):
    pass


def chat_with_documents(
    db: Session,
    question: str,
    current_user: User,
    limit: int = 3,
    conversation_id: int | None = None
) -> dict:

    if conversation_id is None:

        conversation = create_conversation(
            db=db,
            current_user=current_user,
            first_question=question
        )

        history = []

    else:

        conversation = get_conversation(
            db=db,
            conversation_id=conversation_id,
            current_user=current_user
        )

        if conversation is None:
            raise ConversationNotFoundError(
                "Conversation not found"
            )

        history = get_recent_messages(
            db=db,
            conversation_id=conversation.id,
            limit=6
        )

    history_for_llm = [
        {
            "role": message.role,
            "content": message.content
        }
        for message in history
    ]

    previous_user_questions = [
        message.content
        for message in history
        if message.role == "user"
    ]

    retrieval_query_parts = (
        previous_user_questions[-2:]
        + [question]
    )

    retrieval_query = "\n".join(
        retrieval_query_parts
    )

    add_message(
        db=db,
        conversation_id=conversation.id,
        role="user",
        content=question
    )

    search_results = semantic_search(
        db=db,
        query=retrieval_query,
        current_user=current_user,
        limit=limit
    )

    if not search_results:

        answer = (
            "I couldn't find that information "
            "in the documents you can access."
        )

        add_message(
            db=db,
            conversation_id=conversation.id,
            role="assistant",
            content=answer
        )

        return {
            "conversation_id": conversation.id,
            "answer": answer,
            "sources": []
        }

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

    answer = generate_answer(
        question=question,
        context=context,
        history=history_for_llm
    )

    add_message(
        db=db,
        conversation_id=conversation.id,
        role="assistant",
        content=answer
    )

    return {
        "conversation_id": conversation.id,
        "answer": answer,
        "sources": search_results
    }

def prepare_streaming_chat(
    db: Session,
    question: str,
    current_user: User,
    limit: int = 3,
    conversation_id: int | None = None
):

    if conversation_id is None:
        conversation = create_conversation(
            db=db,
            current_user=current_user,
            first_question=question
        )

        history = []

    else:
        conversation = get_conversation(
            db=db,
            conversation_id=conversation_id,
            current_user=current_user
        )

        if conversation is None:
            raise ConversationNotFoundError(
                "Conversation not found"
            )

        history = get_recent_messages(
            db=db,
            conversation_id=conversation.id,
            limit=6
        )

    history_for_llm = [
        {
            "role": message.role,
            "content": message.content
        }
        for message in history
    ]

    previous_questions = [
        message.content
        for message in history
        if message.role == "user"
    ]

    retrieval_query = "\n".join(
        previous_questions[-2:]
        + [question]
    )

    add_message(
        db=db,
        conversation_id=conversation.id,
        role="user",
        content=question
    )

    search_results = semantic_search(
        db=db,
        query=retrieval_query,
        current_user=current_user,
        limit=limit
    )

    return (
        conversation,
        history_for_llm,
        search_results
    )