"""
Auth flow check: register -> login -> protected /apps.

Run from backend/:  python -m tests.test_auth   (or: pytest tests)
"""

import os
import tempfile

# Isolated DB + secret; must be set before the app is imported.
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["JWT_SECRET"] = "test-secret-at-least-32-bytes-long!!"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)
CREDS = {"email": "Dev@Example.com", "password": "hunter22"}


def test_auth_flow():
    r = client.post("/auth/register", json=CREDS)
    assert r.status_code == 201, r.text
    assert r.json()["user"]["email"] == "dev@example.com"

    assert client.post("/auth/register", json=CREDS).status_code == 409
    assert client.post("/auth/login", json={**CREDS, "password": "wrong-pass"}).status_code == 401

    token = client.post("/auth/login", json={**CREDS, "email": "dev@example.com"}).json()["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    assert client.get("/auth/me", headers=auth).json()["email"] == "dev@example.com"
    assert client.post("/apps", json={"name": "Demo"}, headers=auth).status_code == 201
    assert len(client.get("/apps", headers=auth).json()) == 1

    assert client.get("/apps").status_code == 401
    assert client.get("/apps", headers={"Authorization": "Bearer forged.token.value"}).status_code == 401


if __name__ == "__main__":
    test_auth_flow()
    print("auth flow OK")
