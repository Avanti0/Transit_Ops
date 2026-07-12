from pydantic import BaseModel, Field

class DashboardKPIs(BaseModel):
    """
    Pydantic schema representing the dashboard Key Performance Indicators (KPIs).
    """
    total_vehicles: int = Field(
        ..., 
        description="Total number of registered vehicles"
    )
    active_vehicles: int = Field(
        ..., 
        description="Number of vehicles currently on a trip"
    )
    available_vehicles: int = Field(
        ..., 
        description="Number of vehicles currently available"
    )
    vehicles_in_maintenance: int = Field(
        ..., 
        description="Number of vehicles currently in maintenance/shop"
    )
    retired_vehicles: int = Field(
        ..., 
        description="Number of retired vehicles"
    )
    active_trips: int = Field(
        ..., 
        description="Number of dispatched/active trips"
    )
    pending_trips: int = Field(
        ..., 
        description="Number of pending/draft trips"
    )
    total_drivers: int = Field(default=0, description="Total registered drivers")
    available_drivers: int = Field(default=0, description="Number of available drivers")
    drivers_on_duty: int = Field(..., description="Number of drivers currently on a trip")
    fleet_utilization_percentage: float = Field(
        ..., 
        description="Percentage of the active fleet compared to total vehicles (excluding retired)"
    )
    fuel_efficiency: float = Field(
        default=0.0,
        description="Fleet average fuel efficiency (km/L) computed from completed trips"
    )
    total_fuel_cost: float = Field(
        ..., 
        description="Sum of all costs from fuel logs"
    )
    total_maintenance_cost: float = Field(
        ..., 
        description="Sum of all costs from maintenance logs"
    )
    total_operational_cost: float = Field(
        ..., 
        description="Total operational cost (Fuel Cost + Maintenance Cost + Other Expenses)"
    )
