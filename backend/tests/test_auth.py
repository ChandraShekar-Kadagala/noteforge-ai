import pytest

def test_register_success(client):
    response = client.post("/api/auth/register", json={
        "email": "newuser@noteforge.ai",
        "password": "StrongPassword789!",
        "full_name": "New User"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@noteforge.ai"
    assert data["user"]["full_name"] == "New User"

def test_register_duplicate_email(client, test_user):
    response = client.post("/api/auth/register", json={
        "email": test_user.email,
        "password": "Password123!",
        "full_name": "Duplicate User"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

def test_login_success(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "SecurePassword123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_user.email

def test_login_invalid_password(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_get_current_user_me(client, auth_headers, test_user):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["id"] == test_user.id

def test_unauthorized_access(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_social_auth_login(client):
    response = client.post("/api/auth/social", json={
        "provider": "google",
        "email": "google_learner@gmail.com",
        "full_name": "Google Learner",
        "avatar_url": "https://example.com/avatar.png"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "google_learner@gmail.com"
    assert data["user"]["auth_provider"] == "google"
