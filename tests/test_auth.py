def test_register_user(client):

    response = client.post(
        "/users/",
        json={
            "username": "ahmed",
            "email": "ahmed@example.com",
            "password": "password123"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["username"] == "ahmed"
    assert data["email"] == "ahmed@example.com"
    assert data["access_level"] == 1

    assert "password" not in data
    assert "hashed_password" not in data

def test_duplicate_username_returns_409(
    client
):

    user = {
        "username": "ahmed",
        "email": "ahmed@example.com",
        "password": "password123"
    }

    first_response = client.post(
        "/users/",
        json=user
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/users/",
        json={
            "username": "ahmed",
            "email": "different@example.com",
            "password": "password123"
        }
    )

    assert second_response.status_code == 409

def test_wrong_password_returns_401(
    client
):

    client.post(
        "/users/",
        json={
            "username": "ahmed",
            "email": "ahmed@example.com",
            "password": "password123"
        }
    )

    response = client.post(
        "/auth/login",
        data={
            "username": "ahmed",
            "password": "WRONG_PASSWORD"
        }
    )

    assert response.status_code == 401


def test_login_returns_token(
    client
):

    client.post(
        "/users/",
        json={
            "username": "ahmed",
            "email": "ahmed@example.com",
            "password": "password123"
        }
    )

    response = client.post(
        "/auth/login",
        data={
            "username": "ahmed",
            "password": "password123"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_users_me_without_token_returns_401(
    client
):

    response = client.get(
        "/users/me"
    )

    assert response.status_code == 401

def test_users_me_with_token(
    client
):

    client.post(
        "/users/",
        json={
            "username": "ahmed",
            "email": "ahmed@example.com",
            "password": "password123"
        }
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "ahmed",
            "password": "password123"
        }
    )

    token = login_response.json()[
        "access_token"
    ]

    response = client.get(
        "/users/me",
        headers={
            "Authorization": (
                f"Bearer {token}"
            )
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["username"] == "ahmed"
    assert data["access_level"] == 1