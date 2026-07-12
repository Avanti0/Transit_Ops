from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
import datetime
from backend.models.expense import Expense, ExpenseType

class ExpenseRepository:
    """
    Repository class handling direct database transactions and queries for the Expense model.
    Encapsulates database access details.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def get_by_id(self, log_id: uuid.UUID) -> Optional[Expense]:
        """
        Retrieves an Expense record by UUID.
        """
        return self.db.query(Expense).filter(Expense.id == str(log_id)).first()
        
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
        Retrieves a list of expenses, supporting pagination, filtering (by vehicle, type, and date range).
        Returns a tuple of (items, total_count).
        """
        query = self.db.query(Expense)
        
        # Filtering
        if vehicle_id:
            query = query.filter(Expense.vehicle_id == str(vehicle_id))
        if expense_type:
            query = query.filter(Expense.expense_type == expense_type)
        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)
            
        total_count = query.count()
        
        # Default sorting by date descending, then created_at descending
        query = query.order_by(Expense.date.desc(), Expense.created_at.desc())
        
        records = query.offset(skip).limit(limit).all()
        return records, total_count
        
    def create(self, record: Expense) -> Expense:
        """
        Saves a new Expense record to the database.
        """
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
