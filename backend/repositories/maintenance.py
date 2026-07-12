from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
from backend.models.maintenance import Maintenance, MaintenanceStatus

class MaintenanceRepository:
    """
    Repository class handling direct database transactions and queries for the Maintenance model.
    Encapsulates database access details.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def get_by_id(self, log_id: uuid.UUID) -> Optional[Maintenance]:
        """
        Retrieves a Maintenance record by UUID.
        """
        return self.db.query(Maintenance).filter(Maintenance.id == log_id).first()
        
    def list_maintenance(
        self,
        skip: int = 0,
        limit: int = 100,
        vehicle_id: Optional[uuid.UUID] = None,
        status: Optional[MaintenanceStatus] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> Tuple[List[Maintenance], int]:
        """
        Retrieves a list of maintenance records, supporting pagination, filtering, and sorting.
        Returns a tuple of (items, total_count).
        """
        query = self.db.query(Maintenance)
        
        # Filtering
        if vehicle_id:
            query = query.filter(Maintenance.vehicle_id == vehicle_id)
        if status:
            query = query.filter(Maintenance.status == status)
            
        total_count = query.count()
        
        # Sorting
        if sort_by and hasattr(Maintenance, sort_by):
            sort_column = getattr(Maintenance, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
        else:
            # Default sorting by created_at descending
            query = query.order_by(Maintenance.created_at.desc())
            
        records = query.offset(skip).limit(limit).all()
        return records, total_count
        
    def create(self, record: Maintenance) -> Maintenance:
        """
        Saves a new Maintenance record to the database.
        Uses existing session transaction.
        """
        self.db.add(record)
        self.db.flush()  # flush to populate generated fields and trigger checks, but don't commit yet
        return record
        
    def update(self, record: Maintenance) -> Maintenance:
        """
        Updates an existing Maintenance record.
        Uses existing session transaction.
        """
        self.db.flush()
        return record
