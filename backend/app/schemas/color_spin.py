from pydantic import BaseModel
from datetime import date, datetime


class ColorSpinResponse(BaseModel):
    id: int
    user_id: int
    date: date
    color_id: str
    color_name: str
    color_hex: str
    spun_at: datetime

    model_config = {"from_attributes": True}
