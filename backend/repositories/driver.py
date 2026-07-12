from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
from backend.models.driver import Driver, DriverStatus

class DriverRepository:
    """
    Repository class handling direct database transactions and queries for the Driver model.
    Encapsulates database access details.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def get_by_id(self, driver_id: uuid.UUID) -> Optional[Driver]:
        """
        Retrieves a Driver by their UUID.
        """
        return self.db.query(Driver).filter(Driver.id == driver_id).first()
        
    def get_by_license_number(self, license_number: str) -> Optional[Driver]:
        """
        Retrieves a Driver by their unique license number.
        """
        return self.db.query(Driver).filter(Driver.license_number == license_number).first()
        
    def list_drivers(
        self,
        skip: int = 0,
        limit: int = 100,
        name: Optional[str] = None,
        status: Optional[DriverStatus] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> Tuple[List[Driver], int]:
        """
        Retrieves a list of drivers matching filters, supporting pagination and sorting.
        Returns a tuple of (items, total_count).
        """
        query = self.db.query(Driver)
        
        # Filtering
        if name:
            query = query.filter(Driver.name.ilike(f"%{name}%"))
        if status:
            query = query.filter(Driver.status == status)
            
        total_count = query.count()
        
        # Sorting
        if sort_by and hasattr(Driver, sort_by):
            sort_column = getattr(Driver, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
        else:
            # Default sorting by created_at descending
            query = query.order_by(Driver.created_at.desc())
            
        drivers = query.offset(skip).limit(limit).all()
        return drivers, total_count
        
    def create(self, driver: Driver) -> Driver:
        """
        Saves a new Driver instance to the database.
        """
        self.db.add(driver)
        self.db.commit()
        self.db.refresh(driver)
        return driver
        
    def update(self, driver: Driver) -> Driver:
        """
        Commits changes for an updated Driver instance to the database.
        """
        self.db.commit()
        self.db.refresh(driver)
        return driver
        
    def delete(self, driver: Driver) -> None:
        """
        Deletes a Driver instance from the database.
        """
        self.db.delete(driver)
        self.db.commit()
