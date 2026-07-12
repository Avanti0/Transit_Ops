import enum
import uuid
import datetime
from sqlalchemy import String, Date, Float, DateTime, Enum, CheckConstraint, ForeignKey, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base

class MaintenanceStatus(str, enum.Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"

class Maintenance(Base):
    """
    SQLAlchemy Model representing a Maintenance log in the TransitOps fleet management system.
    Follows SQLAlchemy 2.0 declarative styles and best practices.
    """
    __tablename__ = "maintenance_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique identifier (UUID) for the maintenance log"
    )
    
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign Key linking to the associated vehicle. Cascades deletes on vehicle deletion."
    )
    
    maintenance_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        doc="Type of maintenance (e.g., Preventive, Corrective, Inspection)."
    )
    
    issue: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Brief summary of the issue or reason for maintenance."
    )
    
    description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
        doc="Detailed description of the maintenance performed."
    )
    
    cost: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        doc="Total cost of the maintenance. Must be non-negative."
    )
    
    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus, name="maintenance_status_enum", native_enum=True),
        nullable=False,
        default=MaintenanceStatus.ACTIVE,
        index=True,
        doc="Current status of the maintenance log (Active, Completed). Indexed for filtering."
    )
    
    start_date: Mapped[datetime.date] = mapped_column(
        Date,
        nullable=False,
        index=True,
        doc="Date when the maintenance work started."
    )
    
    end_date: Mapped[datetime.date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
        doc="Date when the maintenance work ended. Nullable for active/ongoing maintenance."
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

    # Relationships
    # Many-to-one relationship with Vehicle
    vehicle: Mapped["Vehicle"] = relationship(
        "Vehicle",
        back_populates="maintenances"
    )

    __table_args__ = (
        CheckConstraint("cost >= 0.0", name="check_maintenance_cost"),
    )

    def __repr__(self) -> str:
        return (
            f"<Maintenance(id={self.id}, vehicle_id={self.vehicle_id}, "
            f"maintenance_type='{self.maintenance_type}', status='{self.status.value}')>"
        )
