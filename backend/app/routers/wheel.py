import random
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.color_spin import ColorSpin
from app.models.user import User
from app.schemas.color_spin import ColorSpinResponse
from app.constants import COLOR_PALETTE
from app.dependencies import get_current_user

router = APIRouter(prefix="/wheel", tags=["wheel"])


@router.get("/today", response_model=ColorSpinResponse | None)
def get_today_spin(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    spin = db.query(ColorSpin).filter(
        ColorSpin.user_id == current_user.id,
        ColorSpin.date == today,
    ).first()
    return spin


@router.post("/spin", response_model=ColorSpinResponse)
def spin_wheel(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    existing = db.query(ColorSpin).filter(
        ColorSpin.user_id == current_user.id,
        ColorSpin.date == today,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="今天已經轉過輪盤了")

    chosen = random.choice(COLOR_PALETTE)
    spin = ColorSpin(
        user_id=current_user.id,
        date=today,
        color_id=chosen["id"],
        color_name=chosen["name"],
        color_hex=chosen["hex"],
    )
    db.add(spin)
    db.commit()
    db.refresh(spin)
    return spin
