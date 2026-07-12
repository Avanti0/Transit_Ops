from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
import datetime
from backend.models.fuel_log import FuelLog

class FuelLogRepository:
    """
    Repository class handling direct database transactions and queries for the FuelLog model.
    Encapsulates database access details.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def get_by_id(self, log_id: uuid.UUID) -> Optional[FuelLog]:
        """
        Retrieves a Fuel Log by UUID.
        """
        return self.db.query(FuelLog).filter(FuelLog.id == str(log_id)).first()
        
    def list_fuel_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        vehicle_id: Optional[uuid.UUID] = None,
        start_date: Optional[datetime.date] = None,
        end_date: Optional[datetime.date] = None
    ) -> Tuple[List[FuelLog], int]:
        """
        Retrieves a list of fuel logs, supporting pagination, vehicle filtering, and date filtering.
        Returns a tuple of (items, total_count).
        """
        query = self.db.query(FuelLog)
        
        # Filtering
        if vehicle_id:
            query = query.filter(FuelLog.vehicle_id == str(vehicle_id))
        if start_date:
            query = query.filter(FuelLog.date >= start_date)
        if end_date:
            query = query.filter(FuelLog.date <= end_date)
            
        total_count = query.count()
        
        # Default sorting by date descending, then created_at descending
        query = query.order_by(FuelLog.date.desc(), FuelLog.created_at.desc())
        
        records = query.offset(skip).limit(limit).all()
        return records, total_count
        
    def create(self, record: FuelLog) -> FuelLog:
        """
        Saves a new Fuel Log to the database.
        """
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
