import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class FuelLogBase(BaseModel):
    """
    Base Pydantic schema for Fuel Log fields shared by both create and response schemas.
    """
    vehicle_id: uuid.UUID = Field(
        ..., 
        description="UUID of the vehicle associated with this fuel log"
    )
    liters: float = Field(
        ..., 
        gt=0.0, 
        description="Amount of fuel added in liters. Must be greater than 0."
    )
    cost: float = Field(
        ..., 
        ge=0.0, 
        description="Total cost of the fuel. Must be non-negative."
    )
    date: datetime.date = Field(
        ..., 
        description="Date when the fueling occurred"
    )

class FuelLogCreate(FuelLogBase):
    """
    Pydantic schema for creating a new Fuel Log record.
    """
    pass

class FuelLogUpdate(BaseModel):
    """
    Pydantic schema for updating an existing Fuel Log record.
    All fields are optional to support partial updates (PATCH).
    """
    vehicle_id: Optional[uuid.UUID] = Field(
        None, 
        description="UUID of the vehicle associated with this fuel log"
    )
    liters: Optional[float] = Field(
        None, 
        gt=0.0, 
        description="Amount of fuel added in liters"
    )
    cost: Optional[float] = Field(
        None, 
        ge=0.0, 
        description="Total cost of the fuel"
    )
    date: Optional[datetime.date] = Field(
        None, 
        description="Date when the fueling occurred"
    )

class FuelLogResponse(FuelLogBase):
    """
    Pydantic schema for Fuel Log response data.
    Includes database-generated fields (id, created_at, updated_at).
    """
    id: uuid.UUID = Field(..., description="Unique identifier (UUID) of the fuel log record")
    created_at: datetime.datetime = Field(..., description="Timestamp when the fuel log was created")
    updated_at: datetime.datetime = Field(..., description="Timestamp when the fuel log was last updated")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "b2f8a8e0-1c6f-4422-99cb-2b478d1f2e1a",
                "vehicle_id": "a6b8c9d0-1c2b-4e4f-8a8b-9c9d9e9f9a9b",
                "liters": 45.50,
                "cost": 68.25,
                "date": "2026-07-12",
                "created_at": "2026-07-12T11:32:47Z",
                "updated_at": "2026-07-12T11:32:47Z"
            }
        }
    )
