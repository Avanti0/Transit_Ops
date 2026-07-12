from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
import datetime
from backend.repositories.driver import DriverRepository
from backend.models.driver import Driver, DriverStatus
from backend.schemas.driver import DriverCreate, DriverUpdate
from backend.utils.exceptions import EntityNotFoundException, BusinessRuleException

class DriverService:
    """
    Service class executing business logic and orchestrating database transactions
    using the DriverRepository.
    """
    def __init__(self, db: Session):
        self.repo = DriverRepository(db)
        
    def create_driver(self, schema: DriverCreate) -> Driver:
        """
        Registers a new driver. Enforces uniqueness of the license number
        and validates that the driver's license is not already expired.
        """
        # Business Rule 1: License number must be unique.
        existing_driver = self.repo.get_by_license_number(schema.license_number)
        if existing_driver:
            raise BusinessRuleException(
                f"Driver with license number '{schema.license_number}' already exists."
            )
            
        # Business Rule 2: Driver license cannot already be expired while creating.
        if schema.license_expiry < datetime.date.today():
            raise BusinessRuleException(
                "Driver license cannot be expired at registration time."
            )
            
        driver = Driver(**schema.model_dump())
        return self.repo.create(driver)
        
    def get_driver_by_id(self, driver_id: uuid.UUID) -> Driver:
        """
        Retrieves a driver by UUID. Raises 404 if not found.
        """
        driver = self.repo.get_by_id(driver_id)
        if not driver:
            raise EntityNotFoundException("Driver not found.")
        return driver
        
    def list_drivers(
        self,
        skip: int = 0,
        limit: int = 100,
        name: Optional[str] = None,
        status_filter: Optional[DriverStatus] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> Tuple[List[Driver], int]:
        """
        Retrieves paginated drivers with filters and sorting.
        """
        return self.repo.list_drivers(
            skip=skip,
            limit=limit,
            name=name,
            status=status_filter,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
    def update_driver(self, driver_id: uuid.UUID, schema: DriverUpdate) -> Driver:
        """
        Updates an existing driver. Enforces license number uniqueness if it changes.
        """
        driver = self.get_driver_by_id(driver_id)
        update_data = schema.model_dump(exclude_unset=True)
        
        # If license_number is changing, check uniqueness
        if "license_number" in update_data and update_data["license_number"] != driver.license_number:
            existing = self.repo.get_by_license_number(update_data["license_number"])
            if existing:
                raise BusinessRuleException(
                    f"Driver with license number '{update_data['license_number']}' already exists."
                )
                
        for key, value in update_data.items():
            setattr(driver, key, value)
            
        return self.repo.update(driver)
        
    def delete_driver(self, driver_id: uuid.UUID) -> None:
        """
        Deletes a driver record by UUID.
        """
        driver = self.get_driver_by_id(driver_id)
        self.repo.delete(driver)
