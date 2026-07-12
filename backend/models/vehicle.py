import enum
import uuid
import datetime
from sqlalchemy import String, Float, DateTime, Enum, CheckConstraint, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base

class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"

class Vehicle(Base):
    """
    SQLAlchemy Model representing a Vehicle in the TransitOps fleet management system.
    Follows SQLAlchemy 2.0 declarative styles and best practices.
    """
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique identifier (UUID) for the vehicle"
    )
    
    registration_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        doc="Unique vehicle registration/license plate number."
    )
    
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="Name or model designation of the vehicle."
    )
    
    vehicle_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        doc="Type of the vehicle (e.g., Truck, Van, Sedan)."
    )
    
    max_load_capacity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Maximum load capacity of the vehicle in kilograms."
    )
    
    odometer: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        doc="Current odometer reading of the vehicle in kilometers."
    )
    
    acquisition_cost: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Acquisition cost of the vehicle."
    )
    
    status: Mapped[VehicleStatus] = mapped_column(
        Enum(VehicleStatus, name="vehicle_status_enum", native_enum=True),
        nullable=False,
        default=VehicleStatus.AVAILABLE,
        index=True,
        doc="Current status of the vehicle (Available, On Trip, In Shop, Retired). Indexed for filtering."
    )
    
    region: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        doc="Geographical region where the vehicle operates."
    )
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp of vehicle record creation."
    )
    
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Timestamp of last update."
    )

    # Relationships
    # One-to-many relationship with Maintenance logs
    maintenances: Mapped[list["Maintenance"]] = relationship(
        "Maintenance",
        back_populates="vehicle",
        cascade="all, delete-orphan"
    )

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

    def __repr__(self) -> str:
        return (
            f"<Vehicle(id={self.id}, registration_number='{self.registration_number}', "
            f"name='{self.name}', status='{self.status.value}')>"
        )
