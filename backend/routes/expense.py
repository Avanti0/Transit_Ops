from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import datetime
from backend.database.session import get_db
from backend.schemas.expense import (
    ExpenseCreate, 
    ExpenseResponse, 
    ExpensePaginatedResponse
)
from backend.models.expense import ExpenseType
from backend.services.expense import ExpenseService
from backend.utils.auth import require_roles

router = APIRouter(prefix="/expenses", tags=["Expenses"])

# RBAC: Fleet Manager, Safety Officer, Financial Analyst, and Driver/Dispatcher are authorized
rbac_dependency = Depends(require_roles("Fleet Manager", "Safety Officer", "Financial Analyst", "Driver/Dispatcher"))

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Creates a new expense record.
    """
    service = ExpenseService(db)
    return service.create_expense(payload)

@router.get("/", response_model=ExpensePaginatedResponse)
def get_expenses(
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=100, ge=1, le=100, description="Max number of items to return"),
    vehicle_id: Optional[uuid.UUID] = Query(default=None, description="Filter by vehicle UUID"),
    expense_type: Optional[ExpenseType] = Query(default=None, description="Filter by expense type"),
    start_date: Optional[datetime.date] = Query(default=None, description="Filter by start date (inclusive)"),
    end_date: Optional[datetime.date] = Query(default=None, description="Filter by end date (inclusive)"),
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Retrieves a list of expense records, supporting pagination, vehicle filtering, expense type filtering, and date range filtering.
    """
    service = ExpenseService(db)
    items, total = service.list_expenses(
        skip=skip,
        limit=limit,
        vehicle_id=vehicle_id,
        expense_type=expense_type,
        start_date=start_date,
        end_date=end_date
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense_detail(
    expense_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=rbac_dependency
):
    """
    Retrieves details of a single expense record by UUID.
    """
    service = ExpenseService(db)
    return service.get_expense_by_id(expense_id)
