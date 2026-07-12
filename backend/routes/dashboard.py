from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.session import get_db
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.models.driver import Driver, DriverStatus
from backend.models.trip import Trip, TripStatus
from backend.models.maintenance import Maintenance
from backend.utils.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
def get_dashboard(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total_vehicles = db.query(Vehicle).count()
    available_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.AVAILABLE).count()
    active_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ON_TRIP).count()
    vehicles_in_maintenance = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.IN_SHOP).count()

    active_trips = db.query(Trip).filter(Trip.status == TripStatus.DISPATCHED).count()
    pending_trips = db.query(Trip).filter(Trip.status == TripStatus.DRAFT).count()
    drivers_on_duty = db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()

    fleet_utilization = round((active_vehicles / total_vehicles * 100), 2) if total_vehicles > 0 else 0.0

    completed = db.query(
        func.sum(Trip.actual_distance),
        func.sum(Trip.fuel_consumed)
    ).filter(Trip.status == TripStatus.COMPLETED).first()
    total_distance = completed[0] or 0.0
    total_fuel = completed[1] or 0.0
    fuel_efficiency = round(total_distance / total_fuel, 2) if total_fuel > 0 else 0.0

    maintenance_cost = db.query(func.sum(Maintenance.cost)).scalar() or 0.0
    operational_cost = round(maintenance_cost, 2)  # fuel_cost added after Person B merges

    return {
        "totalVehicles": total_vehicles,
        "activeVehicles": active_vehicles,
        "availableVehicles": available_vehicles,
        "vehiclesInMaintenance": vehicles_in_maintenance,
        "activeTrips": active_trips,
        "pendingTrips": pending_trips,
        "driversOnDuty": drivers_on_duty,
        "fleetUtilization": fleet_utilization,
        "fuelEfficiency": fuel_efficiency,
        "operationalCost": operational_cost,
    }
