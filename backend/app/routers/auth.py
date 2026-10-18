from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserOut, Token, SocialAuthRequest
from app.services.auth_service import register_user, authenticate_user, handle_social_auth, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = register_user(user_in, db)
    # Automatically authenticate after registration
    login_req = UserLogin(email=user.email, password=user_in.password)
    return authenticate_user(login_req, db)

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    return authenticate_user(login_in, db)

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    login_req = UserLogin(email=form_data.username, password=form_data.password)
    return authenticate_user(login_req, db)

@router.post("/social", response_model=Token)
def social_login(social_req: SocialAuthRequest, db: Session = Depends(get_db)):
    return handle_social_auth(social_req, db)

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
