from pydantic import BaseModel
from backend.models.vehicle import VehicleStatus
from typing import Optional
import uuid


class VehicleCreate(BaseModel):
    registration_number: str
    name: str
    vehicle_type: str
    max_load_capacity: float
    odometer: float = 0.0
    acquisition_cost: float
    region: Optional[str] = None


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    vehicle_type: Optional[str] = None
    max_load_capacity: Optional[float] = None
    odometer: Optional[float] = None
    acquisition_cost: Optional[float] = None
    region: Optional[str] = None
    status: Optional[VehicleStatus] = None


class VehicleResponse(BaseModel):
    id: uuid.UUID
    registration_number: str
    name: str
    vehicle_type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    region: Optional[str]
    status: VehicleStatus

    model_config = {"from_attributes": True}
