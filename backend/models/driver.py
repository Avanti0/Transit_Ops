import enum
import uuid
import datetime
from sqlalchemy import String, Date, Float, DateTime, Enum, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from backend.database.base import Base

class DriverStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"

class Driver(Base):
    """
    SQLAlchemy Model representing a Driver in the TransitOps fleet management system.
    Follows SQLAlchemy 2.0 declarative styles and best practices.
    """
    __tablename__ = "drivers"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique identifier (UUID) for the driver"
    )
    
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="Full name of the driver. Indexed for fast lookup and search."
    )
    
    license_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        doc="Unique commercial driving license number."
    )
    
    license_category: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Category or class of driving license (e.g., CDL-A, CDL-B)."
    )
    
    license_expiry: Mapped[datetime.date] = mapped_column(
        Date,
        nullable=False,
        index=True,
        doc="Expiration date of the license. Indexed to quickly fetch expiring licenses."
    )
    
    contact_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Driver's primary contact phone number."
    )
    
    safety_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100.0,
        doc="Driver's safety rating score, ranging from 0.0 to 100.0. Defaults to 100.0."
    )
    
    status: Mapped[DriverStatus] = mapped_column(
        Enum(DriverStatus, name="driver_status_enum", native_enum=True),
        nullable=False,
        default=DriverStatus.AVAILABLE,
        index=True,
        doc="Current status of the driver (Available, On Trip, Off Duty, Suspended). Indexed for filtering."
    )
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp of record creation."
    )
    
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Timestamp of last update."
    )

    __table_args__ = (
        CheckConstraint(
            "safety_score >= 0.0 AND safety_score <= 100.0",
            name="check_driver_safety_score_range"
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Driver(id={self.id}, name='{self.name}', "
            f"license_number='{self.license_number}', status='{self.status.value}')>"
        )
