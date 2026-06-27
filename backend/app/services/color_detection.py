import io
from colorsys import rgb_to_hsv
from collections import defaultdict
from typing import Optional
from PIL import Image
from app.constants import COLOR_PALETTE, COLOR_ADJACENCY


def _classify_pixel(r: int, g: int, b: int) -> str:
    h, s, v = rgb_to_hsv(r / 255, g / 255, b / 255)
    h_deg = h * 360
    s_pct = s * 100
    v_pct = v * 100

    if v_pct < 15:
        return "neutral"
    if s_pct < 15:
        return "neutral"

    # Brown: low saturation dark orange/reddish range
    if s_pct < 50 and v_pct < 50 and (h_deg < 40 or h_deg > 340):
        return "brown"

    if h_deg < 15 or h_deg >= 345:
        return "red"
    if h_deg < 45:
        return "orange"
    if h_deg < 75:
        return "yellow"
    if h_deg < 165:
        return "green"
    if h_deg < 255:
        return "blue"
    if h_deg < 285:
        return "purple"
    return "pink"


def detect_dominant_color(image_bytes: bytes) -> dict:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((120, 120))

    counts: dict[str, int] = defaultdict(int)
    for r, g, b in img.getdata():
        counts[_classify_pixel(r, g, b)] += 1

    total = sum(counts.values())
    non_neutral = {k: v for k, v in counts.items() if k != "neutral"}

    if not non_neutral:
        return {"color_id": "neutral", "confidence": 1.0}

    dominant = max(non_neutral, key=non_neutral.get)
    confidence = non_neutral[dominant] / (total - counts.get("neutral", 0))

    return {"color_id": dominant, "confidence": round(confidence, 3)}


def evaluate_match(spun_color_id: str, detected_color_id: Optional[str], confidence: float) -> str:
    if detected_color_id is None:
        return "mismatch"
    if detected_color_id == spun_color_id:
        return "exact"
    if detected_color_id in COLOR_ADJACENCY.get(spun_color_id, []):
        return "close"
    return "mismatch"


def color_name_by_id(color_id: str) -> str:
    for c in COLOR_PALETTE:
        if c["id"] == color_id:
            return c["name"]
    return color_id
