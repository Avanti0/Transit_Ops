import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.utils.config import settings
from backend.models.user import User

import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    pw_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pw_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Validate that user_id is a recognisable UUID format (with or without hyphens),
    # but query the DB using the *exact* string stored — do NOT normalise via uuid.UUID()
    # because existing rows may be stored without hyphens.
    try:
        uuid.UUID(user_id.replace("-", ""))  # just validate it looks like a UUID
    except (ValueError, AttributeError):
        raise credentials_exception

    # Try the raw token value first, then the hyphenated form as fallback
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        # Try the hyphenated canonical form in case DB was seeded with hyphens
        try:
            hyphenated = str(uuid.UUID(user_id))
            user = db.query(User).filter(User.id == hyphenated).first()
        except (ValueError, AttributeError):
            pass
    if user is None:
        raise credentials_exception
    return user


def require_roles(*role_names: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.role_name not in role_names:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return role_checker
