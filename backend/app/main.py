from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import Base, engine
from app.routers import auth, users, wheel, photos
import app.models  # noqa: F401 — ensure models are registered before create_all

settings = get_settings()

app = FastAPI(title="Color Walk", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(wheel.router)
app.include_router(photos.router)


@app.get("/health")
def health():
    return {"status": "ok"}
