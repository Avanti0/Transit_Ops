from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
import datetime
from backend.repositories.fuel_log import FuelLogRepository
from backend.models.fuel_log import FuelLog
from backend.models.vehicle import Vehicle
from backend.schemas.fuel_log import FuelLogCreate
from backend.utils.exceptions import EntityNotFoundException, BusinessRuleException

class FuelLogService:
    """
    Service class executing business logic and orchestrating database transactions
    for Fuel Logs using the FuelLogRepository.
    """
    def __init__(self, db: Session):
        self.db = db
        self.repo = FuelLogRepository(db)
        
    def create_fuel_log(self, schema: FuelLogCreate) -> FuelLog:
        """
        Creates a new fuel log. Validates that the associated vehicle exists.
        """
        # Validate vehicle exists
        vehicle = self.db.query(Vehicle).filter(Vehicle.id == schema.vehicle_id).first()
        if not vehicle:
            raise EntityNotFoundException(f"Vehicle with id '{schema.vehicle_id}' not found.")
            
        record = FuelLog(
            vehicle_id=schema.vehicle_id,
            liters=schema.liters,
            cost=schema.cost,
            date=schema.date
        )
        return self.repo.create(record)
        
    def get_fuel_log_by_id(self, log_id: uuid.UUID) -> FuelLog:
        """
        Retrieves a fuel log record by UUID. Raises 404 if not found.
        """
        record = self.repo.get_by_id(log_id)
        if not record:
            raise EntityNotFoundException("Fuel log not found.")
        return record
        
    def list_fuel_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        vehicle_id: Optional[uuid.UUID] = None,
        start_date: Optional[datetime.date] = None,
        end_date: Optional[datetime.date] = None
    ) -> Tuple[List[FuelLog], int]:
        """
        Retrieves paginated fuel logs with filters.
        """
        # Validate date range if both are provided
        if start_date and end_date and end_date < start_date:
            raise BusinessRuleException("end_date cannot be earlier than start_date.")
        return self.repo.list_fuel_logs(
            skip=skip,
            limit=limit,
            vehicle_id=vehicle_id,
            start_date=start_date,
            end_date=end_date
        )
