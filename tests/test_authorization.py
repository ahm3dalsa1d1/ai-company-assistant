from sqlalchemy import select

from app.models.conversation import Conversation
from app.models.document import Document
from app.models.user import User


def register_user(
    client,
    username: str,
    email: str,
    password: str = "password123"
):
    return client.post(
        "/users/",
        json={
            "username": username,
            "email": email,
            "password": password
        }
    )


def login_user(
    client,
    username: str,
    password: str = "password123"
) -> str:

    response = client.post(
        "/auth/login",
        data={
            "username": username,
            "password": password
        }
    )

    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}"
    }

def test_level_1_cannot_list_users(
    client
):
    register_user(
        client,
        "normal",
        "normal@example.com"
    )

    token = login_user(
        client,
        "normal"
    )

    response = client.get(
        "/users/",
        headers=auth_header(token)
    )

    assert response.status_code == 403


def test_level_2_can_list_users(
    client,
    db
):
    register_user(
        client,
        "admin",
        "admin@example.com"
    )

    user = db.scalar(
        select(User).where(
            User.username == "admin"
        )
    )

    user.access_level = 2

    db.commit()

    token = login_user(
        client,
        "admin"
    )

    response = client.get(
        "/users/",
        headers=auth_header(token)
    )

    assert response.status_code == 200

def test_level_1_cannot_delete_document(
    client,
    db
):
    register_user(
        client,
        "normal",
        "normal@example.com"
    )

    user = db.scalar(
        select(User).where(
            User.username == "normal"
        )
    )

    document = Document(
        title="Test Document",
        content="Some test content",
        required_access_level=1,
        created_by_id=user.id
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    token = login_user(
        client,
        "normal"
    )

    response = client.delete(
        f"/documents/{document.id}",
        headers=auth_header(token)
    )

    assert response.status_code == 403

def test_level_2_can_delete_document(
    client,
    db
):
    register_user(
        client,
        "admin",
        "admin@example.com"
    )

    user = db.scalar(
        select(User).where(
            User.username == "admin"
        )
    )

    user.access_level = 2
    db.commit()

    document = Document(
        title="Test Document",
        content="Some test content",
        required_access_level=1,
        created_by_id=user.id
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    document_id = document.id

    token = login_user(
        client,
        "admin"
    )

    response = client.delete(
        f"/documents/{document_id}",
        headers=auth_header(token)
    )

    assert response.status_code == 204

    deleted_document = db.scalar(
        select(Document).where(
            Document.id == document_id
        )
    )

    assert deleted_document is None

def test_user_cannot_access_another_users_conversation(
    client,
    db
):
    register_user(
        client,
        "ahmed",
        "ahmed@example.com"
    )

    register_user(
        client,
        "other",
        "other@example.com"
    )

    other_user = db.scalar(
        select(User).where(
            User.username == "other"
        )
    )

    conversation = Conversation(
        user_id=other_user.id,
        title="Private conversation"
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    ahmed_token = login_user(
        client,
        "ahmed"
    )

    response = client.get(
        f"/chat/conversations/{conversation.id}",
        headers=auth_header(ahmed_token)
    )

    assert response.status_code == 404