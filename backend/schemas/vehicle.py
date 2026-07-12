import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.models.vehicle import VehicleStatus


class VehicleBase(BaseModel):
    registration_number: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    vehicle_type: str = Field(..., min_length=1, max_length=50)
    max_load_capacity: float = Field(..., gt=0.0)
    odometer: float = Field(default=0.0, ge=0.0)
    acquisition_cost: float = Field(..., ge=0.0)
    status: VehicleStatus = Field(default=VehicleStatus.AVAILABLE)
    region: Optional[str] = Field(None, max_length=100)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    vehicle_type: Optional[str] = Field(None, min_length=1, max_length=50)
    max_load_capacity: Optional[float] = Field(None, gt=0.0)
    odometer: Optional[float] = Field(None, ge=0.0)
    acquisition_cost: Optional[float] = Field(None, ge=0.0)
    status: Optional[VehicleStatus] = None
    region: Optional[str] = Field(None, max_length=100)


class VehicleResponse(VehicleBase):
    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
