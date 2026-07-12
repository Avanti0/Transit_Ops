from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
import datetime
from backend.repositories.maintenance import MaintenanceRepository
from backend.models.maintenance import Maintenance, MaintenanceStatus
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.schemas.maintenance import MaintenanceCreate, MaintenanceClose
from backend.utils.exceptions import EntityNotFoundException, BusinessRuleException, TransitOpsException

class MaintenanceService:
    """
    Service class executing business logic and orchestrating database transactions
    for Maintenance logs and vehicle state transitions.
    """
    def __init__(self, db: Session):
        self.db = db
        self.repo = MaintenanceRepository(db)
        
    def create_maintenance(self, schema: MaintenanceCreate) -> Maintenance:
        """
        Creates a new maintenance log. Automatically transitions the associated vehicle's
        status to 'In Shop' within a transaction.
        """
        try:
            # Retrieve the vehicle
            vehicle = self.db.query(Vehicle).filter(Vehicle.id == schema.vehicle_id).first()
            if not vehicle:
                raise EntityNotFoundException(f"Vehicle with id '{schema.vehicle_id}' not found.")
                
            # Check if vehicle is retired
            if vehicle.status == VehicleStatus.RETIRED:
                raise BusinessRuleException("Cannot schedule maintenance for a Retired vehicle.")
                
            # Create the maintenance record
            record = Maintenance(
                vehicle_id=schema.vehicle_id,
                maintenance_type=schema.maintenance_type,
                issue=schema.issue,
                description=schema.description,
                cost=schema.cost,
                status=MaintenanceStatus.ACTIVE,
                start_date=schema.start_date,
                end_date=schema.end_date
            )
            
            # Transition vehicle status to In Shop
            vehicle.status = VehicleStatus.IN_SHOP
            
            # Save the record
            self.repo.create(record)
            
            # Commit the transaction
            self.db.commit()
            self.db.refresh(record)
            return record
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, TransitOpsException):
                raise e
            raise e
            
    def get_maintenance_by_id(self, log_id: uuid.UUID) -> Maintenance:
        """
        Retrieves a maintenance record by UUID. Raises 404 if not found.
        """
        record = self.repo.get_by_id(log_id)
        if not record:
            raise EntityNotFoundException("Maintenance record not found.")
        return record
        
    def list_maintenance(
        self,
        skip: int = 0,
        limit: int = 100,
        vehicle_id: Optional[uuid.UUID] = None,
        status_filter: Optional[MaintenanceStatus] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> Tuple[List[Maintenance], int]:
        """
        Retrieves paginated list of maintenance logs.
        """
        return self.repo.list_maintenance(
            skip=skip,
            limit=limit,
            vehicle_id=vehicle_id,
            status=status_filter,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
    def close_maintenance(self, log_id: uuid.UUID, schema: MaintenanceClose) -> Maintenance:
        """
        Closes an active maintenance log. Automatically transitions the associated vehicle's
        status back to 'Available' (unless it is 'Retired') within a transaction.
        """
        try:
            record = self.repo.get_by_id(log_id)
            if not record:
                raise EntityNotFoundException("Maintenance record not found.")
                
            if record.status == MaintenanceStatus.COMPLETED:
                raise BusinessRuleException("Maintenance record is already closed/completed.")
                
            # Update maintenance details
            record.status = MaintenanceStatus.COMPLETED
            record.end_date = schema.end_date
            
            if schema.cost is not None:
                record.cost = schema.cost
            if schema.description is not None:
                record.description = schema.description
                
            # Validate end_date is not prior to start_date
            if record.end_date < record.start_date:
                raise BusinessRuleException("end_date cannot be earlier than start_date.")
                
            # Update associated vehicle's status
            vehicle = record.vehicle
            if vehicle and vehicle.status != VehicleStatus.RETIRED:
                vehicle.status = VehicleStatus.AVAILABLE
                
            self.repo.update(record)
            self.db.commit()
            self.db.refresh(record)
            return record
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, TransitOpsException):
                raise e
            raise e
