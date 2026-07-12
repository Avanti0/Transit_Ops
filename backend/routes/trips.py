from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from backend.database.session import get_db
from backend.models.trip import Trip, TripStatus
from backend.models.driver import Driver
from backend.models.user import User
from backend.schemas.trip import TripCreate, TripComplete, TripResponse
from backend.utils.auth import get_current_user
from backend.services import trip_service

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get("/my", response_model=list[TripResponse])
def get_my_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns trips assigned to the current driver (matched via user_id on driver record).
    """
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="No driver profile linked to this account")
    return db.query(Trip).filter(Trip.driver_id == driver.id).all()


@router.get("/", response_model=list[TripResponse])
def get_trips(
    status: Optional[TripStatus] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Trip)
    if status:
        query = query.filter(Trip.status == status)
    return query.all()


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    from fastapi import HTTPException
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return trip_service.validate_and_create_trip(payload, db)


@router.patch("/{trip_id}/dispatch", response_model=TripResponse)
def dispatch_trip(trip_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return trip_service.dispatch_trip(trip_id, db)


@router.patch("/{trip_id}/complete", response_model=TripResponse)
def complete_trip(trip_id: uuid.UUID, payload: TripComplete, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return trip_service.complete_trip(trip_id, payload, db)


@router.patch("/{trip_id}/cancel", response_model=TripResponse)
def cancel_trip(trip_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return trip_service.cancel_trip(trip_id, db)
