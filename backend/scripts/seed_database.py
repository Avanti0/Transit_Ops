"""
Database seeding script for TransitOps.

This script reads CSV files from backend/data/ and populates the database
with initial demo data for vehicles, drivers, maintenance logs, fuel logs,
and expenses.

Usage:
    python -m backend.scripts.seed_database
"""

import os
import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from backend.database.session import SessionLocal, engine
from backend.database.base import Base
from backend.models import (
    Vehicle,
    VehicleStatus,
    Driver,
    DriverStatus,
    Maintenance,
    MaintenanceStatus,
    FuelLog,
    Expense,
    ExpenseType,
)

# CSV file paths
DATA_DIR = Path(__file__).parent.parent / "data"
VEHICLES_CSV = DATA_DIR / "vehicles.csv"
DRIVERS_CSV = DATA_DIR / "drivers.csv"
MAINTENANCE_CSV = DATA_DIR / "maintenance.csv"
FUEL_LOGS_CSV = DATA_DIR / "fuel_logs.csv"
EXPENSES_CSV = DATA_DIR / "expenses.csv"


def get_db_session() -> Session:
    """
    Returns a database session for seeding operations.
    """
    return SessionLocal()


def create_tables():
    """
    Creates all database tables defined in the models.
    This is safe to call multiple times — existing tables are not recreated.
    """
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created/verified")


def seed_vehicles(db: Session):
    """
    Seeds vehicles from vehicles.csv.
    
    TODO: Implement CSV parsing and Vehicle model insertion.
    """
    pass


def seed_drivers(db: Session):
    """
    Seeds drivers from drivers.csv.
    
    TODO: Implement CSV parsing and Driver model insertion.
    """
    pass


def seed_maintenance(db: Session):
    """
    Seeds maintenance logs from maintenance.csv.
    
    TODO: Implement CSV parsing and Maintenance model insertion.
    """
    pass


def seed_fuel_logs(db: Session):
    """
    Seeds fuel logs from fuel_logs.csv.
    
    TODO: Implement CSV parsing and FuelLog model insertion.
    """
    pass


def seed_expenses(db: Session):
    """
    Seeds expenses from expenses.csv.
    
    TODO: Implement CSV parsing and Expense model insertion.
    """
    pass


def main():
    """
    Main entry point for the seeding script.
    """
    print("=" * 60)
    print("TransitOps Database Seeding Script")
    print("=" * 60)
    
    # Ensure tables exist
    create_tables()
    
    # Get database session
    db = get_db_session()
    
    try:
        print("\n[INFO] Database session established")
        print("[INFO] Ready to seed data (no seeding logic implemented yet)")
        
        # TODO: Uncomment when seeding functions are implemented
        # seed_vehicles(db)
        # seed_drivers(db)
        # seed_maintenance(db)
        # seed_fuel_logs(db)
        # seed_expenses(db)
        
        # db.commit()
        print("\n✓ Seeding structure is ready")
        
    except Exception as e:
        print(f"\n✗ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        print("Database session closed")


if __name__ == "__main__":
    main()
