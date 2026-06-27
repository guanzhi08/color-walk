from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine, SessionLocal
from app.routers import auth, users, wheel, photos
import app.models  # noqa: F401

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


def _create_admin_if_needed():
    from app.config import get_settings
    from app.models.user import User
    from app.services.auth_service import hash_password

    settings = get_settings()
    if not settings.admin_username or not settings.admin_password:
        return

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin = User(
                username=settings.admin_username,
                hashed_password=hash_password(settings.admin_password),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print(f"[setup] 管理員帳號 '{settings.admin_username}' 建立成功")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _create_admin_if_needed()
    yield


app = FastAPI(title="Color Walk", version="1.0.0", lifespan=lifespan)

app.include_router(auth.router,   prefix="/api")
app.include_router(users.router,  prefix="/api")
app.include_router(wheel.router,  prefix="/api")
app.include_router(photos.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


if (STATIC_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")


@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    candidate = STATIC_DIR / full_path
    if candidate.exists() and candidate.is_file():
        return FileResponse(str(candidate))
    index = STATIC_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return Response(
        content="Frontend not built. Run: cd frontend && npm run build",
        status_code=503,
        media_type="text/plain",
    )
