from pydantic import BaseModel, Field
from typing import List
import uuid

class VehicleFuelEfficiency(BaseModel):
    vehicle_id: uuid.UUID
    registration_number: str
    name: str
    fuel_efficiency: float = Field(..., description="Distance traveled per unit of fuel (km/L)")

class VehicleROI(BaseModel):
    vehicle_id: uuid.UUID
    registration_number: str
    name: str
    revenue: float
    maintenance_cost: float
    fuel_cost: float
    acquisition_cost: float
    roi_percentage: float = Field(..., description="Return on Investment percentage")

class VehicleUsage(BaseModel):
    vehicle_id: uuid.UUID
    registration_number: str
    name: str
    total_trips: int
    total_distance: float = Field(..., description="Total actual distance traveled in km")

class DriverUtilization(BaseModel):
    driver_id: uuid.UUID
    name: str
    total_trips: int
    total_distance: float
    safety_score: float
    status: str

class MonthlyCost(BaseModel):
    month: str = Field(..., description="Month in YYYY-MM format")
    cost: float

class TripStats(BaseModel):
    total_trips: int
    completed_trips: int
    dispatched_trips: int
    cancelled_trips: int
    draft_trips: int
    total_revenue: float
    avg_revenue: float
    total_actual_distance: float
    total_planned_distance: float

class AnalyticsResponse(BaseModel):
    fleet_average_fuel_efficiency: float = Field(..., description="Average fuel efficiency across the fleet")
    vehicle_fuel_efficiencies: List[VehicleFuelEfficiency]
    vehicle_rois: List[VehicleROI]
    fleet_utilization_percentage: float
    vehicle_usages: List[VehicleUsage]
    driver_utilizations: List[DriverUtilization]
    monthly_fuel_costs: List[MonthlyCost]
    monthly_maintenance_costs: List[MonthlyCost]
    trip_statistics: TripStats
