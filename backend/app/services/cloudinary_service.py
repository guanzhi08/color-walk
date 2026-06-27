import cloudinary
import cloudinary.uploader
from app.config import get_settings

settings = get_settings()

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


def upload_photo(image_bytes: bytes, folder: str = "color-walk/photos") -> dict:
    result = cloudinary.uploader.upload(
        image_bytes,
        folder=folder,
        resource_type="image",
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result["width"],
        "height": result["height"],
    }


def upload_avatar(image_bytes: bytes, username: str) -> dict:
    result = cloudinary.uploader.upload(
        image_bytes,
        folder="color-walk/avatars",
        public_id=f"avatar_{username}",
        overwrite=True,
        resource_type="image",
        transformation=[{"width": 200, "height": 200, "crop": "fill", "gravity": "face"}],
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


def delete_photo(public_id: str) -> None:
    cloudinary.uploader.destroy(public_id)
