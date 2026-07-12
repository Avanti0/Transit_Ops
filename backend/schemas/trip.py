from pydantic import BaseModel
from backend.models.trip import TripStatus
from typing import Optional
from datetime import datetime
import uuid


class TripCreate(BaseModel):
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID
    source: str
    destination: str
    cargo_weight: float
    planned_distance: float
    revenue: float = 0.0


class TripComplete(BaseModel):
    actual_distance: float
    fuel_consumed: float


class TripResponse(BaseModel):
    id: uuid.UUID
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID
    source: str
    destination: str
    cargo_weight: float
    planned_distance: float
    actual_distance: Optional[float]
    fuel_consumed: Optional[float]
    revenue: float
    status: TripStatus
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}
