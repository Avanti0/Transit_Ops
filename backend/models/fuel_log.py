import uuid
import datetime
from sqlalchemy import Date, Float, DateTime, ForeignKey, CheckConstraint, func, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base

class FuelLog(Base):
    """
    SQLAlchemy Model representing a Fuel Log in the TransitOps fleet management system.
    Follows SQLAlchemy 2.0 declarative styles and best practices.
    """
    __tablename__ = "fuel_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique identifier (UUID) for the fuel log"
    )
    
    vehicle_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign Key linking to the associated vehicle. Cascades deletes."
    )
    
    liters: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Amount of fuel added in liters. Must be greater than 0."
    )
    
    cost: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Total cost of the fuel. Must be non-negative."
    )
    
    date: Mapped[datetime.date] = mapped_column(
        Date,
        nullable=False,
        index=True,
        doc="Date when the fueling occurred. Indexed for performance queries (e.g., reports)."
    )
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp of fuel log record creation."
    )
    
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Timestamp of last update."
    )

    # Relationships
    # Many-to-one relationship with Vehicle
    vehicle: Mapped["Vehicle"] = relationship(
        "Vehicle",
        back_populates="fuel_logs"
    )

    __table_args__ = (
        CheckConstraint("liters > 0.0", name="check_fuel_log_liters_positive"),
        CheckConstraint("cost >= 0.0", name="check_fuel_log_cost_non_negative"),
    )

    def __repr__(self) -> str:
        return (
            f"<FuelLog(id={self.id}, vehicle_id={self.vehicle_id}, "
            f"liters={self.liters}, cost={self.cost}, date='{self.date}')>"
        )
