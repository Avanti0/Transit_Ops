from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.services.report import ReportService
from backend.utils.auth import get_current_user
import datetime

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/csv")
def export_csv(
    dataset: str = Query(..., description="The dataset to export: 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', or 'expenses'"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """
    Exports a dataset as a streaming CSV download.
    Supported datasets: 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'expenses'.
    """
    service = ReportService(db)
    
    # Pre-validate dataset choice to return HTTP 400 immediately if invalid
    valid_datasets = {
        "vehicles", "drivers", "trips", "maintenance", "fuel", "expenses", 
        "fuel logs", "fuel_logs", "maintenance logs", "maintenance_logs"
    }
    clean_dataset = dataset.lower().strip()
    if clean_dataset not in valid_datasets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid dataset '{dataset}'. Choose from 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'expenses'."
        )
        
    generator = service.generate_csv(clean_dataset)
    
    # Format filename safely (replacing spaces/underscores with hyphens)
    file_prefix = clean_dataset.replace(" ", "-").replace("_", "-")
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{file_prefix}-export-{timestamp}.csv"
    
    return StreamingResponse(
        generator,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
