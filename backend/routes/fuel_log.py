from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import datetime
from backend.database.session import get_db
from backend.schemas.fuel_log import (
    FuelLogCreate, 
    FuelLogResponse, 
    FuelLogPaginatedResponse
)
from backend.services.fuel_log import FuelLogService
from backend.utils.auth import require_roles

router = APIRouter(prefix="/fuel", tags=["Fuel Logs"])

# RBAC: Fleet Manager, Safety Officer, Financial Analyst, and Driver/Dispatcher are authorized
rbac_dependency = Depends(require_roles("Fleet Manager", "Safety Officer", "Financial Analyst", "Driver/Dispatcher"))

@router.post("/", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED)
def create_fuel_log(
    payload: FuelLogCreate,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Creates a new fuel log record.
    """
    service = FuelLogService(db)
    return service.create_fuel_log(payload)

@router.get("/", response_model=FuelLogPaginatedResponse)
def get_fuel_logs(
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=100, ge=1, le=100, description="Max number of items to return"),
    vehicle_id: Optional[uuid.UUID] = Query(default=None, description="Filter by vehicle UUID"),
    start_date: Optional[datetime.date] = Query(default=None, description="Filter by start date (inclusive)"),
    end_date: Optional[datetime.date] = Query(default=None, description="Filter by end date (inclusive)"),
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Retrieves a list of fuel logs, supporting pagination, vehicle filtering, and date range filtering.
    """
    service = FuelLogService(db)
    items, total = service.list_fuel_logs(
        skip=skip,
        limit=limit,
        vehicle_id=vehicle_id,
        start_date=start_date,
        end_date=end_date
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }

@router.get("/{fuel_log_id}", response_model=FuelLogResponse)
def get_fuel_log_detail(
    fuel_log_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Retrieves a single fuel log details by UUID.
    """
    service = FuelLogService(db)
    return service.get_fuel_log_by_id(fuel_log_id)
