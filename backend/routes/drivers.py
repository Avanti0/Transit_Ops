from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from backend.database.session import get_db
from backend.schemas.driver import DriverCreate, DriverUpdate, DriverResponse, DriverPaginatedResponse
from backend.models.driver import DriverStatus
from backend.services.driver import DriverService
from backend.utils.auth import require_roles, get_current_user

router = APIRouter(prefix="/drivers", tags=["Drivers"])

# RBAC Dependency: Fleet Manager and Safety Officer only
rbac_dependency = Depends(require_roles("Fleet Manager", "Safety Officer"))

@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Registers a new driver. Enforces license number uniqueness and verifies
    that the license is not expired.
    """
    service = DriverService(db)
    return service.create_driver(payload)

@router.get("/", response_model=DriverPaginatedResponse)
def get_drivers(
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=100, ge=1, le=100, description="Max number of items to return"),
    name: Optional[str] = Query(default=None, description="Filter drivers by name (case-insensitive)"),
    status: Optional[DriverStatus] = Query(default=None, description="Filter drivers by status"),
    sort_by: Optional[str] = Query(default=None, description="Field to sort by (e.g., name, license_expiry, safety_score)"),
    sort_order: str = Query(default="asc", pattern="^(asc|desc|ASC|DESC)$", description="Sort direction"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """
    Retrieves a list of drivers matching filters, supporting pagination and sorting.
    """
    service = DriverService(db)
    items, total = service.list_drivers(
        skip=skip,
        limit=limit,
        name=name,
        status_filter=status,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }

@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """
    Retrieves a single driver's details by UUID.
    """
    service = DriverService(db)
    return service.get_driver_by_id(driver_id)

@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: uuid.UUID,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Updates a driver's details. If license number changes, uniqueness check is executed.
    """
    service = DriverService(db)
    return service.update_driver(driver_id, payload)

@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(
    driver_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Deletes a driver's record by UUID.
    """
    service = DriverService(db)
    service.delete_driver(driver_id)
