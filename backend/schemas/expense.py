import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.models.expense import ExpenseType

class ExpenseBase(BaseModel):
    """
    Base Pydantic schema for Expense fields shared by both create and response schemas.
    """
    vehicle_id: uuid.UUID = Field(
        ..., 
        description="UUID of the vehicle associated with this expense record"
    )
    expense_type: ExpenseType = Field(
        ..., 
        description="Type of the expense (Toll, Maintenance, Repair, Other)"
    )
    amount: float = Field(
        ..., 
        ge=0.0, 
        description="Amount of the expense. Must be non-negative."
    )
    description: Optional[str] = Field(
        None, 
        max_length=500, 
        description="Detailed description or notes about the expense"
    )
    date: datetime.date = Field(
        ..., 
        description="Date when the expense was incurred"
    )

class ExpenseCreate(ExpenseBase):
    """
    Pydantic schema for creating a new Expense record.
    """
    pass

class ExpenseUpdate(BaseModel):
    """
    Pydantic schema for updating an existing Expense record.
    All fields are optional to support partial updates (PATCH).
    """
    vehicle_id: Optional[uuid.UUID] = Field(
        None, 
        description="UUID of the vehicle associated with this expense record"
    )
    expense_type: Optional[ExpenseType] = Field(
        None, 
        description="Type of the expense"
    )
    amount: Optional[float] = Field(
        None, 
        ge=0.0, 
        description="Amount of the expense"
    )
    description: Optional[str] = Field(
        None, 
        max_length=500, 
        description="Detailed description or notes about the expense"
    )
    date: Optional[datetime.date] = Field(
        None, 
        description="Date when the expense was incurred"
    )

class ExpenseResponse(ExpenseBase):
    """
    Pydantic schema for Expense response data.
    Includes database-generated fields (id, created_at, updated_at).
    """
    id: uuid.UUID = Field(..., description="Unique identifier (UUID) of the expense record")
    created_at: datetime.datetime = Field(..., description="Timestamp when the expense was logged")
    updated_at: datetime.datetime = Field(..., description="Timestamp when the expense record was last updated")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "vehicle_id": "a6b8c9d0-1c2b-4e4f-8a8b-9c9d9e9f9a9b",
                "expense_type": "Toll",
                "amount": 42.50,
                "description": "State interstate highway toll fee",
                "date": "2026-07-12",
                "created_at": "2026-07-12T11:37:17Z",
                "updated_at": "2026-07-12T11:37:17Z"
            }
        }
    )


class ExpensePaginatedResponse(BaseModel):
    """
    Pydantic schema for paginated Expense responses.
    """
    total: int = Field(..., description="Total count of matching expense records")
    skip: int = Field(..., description="Number of items skipped")
    limit: int = Field(..., description="Maximum number of items returned")
    items: list[ExpenseResponse] = Field(..., description="List of expense records in the current page")

