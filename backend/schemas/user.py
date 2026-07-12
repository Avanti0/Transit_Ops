from pydantic import BaseModel, EmailStr
import uuid


class RoleResponse(BaseModel):
    id: int
    role_name: str

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: RoleResponse

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
