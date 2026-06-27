from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.photo import Photo
from app.models.color_spin import ColorSpin
from app.models.user import User
from app.schemas.photo import PhotoResponse, PhotoUploadResponse, ColorMatchInfo
from app.services.exif_service import extract_gps, extract_taken_at, resize_image
from app.services.color_detection import detect_dominant_color, evaluate_match, color_name_by_id
from app.services.cloudinary_service import upload_photo
from app.dependencies import get_current_user

router = APIRouter(prefix="/photos", tags=["photos"])


@router.post("/upload", response_model=PhotoUploadResponse)
def upload(
    file: UploadFile = File(...),
    manual_lat: Optional[float] = Form(None),
    manual_lng: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    spin = db.query(ColorSpin).filter(
        ColorSpin.user_id == current_user.id,
        ColorSpin.date == today,
    ).first()
    if not spin:
        raise HTTPException(status_code=403, detail="請先轉動今天的輪盤才能上傳照片")

    raw_bytes = file.file.read()

    gps = extract_gps(raw_bytes)
    taken_at = extract_taken_at(raw_bytes)
    resized = resize_image(raw_bytes)
    color_result = detect_dominant_color(resized)
    cld = upload_photo(resized)

    detected_id = color_result["color_id"]
    confidence = color_result["confidence"]
    match_status = evaluate_match(spin.color_id, detected_id, confidence)

    photo = Photo(
        user_id=current_user.id,
        color_spin_id=spin.id,
        cloudinary_url=cld["url"],
        cloudinary_public_id=cld["public_id"],
        lat=gps[0] if gps else manual_lat,
        lng=gps[1] if gps else manual_lng,
        taken_at=taken_at,
        detected_color_id=detected_id,
        color_match_status=match_status,
        upload_date=today,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    photo_with_relations = (
        db.query(Photo)
        .options(joinedload(Photo.color_spin), joinedload(Photo.user))
        .filter(Photo.id == photo.id)
        .first()
    )

    match_info = ColorMatchInfo(
        status=match_status,
        detected_color_id=detected_id,
        detected_color_name=color_name_by_id(detected_id),
        spun_color_id=spin.color_id,
        spun_color_name=spin.color_name,
        confidence=confidence,
    )

    return PhotoUploadResponse(photo=photo_with_relations, color_match=match_info)


@router.get("/", response_model=list[PhotoResponse])
def list_photos(
    user_id: Optional[int] = Query(None),
    upload_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    q = db.query(Photo).options(joinedload(Photo.color_spin), joinedload(Photo.user))
    if user_id:
        q = q.filter(Photo.user_id == user_id)
    if upload_date:
        q = q.filter(Photo.upload_date == upload_date)
    return q.order_by(Photo.uploaded_at.desc()).all()


@router.delete("/{photo_id}", status_code=204)
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="找不到照片")
    if photo.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="沒有刪除權限")
    from app.services.cloudinary_service import delete_photo as cld_delete
    cld_delete(photo.cloudinary_public_id)
    db.delete(photo)
    db.commit()
