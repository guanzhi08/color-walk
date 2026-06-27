from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from app.schemas.color_spin import ColorSpinResponse
from app.schemas.user import UserResponse


class ColorMatchInfo(BaseModel):
    status: str           # exact / close / mismatch
    detected_color_id: Optional[str]
    detected_color_name: Optional[str]
    spun_color_id: str
    spun_color_name: str
    confidence: float


class PhotoResponse(BaseModel):
    id: int
    user_id: int
    cloudinary_url: str
    lat: Optional[float]
    lng: Optional[float]
    taken_at: Optional[datetime]
    uploaded_at: datetime
    detected_color_id: Optional[str]
    color_match_status: Optional[str]
    upload_date: date
    color_spin: Optional[ColorSpinResponse]
    user: Optional[UserResponse]

    model_config = {"from_attributes": True}


class PhotoUploadResponse(BaseModel):
    photo: PhotoResponse
    color_match: ColorMatchInfo
