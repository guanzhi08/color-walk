import io
import math
from datetime import datetime
from typing import Optional
from PIL import Image, ImageOps
from PIL.ExifTags import TAGS, GPSTAGS

GPS_IFD_TAG = 0x8825
DATETIME_ORIGINAL_TAG = 0x9003


def _to_float(val) -> float:
    """Convert IFDRational, Fraction, (num, den) tuple, or plain number to float."""
    if isinstance(val, tuple) and len(val) == 2:
        num, den = val
        return float(num) / float(den) if den else 0.0
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


def _dms_to_decimal(dms, ref: str) -> float:
    degrees = _to_float(dms[0])
    minutes = _to_float(dms[1])
    seconds = _to_float(dms[2])
    decimal = degrees + minutes / 60 + seconds / 3600
    if ref in ("S", "W"):
        decimal = -decimal
    return decimal


def _get_gps_ifd(img: Image.Image) -> dict:
    """Return GPS IFD as {tag_name: value} using modern Pillow API."""
    try:
        exif = img.getexif()
        gps_ifd = exif.get_ifd(GPS_IFD_TAG)
        if gps_ifd:
            return {GPSTAGS.get(k, k): v for k, v in gps_ifd.items()}
    except Exception:
        pass

    # Fallback: legacy _getexif() for older Pillow builds
    try:
        raw = img._getexif()  # type: ignore[attr-defined]
        if raw:
            for tag_id, value in raw.items():
                if TAGS.get(tag_id) == "GPSInfo":
                    return {GPSTAGS.get(k, k): v for k, v in value.items()}
    except Exception:
        pass

    return {}


def extract_gps(image_bytes: bytes) -> Optional[tuple[float, float]]:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        gps = _get_gps_ifd(img)
        if not gps:
            return None

        lat_dms = gps.get("GPSLatitude")
        lat_ref = gps.get("GPSLatitudeRef", "N")
        lng_dms = gps.get("GPSLongitude")
        lng_ref = gps.get("GPSLongitudeRef", "E")

        if not lat_dms or not lng_dms:
            return None

        # Samsung writes nan placeholders when GPS fix not yet acquired
        if any(math.isnan(_to_float(v)) for v in lat_dms) or \
           any(math.isnan(_to_float(v)) for v in lng_dms):
            return None

        lat = _dms_to_decimal(lat_dms, lat_ref)
        lng = _dms_to_decimal(lng_dms, lng_ref)
        return lat, lng
    except Exception:
        return None


def extract_taken_at(image_bytes: bytes) -> Optional[datetime]:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif = img.getexif()

        # Try DateTimeOriginal (0x9003) first, fall back to DateTime (0x0132)
        raw = exif.get(DATETIME_ORIGINAL_TAG) or exif.get(0x0132)
        if raw:
            return datetime.strptime(raw, "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return None


def resize_image(image_bytes: bytes, max_w: int = 640, max_h: int = 480) -> bytes:
    img = Image.open(io.BytesIO(image_bytes))
    img = ImageOps.exif_transpose(img)  # correct rotation from EXIF orientation tag
    img = img.convert("RGB")
    img.thumbnail((max_w, max_h), Image.LANCZOS)

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=85)
    out.seek(0)
    return out.read()
