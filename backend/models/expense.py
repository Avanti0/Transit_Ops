import enum
import uuid
import datetime
from sqlalchemy import Date, Float, DateTime, Enum, CheckConstraint, ForeignKey, func, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base

class ExpenseType(str, enum.Enum):
    TOLL = "Toll"
    MAINTENANCE = "Maintenance"
    REPAIR = "Repair"
    OTHER = "Other"

class Expense(Base):
    """
    SQLAlchemy Model representing an Expense log in the TransitOps fleet management system.
    Follows SQLAlchemy 2.0 declarative styles and best practices.
    """
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="Unique identifier (UUID) for the expense record"
    )
    
    vehicle_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign Key linking to the associated vehicle. Cascades deletes."
    )
    
    expense_type: Mapped[ExpenseType] = mapped_column(
        Enum(ExpenseType, name="expense_type_enum", native_enum=True),
        nullable=False,
        index=True,
        doc="Type of the expense (Toll, Maintenance, Repair, Other). Indexed for filtering."
    )
    
    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Amount of the expense. Must be non-negative."
    )
    
    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        doc="Detailed description or notes about the expense."
    )
    
    date: Mapped[datetime.date] = mapped_column(
        Date,
        nullable=False,
        index=True,
        doc="Date when the expense was incurred. Indexed for report querying."
    )
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp of expense record creation."
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
        back_populates="expenses"
    )

    __table_args__ = (
        CheckConstraint("amount >= 0.0", name="check_expense_amount_non_negative"),
    )

    def __repr__(self) -> str:
        return (
            f"<Expense(id={self.id}, vehicle_id={self.vehicle_id}, "
            f"expense_type='{self.expense_type.value}', amount={self.amount})>"
        )
