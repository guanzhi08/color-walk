from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    color_spin_id = Column(Integer, ForeignKey("color_spins.id"), nullable=True)
    cloudinary_url = Column(String, nullable=False)
    cloudinary_public_id = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    taken_at = Column(DateTime(timezone=True), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    detected_color_id = Column(String, nullable=True)
    color_match_status = Column(String, nullable=True)  # exact / close / mismatch
    upload_date = Column(Date, nullable=False)

    user = relationship("User", back_populates="photos")
    color_spin = relationship("ColorSpin", back_populates="photos")
