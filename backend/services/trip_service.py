from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.models.driver import Driver, DriverStatus
from backend.models.trip import Trip, TripStatus
from backend.schemas.trip import TripCreate, TripComplete


def validate_and_create_trip(payload: TripCreate, db: Session) -> Trip:
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Vehicle is not available (status: {vehicle.status.value})")
    if payload.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(status_code=400, detail=f"Cargo weight {payload.cargo_weight}kg exceeds vehicle capacity {vehicle.max_load_capacity}kg")

    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    if driver.status == DriverStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Driver is suspended")
    if driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Driver is not available (status: {driver.status.value})")
    if driver.license_expiry < datetime.now(timezone.utc).date():
        raise HTTPException(status_code=400, detail="Driver license is expired")

    trip = Trip(**payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def dispatch_trip(trip_id, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status != TripStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only Draft trips can be dispatched")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    if vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Vehicle is no longer available (status: {vehicle.status.value})")
    if driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Driver is no longer available (status: {driver.status.value})")
    if driver.license_expiry < datetime.now(timezone.utc).date():
        raise HTTPException(status_code=400, detail="Driver license is expired")

    trip.status = TripStatus.DISPATCHED
    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP
    db.commit()
    db.refresh(trip)
    return trip


def complete_trip(trip_id, payload: TripComplete, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status != TripStatus.DISPATCHED:
        raise HTTPException(status_code=400, detail="Only Dispatched trips can be completed")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    trip.actual_distance = payload.actual_distance
    trip.fuel_consumed = payload.fuel_consumed
    trip.status = TripStatus.COMPLETED
    trip.completed_at = datetime.now(timezone.utc)
    vehicle.status = VehicleStatus.AVAILABLE
    vehicle.odometer += payload.actual_distance
    driver.status = DriverStatus.AVAILABLE
    db.commit()
    db.refresh(trip)
    return trip


def cancel_trip(trip_id, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status not in (TripStatus.DRAFT, TripStatus.DISPATCHED):
        raise HTTPException(status_code=400, detail="Only Draft or Dispatched trips can be cancelled")

    if trip.status == TripStatus.DISPATCHED:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        vehicle.status = VehicleStatus.AVAILABLE
        driver.status = DriverStatus.AVAILABLE

    trip.status = TripStatus.CANCELLED
    db.commit()
    db.refresh(trip)
    return trip
