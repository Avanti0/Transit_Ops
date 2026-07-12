from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from backend.database.session import get_db
from backend.schemas.maintenance import (
    MaintenanceCreate, 
    MaintenanceResponse, 
    MaintenanceClose, 
    MaintenancePaginatedResponse
)
from backend.models.maintenance import MaintenanceStatus
from backend.services.maintenance import MaintenanceService
from backend.utils.auth import require_roles

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

# RBAC: Fleet Manager and Safety Officer only for maintenance operations
rbac_dependency = Depends(require_roles("Fleet Manager", "Safety Officer"))

@router.post("/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance(
    payload: MaintenanceCreate,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Creates a new maintenance log. Transitions the vehicle's status to 'In Shop'.
    """
    service = MaintenanceService(db)
    return service.create_maintenance(payload)

@router.get("/", response_model=MaintenancePaginatedResponse)
def get_maintenance(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    vehicle_id: Optional[uuid.UUID] = Query(default=None, description="Filter by vehicle UUID"),
    status: Optional[MaintenanceStatus] = Query(default=None, description="Filter by status (Active, Completed)"),
    sort_by: Optional[str] = Query(default=None, description="Field to sort by (e.g., start_date, cost)"),
    sort_order: str = Query(default="asc", pattern="^(asc|desc|ASC|DESC)$", description="Sort order"),
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Retrieves a list of maintenance records, supporting pagination, filtering, and sorting.
    """
    service = MaintenanceService(db)
    items, total = service.list_maintenance(
        skip=skip,
        limit=limit,
        vehicle_id=vehicle_id,
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

@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_maintenance_detail(
    maintenance_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Retrieves a single maintenance record by UUID.
    """
    service = MaintenanceService(db)
    return service.get_maintenance_by_id(maintenance_id)

@router.patch("/{maintenance_id}/close", response_model=MaintenanceResponse)
def close_maintenance(
    maintenance_id: uuid.UUID,
    payload: MaintenanceClose,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Closes an active maintenance log. Restores the associated vehicle's status to 'Available' (unless Retired).
    """
    service = MaintenanceService(db)
    return service.close_maintenance(maintenance_id, payload)
