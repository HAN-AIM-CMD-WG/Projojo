import os

os.environ.setdefault("FRONTEND_URL", "http://localhost:10121")
os.environ.setdefault("SESSIONS_SECRET_KEY", "test-session-secret")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-google-client-secret")
os.environ.setdefault("GITHUB_CLIENT_ID", "test-github-client-id")
os.environ.setdefault("GITHUB_CLIENT_SECRET", "test-github-client-secret")
os.environ.setdefault("MICROSOFT_CLIENT_ID", "test-microsoft-client-id")
os.environ.setdefault("MICROSOFT_CLIENT_SECRET", "test-microsoft-client-secret")
os.environ.setdefault("TYPEDB_SERVER_ADDR", "localhost:1729")
os.environ.setdefault("TYPEDB_NAME", "projojo_test")
os.environ.setdefault("TYPEDB_USERNAME", "admin")
os.environ.setdefault("TYPEDB_DEFAULT_PASSWORD", "password")
os.environ.setdefault("TYPEDB_NEW_PASSWORD", "password")
os.environ.setdefault("EMAIL_DEFAULT_SENDER", "noreply@test.local")
os.environ.setdefault("EMAIL_SMTP_HOST", "localhost")
os.environ.setdefault("EMAIL_SMTP_PORT", "1025")

import pytest

from auth.jwt_middleware import JWTMiddleware


@pytest.fixture
def middleware():
    return JWTMiddleware.__new__(JWTMiddleware)


@pytest.mark.parametrize(
    ("method", "path", "expected"),
    [
        ("GET", "/themes", True),
        ("GET", "/themes/", True),
        ("GET", "/themes/theme-id", True),
        ("GET", "/themes/project/project-id", True),
        ("POST", "/themes/", False),
        ("PUT", "/themes/theme-id", False),
        ("DELETE", "/themes/theme-id", False),
        ("PUT", "/themes/project/project-id", False),
        ("GET", "/projects/public", True),
        ("GET", "/businesses", False),
    ],
)
def test_should_skip_jwt_validation_by_method_and_path(middleware, method, path, expected):
    assert middleware._should_skip_jwt_validation(path, method) is expected