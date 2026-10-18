import os
import sys
import pytest

# Ensure backend root is on sys.path and set SQLite for tests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
import app.main as main_module
import app.database as db_module

# Configure in-memory SQLite engine
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Patch app engine to in-memory test engine
main_module.engine = engine
db_module.engine = engine

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    main_module.app.dependency_overrides[get_db] = override_get_db
    with TestClient(main_module.app) as test_client:
        yield test_client
    main_module.app.dependency_overrides.clear()

from app.models.user import User
from app.utils.security import hash_password, create_access_token

@pytest.fixture
def test_user(db_session):
    user = User(
        email="student@noteforge.ai",
        hashed_password=hash_password("SecurePassword123!"),
        full_name="Alice Developer",
        auth_provider="local",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user):
    token = create_access_token({"sub": test_user.id, "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def other_user(db_session):
    user = User(
        email="bob@noteforge.ai",
        hashed_password=hash_password("OtherPassword123!"),
        full_name="Bob Engineer",
        auth_provider="local",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def other_auth_headers(other_user):
    token = create_access_token({"sub": other_user.id, "email": other_user.email})
    return {"Authorization": f"Bearer {token}"}
