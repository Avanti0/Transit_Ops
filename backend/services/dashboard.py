from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.models.driver import Driver, DriverStatus
from backend.models.trip import Trip, TripStatus
from backend.models.maintenance import Maintenance
from backend.models.fuel_log import FuelLog
from backend.models.expense import Expense
from backend.schemas.dashboard import DashboardKPIs

class DashboardService:
    """
    Service class executing optimized aggregate queries to retrieve dashboard KPIs.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def get_kpis(self) -> DashboardKPIs:
        """
        Runs optimized aggregations to return all dashboard Key Performance Indicators (KPIs).
        Uses group-by operations to consolidate queries where appropriate.
        """
        # 1. Optimized Vehicle counts by status in a single query
        vehicle_status_counts = self.db.query(
            Vehicle.status, 
            func.count(Vehicle.id)
        ).group_by(Vehicle.status).all()
        
        status_map = {status: count for status, count in vehicle_status_counts}
        
        total_vehicles = sum(status_map.values())
        active_vehicles = status_map.get(VehicleStatus.ON_TRIP, 0)
        available_vehicles = status_map.get(VehicleStatus.AVAILABLE, 0)
        vehicles_in_maintenance = status_map.get(VehicleStatus.IN_SHOP, 0)
        retired_vehicles = status_map.get(VehicleStatus.RETIRED, 0)
        
        # Fleet utilization = Active Vehicles / (Total Vehicles - Retired Vehicles)
        active_fleet_count = total_vehicles - retired_vehicles
        fleet_utilization = 0.0
        if active_fleet_count > 0:
            fleet_utilization = round((active_vehicles / active_fleet_count) * 100, 2)
            
        # 2. Optimized Trip counts by status in a single query
        trip_status_counts = self.db.query(
            Trip.status, 
            func.count(Trip.id)
        ).group_by(Trip.status).all()
        
        trip_map = {status: count for status, count in trip_status_counts}
        active_trips = trip_map.get(TripStatus.DISPATCHED, 0)
        pending_trips = trip_map.get(TripStatus.DRAFT, 0)
        
        # 3. Drivers on duty
        drivers_on_duty = self.db.query(Driver).filter(
            Driver.status == DriverStatus.ON_TRIP
        ).count()
        
        # 4. Cost Aggregations (using scalar query aggregates)
        total_fuel_cost = self.db.query(func.sum(FuelLog.cost)).scalar() or 0.0
        total_maintenance_cost = self.db.query(func.sum(Maintenance.cost)).scalar() or 0.0
        total_expense_cost = self.db.query(func.sum(Expense.amount)).scalar() or 0.0
        
        # Total operational cost
        total_operational_cost = total_fuel_cost + total_maintenance_cost + total_expense_cost

        # 5. Fleet average fuel efficiency from completed trips (sum distance / sum fuel)
        completed_agg = self.db.query(
            func.sum(Trip.actual_distance),
            func.sum(Trip.fuel_consumed),
        ).filter(Trip.status == TripStatus.COMPLETED).first()

        total_distance = completed_agg[0] or 0.0
        total_fuel_consumed = completed_agg[1] or 0.0
        fuel_efficiency = 0.0
        if total_fuel_consumed > 0:
            fuel_efficiency = round(total_distance / total_fuel_consumed, 2)
        
        return DashboardKPIs(
            total_vehicles=total_vehicles,
            active_vehicles=active_vehicles,
            available_vehicles=available_vehicles,
            vehicles_in_maintenance=vehicles_in_maintenance,
            retired_vehicles=retired_vehicles,
            active_trips=active_trips,
            pending_trips=pending_trips,
            drivers_on_duty=drivers_on_duty,
            fleet_utilization_percentage=fleet_utilization,
            fuel_efficiency=fuel_efficiency,
            total_fuel_cost=round(total_fuel_cost, 2),
            total_maintenance_cost=round(total_maintenance_cost, 2),
            total_operational_cost=round(total_operational_cost, 2)
        )
