from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False


class UserResponse(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str]
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateAvatar(BaseModel):
    avatar_url: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
