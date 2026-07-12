import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.models.vehicle import VehicleStatus

class VehicleBase(BaseModel):
    """
    Base Pydantic schema for Vehicle fields shared by both create and response schemas.
    """
    registration_number: str = Field(
        ..., 
        min_length=1, 
        max_length=50, 
        description="Unique registration/license plate number"
    )
    name: str = Field(
        ..., 
        min_length=1, 
        max_length=100, 
        description="Name or model designation of the vehicle"
    )
    vehicle_type: str = Field(
        ..., 
        min_length=1, 
        max_length=50, 
        description="Type of the vehicle (e.g., Truck, Van, Sedan)"
    )
    max_load_capacity: float = Field(
        ..., 
        gt=0.0, 
        description="Maximum load capacity of the vehicle in kg"
    )
    odometer: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Current odometer reading in km"
    )
    acquisition_cost: float = Field(
        ..., 
        ge=0.0, 
        description="Acquisition cost of the vehicle"
    )
    status: VehicleStatus = Field(
        default=VehicleStatus.AVAILABLE, 
        description="Current operational status of the vehicle"
    )
    region: Optional[str] = Field(
        None, 
        max_length=100, 
        description="Geographical region where the vehicle operates"
    )

class VehicleCreate(VehicleBase):
    """
    Pydantic schema for creating a new Vehicle.
    """
    pass

class VehicleUpdate(BaseModel):
    """
    Pydantic schema for updating an existing Vehicle.
    All fields are optional to support partial updates (PATCH).
    """
    registration_number: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=50, 
        description="Unique registration/license plate number"
    )
    name: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=100, 
        description="Name or model designation of the vehicle"
    )
    vehicle_type: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=50, 
        description="Type of the vehicle"
    )
    max_load_capacity: Optional[float] = Field(
        None, 
        gt=0.0, 
        description="Maximum load capacity of the vehicle in kg"
    )
    odometer: Optional[float] = Field(
        None, 
        ge=0.0, 
        description="Current odometer reading in km"
    )
    acquisition_cost: Optional[float] = Field(
        None, 
        ge=0.0, 
        description="Acquisition cost of the vehicle"
    )
    status: Optional[VehicleStatus] = Field(
        None, 
        description="Current operational status of the vehicle"
    )
    region: Optional[str] = Field(
        None, 
        max_length=100, 
        description="Geographical region where the vehicle operates"
    )

class VehicleResponse(VehicleBase):
    """
    Pydantic schema for Vehicle response data.
    Includes database-generated fields (id, created_at, updated_at).
    """
    id: uuid.UUID = Field(..., description="Unique identifier (UUID) of the vehicle")
    created_at: datetime.datetime = Field(..., description="Timestamp when the vehicle was registered")
    updated_at: datetime.datetime = Field(..., description="Timestamp when the vehicle record was last updated")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "e5b8c9d0-1c2b-4e4f-8a8b-9c9d9e9f9a9b",
                "registration_number": "CA-789-DEF",
                "name": "Chevrolet Express",
                "vehicle_type": "Van",
                "max_load_capacity": 1500.0,
                "odometer": 42100.2,
                "acquisition_cost": 38000.00,
                "status": "Available",
                "region": "California North",
                "created_at": "2026-07-12T11:24:24Z",
                "updated_at": "2026-07-12T11:24:24Z"
            }
        }
    )
