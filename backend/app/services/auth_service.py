import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
import bcrypt
from app.config import get_settings

settings = get_settings()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def create_access_token(data: dict) -> str:
    header  = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = data.copy()
    payload["exp"] = int(
        (datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()
    )
    body = _b64url_encode(json.dumps(payload).encode())
    msg  = f"{header}.{body}".encode()
    sig  = hmac.new(settings.secret_key.encode(), msg, hashlib.sha256).digest()
    return f"{header}.{body}.{_b64url_encode(sig)}"


def decode_token(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")

    header, body, sig = parts
    msg = f"{header}.{body}".encode()
    expected = _b64url_encode(hmac.new(settings.secret_key.encode(), msg, hashlib.sha256).digest())

    if not hmac.compare_digest(sig, expected):
        raise ValueError("Invalid signature")

    payload = json.loads(_b64url_decode(body))
    if payload.get("exp", 0) < datetime.now(timezone.utc).timestamp():
        raise ValueError("Token expired")

    return payload
