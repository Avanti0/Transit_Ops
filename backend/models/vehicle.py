import enum
import uuid
import datetime
from sqlalchemy import String, Float, DateTime, Enum, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    vehicle_type: Mapped[str] = mapped_column(String(50), nullable=False)
    max_load_capacity: Mapped[float] = mapped_column(Float, nullable=False)
    odometer: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    acquisition_cost: Mapped[float] = mapped_column(Float, nullable=False)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[VehicleStatus] = mapped_column(
        Enum(VehicleStatus, name="vehicle_status_enum", native_enum=True),
        nullable=False, default=VehicleStatus.AVAILABLE, index=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    trips: Mapped[list["Trip"]] = relationship("Trip", back_populates="vehicle")
    maintenances: Mapped[list["Maintenance"]] = relationship("Maintenance", back_populates="vehicle", cascade="all, delete-orphan")

    # One-to-many relationship with Fuel logs
    fuel_logs: Mapped[list["FuelLog"]] = relationship(
        "FuelLog",
        back_populates="vehicle",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with Expenses
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="vehicle",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("max_load_capacity >= 0.0", name="check_vehicle_max_load_capacity"),
        CheckConstraint("odometer >= 0.0", name="check_vehicle_odometer"),
        CheckConstraint("acquisition_cost >= 0.0", name="check_vehicle_acquisition_cost"),
    )
