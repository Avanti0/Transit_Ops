from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.dashboard import DashboardKPIs
from backend.services.dashboard import DashboardService
from backend.utils.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/", response_model=DashboardKPIs)
def get_dashboard(
    db: Session = Depends(get_db), 
    _=Depends(get_current_user)
):
    """
    Retrieves the dashboard Key Performance Indicators (KPIs) including vehicle status counts,
    trip status counts, active drivers, and total operational costs (fuel + maintenance + expenses).
    """
    service = DashboardService(db)
    return service.get_kpis()
