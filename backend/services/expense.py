from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
import datetime
from backend.repositories.expense import ExpenseRepository
from backend.models.expense import Expense, ExpenseType
from backend.models.vehicle import Vehicle
from backend.schemas.expense import ExpenseCreate
from backend.utils.exceptions import EntityNotFoundException, BusinessRuleException

class ExpenseService:
    """
    Service class executing business logic and orchestrating database transactions
    for Expenses using the ExpenseRepository.
    """
    def __init__(self, db: Session):
        self.db = db
        self.repo = ExpenseRepository(db)
        
    def create_expense(self, schema: ExpenseCreate) -> Expense:
        """
        Creates a new expense log. Validates that the associated vehicle exists.
        """
        # Validate vehicle exists
        vehicle = self.db.query(Vehicle).filter(Vehicle.id == schema.vehicle_id).first()
        if not vehicle:
            raise EntityNotFoundException(f"Vehicle with id '{schema.vehicle_id}' not found.")
            
        record = Expense(
            vehicle_id=schema.vehicle_id,
            expense_type=schema.expense_type,
            amount=schema.amount,
            description=schema.description,
            date=schema.date
        )
        return self.repo.create(record)
        
    def get_expense_by_id(self, log_id: uuid.UUID) -> Expense:
        """
        Retrieves an expense log record by UUID. Raises 404 if not found.
        """
        record = self.repo.get_by_id(log_id)
        if not record:
            raise EntityNotFoundException("Expense record not found.")
        return record
        
    def list_expenses(
        self,
        skip: int = 0,
        limit: int = 100,
        vehicle_id: Optional[uuid.UUID] = None,
        expense_type: Optional[ExpenseType] = None,
        start_date: Optional[datetime.date] = None,
        end_date: Optional[datetime.date] = None
    ) -> Tuple[List[Expense], int]:
        """
        Retrieves paginated expenses with filters.
        """
        # Validate date range if both are provided
        if start_date and end_date and end_date < start_date:
            raise BusinessRuleException("end_date cannot be earlier than start_date.")
        return self.repo.list_expenses(
            skip=skip,
            limit=limit,
            vehicle_id=vehicle_id,
            expense_type=expense_type,
            start_date=start_date,
            end_date=end_date
        )
