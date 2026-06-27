from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import hash_password
from app.services.cloudinary_service import upload_avatar
from app.dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: Session = Depends(get_db), _admin=Depends(get_admin_user)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="使用者名稱已存在")
    user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
        is_admin=body.is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    return db.query(User).order_by(User.created_at).all()


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="不能刪除自己")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="使用者不存在")
    db.delete(user)
    db.commit()


@router.post("/me/avatar", response_model=UserResponse)
def upload_my_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_bytes = file.file.read()
    result = upload_avatar(image_bytes, current_user.username)
    current_user.avatar_url = result["url"]
    db.commit()
    db.refresh(current_user)
    return current_user
