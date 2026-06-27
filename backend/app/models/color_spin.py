from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ColorSpin(Base):
    __tablename__ = "color_spins"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    color_id = Column(String, nullable=False)
    color_name = Column(String, nullable=False)
    color_hex = Column(String, nullable=False)
    spun_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="color_spins")
    photos = relationship("Photo", back_populates="color_spin")
