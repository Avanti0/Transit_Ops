import datetime
import uuid
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from backend.models.driver import DriverStatus

class DriverBase(BaseModel):
    """
    Base Pydantic schema for Driver fields shared by both create and response schemas.
    """
    name: str = Field(
        ..., 
        min_length=1, 
        max_length=100, 
        description="Full name of the driver"
    )
    license_number: str = Field(
        ..., 
        min_length=1, 
        max_length=50, 
        description="Unique commercial driver license number"
    )
    license_category: str = Field(
        ..., 
        min_length=1, 
        max_length=20, 
        description="License category/class (e.g. CDL-A, CDL-B)"
    )
    license_expiry: datetime.date = Field(
        ..., 
        description="Expiration date of the driver's license"
    )
    contact_number: str = Field(
        ..., 
        min_length=5, 
        max_length=20, 
        description="Primary contact phone number"
    )
    safety_score: float = Field(
        default=100.0, 
        ge=0.0, 
        le=100.0, 
        description="Safety performance rating score (0.0 to 100.0)"
    )
    status: DriverStatus = Field(
        default=DriverStatus.AVAILABLE, 
        description="Current operational status of the driver"
    )

    @field_validator("contact_number")
    @classmethod
    def validate_contact_number(cls, v: str) -> str:
        """
        Validates that the contact number follows a basic phone format.
        Allows digits, spaces, hyphens, parentheses, and an optional leading plus sign.
        """
        cleaned = v.strip()
        pattern = r"^\+?[0-9\s\-()]{5,20}$"
        if not re.match(pattern, cleaned):
            raise ValueError(
                "Contact number must contain only numbers, spaces, hyphens, "
                "parentheses, or start with '+' and be between 5 and 20 characters."
            )
        return cleaned

class DriverCreate(DriverBase):
    """
    Pydantic schema for creating a new Driver.
    """
    pass

class DriverUpdate(BaseModel):
    """
    Pydantic schema for updating an existing Driver.
    All fields are optional to support partial updates (PATCH).
    """
    name: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=100, 
        description="Full name of the driver"
    )
    license_number: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=50, 
        description="Unique commercial driver license number"
    )
    license_category: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=20, 
        description="License category/class (e.g. CDL-A, CDL-B)"
    )
    license_expiry: Optional[datetime.date] = Field(
        None, 
        description="Expiration date of the driver's license"
    )
    contact_number: Optional[str] = Field(
        None, 
        min_length=5, 
        max_length=20, 
        description="Primary contact phone number"
    )
    safety_score: Optional[float] = Field(
        None, 
        ge=0.0, 
        le=100.0, 
        description="Safety performance rating score (0.0 to 100.0)"
    )
    status: Optional[DriverStatus] = Field(
        None, 
        description="Current operational status of the driver"
    )

    @field_validator("contact_number")
    @classmethod
    def validate_contact_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip()
        pattern = r"^\+?[0-9\s\-()]{5,20}$"
        if not re.match(pattern, cleaned):
            raise ValueError(
                "Contact number must contain only numbers, spaces, hyphens, "
                "parentheses, or start with '+' and be between 5 and 20 characters."
            )
        return cleaned

class DriverResponse(DriverBase):
    """
    Pydantic schema for Driver response data.
    Includes database-generated fields (id, created_at, updated_at).
    """
    id: uuid.UUID = Field(..., description="Unique identifier (UUID) of the driver")
    created_at: datetime.datetime = Field(..., description="Timestamp when the driver was registered")
    updated_at: datetime.datetime = Field(..., description="Timestamp when the driver record was last updated")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "e3ef21f5-19e4-4d8e-908c-9b764c8d5c80",
                "name": "Jane Doe",
                "license_number": "CDL123456789",
                "license_category": "CDL-A",
                "license_expiry": "2027-10-15",
                "contact_number": "+1-555-555-0199",
                "safety_score": 95.5,
                "status": "Available",
                "created_at": "2026-07-12T11:10:15Z",
                "updated_at": "2026-07-12T11:10:15Z"
            }
        }
    )
