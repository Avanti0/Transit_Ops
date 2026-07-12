from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from backend.database.session import get_db
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from backend.utils.auth import get_current_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("/", response_model=list[VehicleResponse])
def get_vehicles(
    vehicle_type: Optional[str] = None,
    status: Optional[VehicleStatus] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Vehicle)
    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type == vehicle_type)
    if status:
        query = query.filter(Vehicle.status == status)
    if region:
        query = query.filter(Vehicle.region == region)
    return query.all()


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(Vehicle).filter(Vehicle.registration_number == payload.registration_number).first():
        raise HTTPException(status_code=400, detail="Registration number already exists")
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: uuid.UUID, payload: VehicleUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
