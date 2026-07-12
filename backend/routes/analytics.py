from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.analytics import AnalyticsResponse
from backend.services.analytics import AnalyticsService
from backend.utils.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """
    Retrieves complete fleet and operations analytics including vehicle ROIs,
    average fuel efficiency, fleet utilization, monthly cost trends, and driver utilization stats.
    """
    service = AnalyticsService(db)
    return service.get_analytics()
