import io
from datetime import datetime
from typing import Optional
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS


def _dms_to_decimal(dms, ref: str) -> float:
    degrees = float(dms[0])
    minutes = float(dms[1])
    seconds = float(dms[2])
    decimal = degrees + minutes / 60 + seconds / 3600
    if ref in ("S", "W"):
        decimal = -decimal
    return decimal


def extract_gps(image_bytes: bytes) -> Optional[tuple[float, float]]:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif_raw = img._getexif()
        if not exif_raw:
            return None

        gps_info = {}
        for tag_id, value in exif_raw.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == "GPSInfo":
                for k, v in value.items():
                    gps_info[GPSTAGS.get(k, k)] = v

        if not gps_info:
            return None

        lat = _dms_to_decimal(gps_info["GPSLatitude"], gps_info["GPSLatitudeRef"])
        lng = _dms_to_decimal(gps_info["GPSLongitude"], gps_info["GPSLongitudeRef"])
        return lat, lng
    except Exception:
        return None


def extract_taken_at(image_bytes: bytes) -> Optional[datetime]:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif_raw = img._getexif()
        if not exif_raw:
            return None

        for tag_id, value in exif_raw.items():
            if TAGS.get(tag_id) == "DateTimeOriginal":
                return datetime.strptime(value, "%Y:%m:%d %H:%M:%S")
        return None
    except Exception:
        return None


def resize_image(image_bytes: bytes, max_w: int = 640, max_h: int = 480) -> bytes:
    from PIL import ImageOps

    img = Image.open(io.BytesIO(image_bytes))
    img = ImageOps.exif_transpose(img)  # correct orientation
    img = img.convert("RGB")
    img.thumbnail((max_w, max_h), Image.LANCZOS)

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=85)
    out.seek(0)
    return out.read()
