from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app.routers import auth, users, wheel, photos
import app.models  # noqa: F401

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title="Color Walk", version="1.0.0")

Base.metadata.create_all(bind=engine)

app.include_router(auth.router,   prefix="/api")
app.include_router(users.router,  prefix="/api")
app.include_router(wheel.router,  prefix="/api")
app.include_router(photos.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve bundled JS/CSS assets
if (STATIC_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")


# SPA catch-all: exact file first, then index.html for client-side routes
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
