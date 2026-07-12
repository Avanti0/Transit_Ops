import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from backend.models.maintenance import MaintenanceStatus

class MaintenanceBase(BaseModel):
    """
    Base Pydantic schema for Maintenance fields shared by both create and response schemas.
    """
    vehicle_id: uuid.UUID = Field(
        ..., 
        description="UUID of the vehicle associated with this maintenance log"
    )
    maintenance_type: str = Field(
        ..., 
        min_length=1, 
        max_length=50, 
        description="Type of maintenance (e.g., Preventive, Corrective, Inspection)"
    )
    issue: str = Field(
        ..., 
        min_length=1, 
        max_length=255, 
        description="Brief summary of the issue requiring maintenance"
    )
    description: Optional[str] = Field(
        None, 
        max_length=1000, 
        description="Detailed description of the maintenance performed"
    )
    cost: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Total cost of the maintenance. Must be non-negative."
    )
    status: MaintenanceStatus = Field(
        default=MaintenanceStatus.ACTIVE, 
        description="Status of the maintenance log (Active or Completed)"
    )
    start_date: datetime.date = Field(
        ..., 
        description="Date when the maintenance work started"
    )
    end_date: Optional[datetime.date] = Field(
        None, 
        description="Date when the maintenance work ended"
    )

    @model_validator(mode="after")
    def validate_dates(self) -> "MaintenanceBase":
        """
        Validates that the end_date is not earlier than the start_date.
        """
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        return self

class MaintenanceCreate(MaintenanceBase):
    """
    Pydantic schema for creating a new Maintenance record.
    """
    pass

class MaintenanceUpdate(BaseModel):
    """
    Pydantic schema for updating an existing Maintenance record.
    All fields are optional to support partial updates (PATCH).
    """
    vehicle_id: Optional[uuid.UUID] = Field(
        None, 
        description="UUID of the vehicle associated with this maintenance log"
    )
    maintenance_type: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=50, 
        description="Type of maintenance"
    )
    issue: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=255, 
        description="Brief summary of the issue"
    )
    description: Optional[str] = Field(
        None, 
        max_length=1000, 
        description="Detailed description of the maintenance performed"
    )
    cost: Optional[float] = Field(
        None, 
        ge=0.0, 
        description="Total cost of the maintenance"
    )
    status: Optional[MaintenanceStatus] = Field(
        None, 
        description="Status of the maintenance log"
    )
    start_date: Optional[datetime.date] = Field(
        None, 
        description="Date when the maintenance work started"
    )
    end_date: Optional[datetime.date] = Field(
        None, 
        description="Date when the maintenance work ended"
    )

    @model_validator(mode="after")
    def validate_dates(self) -> "MaintenanceUpdate":
        """
        Validates that the end_date is not earlier than the start_date if both are provided.
        """
        start = self.start_date
        end = self.end_date
        if start and end and end < start:
            raise ValueError("end_date cannot be earlier than start_date")
        return self

class MaintenanceResponse(MaintenanceBase):
    """
    Pydantic schema for Maintenance response data.
    Includes database-generated fields (id, created_at, updated_at).
    """
    id: uuid.UUID = Field(..., description="Unique identifier (UUID) of the maintenance record")
    created_at: datetime.datetime = Field(..., description="Timestamp when the maintenance record was created")
    updated_at: datetime.datetime = Field(..., description="Timestamp when the maintenance record was last updated")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "c7a8b8e0-1c6f-4422-99cb-2b478d1f2e1a",
                "vehicle_id": "a6b8c9d0-1c2b-4e4f-8a8b-9c9d9e9f9a9b",
                "maintenance_type": "Corrective",
                "issue": "Engine overheating",
                "description": "Replaced the water pump and radiator hoses, flushed the coolant system.",
                "cost": 650.00,
                "status": "Completed",
                "start_date": "2026-07-08",
                "end_date": "2026-07-09",
                "created_at": "2026-07-12T11:24:24Z",
                "updated_at": "2026-07-12T11:24:24Z"
            }
        }
    )


class MaintenanceClose(BaseModel):
    """
    Pydantic schema for closing an active maintenance log.
    """
    end_date: datetime.date = Field(
        default_factory=datetime.date.today, 
        description="Date when the maintenance work was completed"
    )
    cost: Optional[float] = Field(
        None, 
        ge=0.0, 
        description="Final cost of the maintenance. If provided, overrides existing cost."
    )
    description: Optional[str] = Field(
        None, 
        max_length=1000, 
        description="Updated or additional description upon completion"
    )


class MaintenancePaginatedResponse(BaseModel):
    """
    Pydantic schema for paginated Maintenance responses.
    """
    total: int = Field(..., description="Total count of matching maintenance records")
    skip: int = Field(..., description="Number of items skipped")
    limit: int = Field(..., description="Maximum number of items returned")
    items: list[MaintenanceResponse] = Field(..., description="List of maintenance records in the current page")

