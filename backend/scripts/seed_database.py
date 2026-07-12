"""
Database seeding script for TransitOps.

This script reads vehicles.csv, drivers.csv, maintenance.csv, fuel_logs.csv, and expenses.csv and seeds the database.

Usage:
    python -m backend.scripts.seed_database
"""

import os
import sys
import csv
import datetime
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from backend.database.session import SessionLocal, engine
from backend.database.base import Base
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.models.driver import Driver, DriverStatus
from backend.models.maintenance import Maintenance, MaintenanceStatus
from backend.models.fuel_log import FuelLog
from backend.models.expense import Expense, ExpenseType

# CSV file paths
DATA_DIR = Path(__file__).parent.parent / "data"
VEHICLES_CSV = DATA_DIR / "vehicles.csv"
DRIVERS_CSV = DATA_DIR / "drivers.csv"
MAINTENANCE_CSV = DATA_DIR / "maintenance.csv"
FUEL_LOGS_CSV = DATA_DIR / "fuel_logs.csv"
EXPENSES_CSV = DATA_DIR / "expenses.csv"


def get_db_session() -> Session:
    return SessionLocal()


def create_tables():
    Base.metadata.create_all(bind=engine)


def validate_vehicle(row: dict) -> bool:
    """
    Validates that a row from vehicles.csv contains all required fields and correct formats.
    """
    # Required text fields
    if not row.get("registration_number") or not row["registration_number"].strip():
        return False
    if not row.get("name") or not row["name"].strip():
        return False
    if not row.get("vehicle_type") or not row["vehicle_type"].strip():
        return False
        
    # Required numeric fields
    try:
        max_load = float(row["max_load_capacity"])
        if max_load < 0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    try:
        odo = float(row["odometer"])
        if odo < 0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    try:
        cost = float(row["acquisition_cost"])
        if cost < 0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Optional status validation
    status_str = row.get("status")
    if status_str and status_str.strip():
        try:
            VehicleStatus(status_str.strip())
        except ValueError:
            return False
            
    return True


def seed_vehicles(db: Session):
    """
    Seeds vehicles from vehicles.csv.
    """
    if not VEHICLES_CSV.exists():
        print(f"[ERROR] vehicles.csv not found at {VEHICLES_CSV}")
        return

    total_rows = 0
    inserted = 0
    skipped = 0
    seen_registrations = set()

    with open(VEHICLES_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        
        if not reader.fieldnames:
            print("Total rows: 0")
            print("Inserted: 0")
            print("Skipped: 0")
            return
            
        for row in reader:
            total_rows += 1
            
            # Check validation
            if not validate_vehicle(row):
                skipped += 1
                continue
                
            reg = row["registration_number"].strip()
            
            # Check duplicate in current file or DB
            if reg in seen_registrations:
                skipped += 1
                continue
                
            # Check duplicate in DB
            db_vehicle = db.query(Vehicle).filter(Vehicle.registration_number == reg).first()
            if db_vehicle:
                skipped += 1
                seen_registrations.add(reg)
                continue
                
            seen_registrations.add(reg)
            
            # Map status
            status_val = VehicleStatus.AVAILABLE
            status_str = row.get("status")
            if status_str and status_str.strip():
                status_val = VehicleStatus(status_str.strip())
                
            vehicle = Vehicle(
                registration_number=reg,
                name=row["name"].strip(),
                vehicle_type=row["vehicle_type"].strip(),
                max_load_capacity=float(row["max_load_capacity"]),
                odometer=float(row["odometer"]),
                acquisition_cost=float(row["acquisition_cost"]),
                region=row["region"].strip() if row.get("region") and row["region"].strip() else None,
                status=status_val
            )
            db.add(vehicle)
            inserted += 1

    db.commit()
    print(f"Total rows: {total_rows}")
    print(f"Inserted: {inserted}")
    print(f"Skipped: {skipped}")


def validate_driver(row: dict) -> bool:
    """
    Validates that a row from drivers.csv contains all required fields and correct formats.
    """
    # Required text fields
    if not row.get("name") or not row["name"].strip():
        return False
    if not row.get("license_number") or not row["license_number"].strip():
        return False
    if not row.get("license_category") or not row["license_category"].strip():
        return False
    if not row.get("contact_number") or not row["contact_number"].strip():
        return False
        
    # Required expiry date field
    expiry_str = row.get("license_expiry")
    if not expiry_str or not expiry_str.strip():
        return False
    try:
        datetime.date.fromisoformat(expiry_str.strip())
    except ValueError:
        return False
        
    # Required numeric field (safety_score)
    try:
        score = float(row["safety_score"])
        if score < 0.0 or score > 100.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Optional status validation
    status_str = row.get("status")
    if status_str and status_str.strip():
        try:
            DriverStatus(status_str.strip())
        except ValueError:
            return False
            
    return True


def seed_drivers(db: Session):
    """
    Seeds drivers from drivers.csv.
    """
    if not DRIVERS_CSV.exists():
        print(f"[ERROR] drivers.csv not found at {DRIVERS_CSV}")
        return

    total_rows = 0
    inserted = 0
    skipped = 0
    seen_licenses = set()

    with open(DRIVERS_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        
        if not reader.fieldnames:
            print("Total rows: 0")
            print("Inserted: 0")
            print("Skipped: 0")
            return
            
        for row in reader:
            total_rows += 1
            
            # Validate row
            if not validate_driver(row):
                skipped += 1
                continue
                
            lic = row["license_number"].strip()
            
            # Check duplicate in current file
            if lic in seen_licenses:
                skipped += 1
                continue
                
            # Check duplicate in DB
            db_driver = db.query(Driver).filter(Driver.license_number == lic).first()
            if db_driver:
                skipped += 1
                seen_licenses.add(lic)
                continue
                
            seen_licenses.add(lic)
            
            # Map status
            status_val = DriverStatus.AVAILABLE
            status_str = row.get("status")
            if status_str and status_str.strip():
                status_val = DriverStatus(status_str.strip())
                
            driver = Driver(
                name=row["name"].strip(),
                license_number=lic,
                license_category=row["license_category"].strip(),
                license_expiry=datetime.date.fromisoformat(row["license_expiry"].strip()),
                contact_number=row["contact_number"].strip(),
                safety_score=float(row["safety_score"]),
                status=status_val
            )
            db.add(driver)
            inserted += 1

    db.commit()
    print(f"Total rows: {total_rows}")
    print(f"Inserted: {inserted}")
    print(f"Skipped: {skipped}")


def validate_maintenance(row: dict) -> bool:
    """
    Validates that a row from maintenance.csv contains all required fields and correct formats.
    """
    # Required text fields
    if not row.get("vehicle_registration_number") or not row["vehicle_registration_number"].strip():
        return False
    if not row.get("maintenance_type") or not row["maintenance_type"].strip():
        return False
    if not row.get("issue") or not row["issue"].strip():
        return False
        
    # Required cost field
    try:
        cost = float(row["cost"])
        if cost < 0.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Required start_date field
    start_date_str = row.get("start_date")
    if not start_date_str or not start_date_str.strip():
        return False
    try:
        datetime.date.fromisoformat(start_date_str.strip())
    except ValueError:
        return False
        
    # Optional end_date field
    end_date_str = row.get("end_date")
    if end_date_str and end_date_str.strip():
        try:
            datetime.date.fromisoformat(end_date_str.strip())
        except ValueError:
            return False
            
    # Optional status validation
    status_str = row.get("status")
    if status_str and status_str.strip():
        try:
            MaintenanceStatus(status_str.strip())
        except ValueError:
            return False
            
    return True


def seed_maintenance(db: Session):
    """
    Seeds maintenance logs from maintenance.csv.
    """
    if not MAINTENANCE_CSV.exists():
        print(f"[ERROR] maintenance.csv not found at {MAINTENANCE_CSV}")
        return

    # Build a lookup map of registration_number -> vehicle_id
    vehicles = db.query(Vehicle).all()
    vehicle_map = {v.registration_number: v.id for v in vehicles}

    total_rows = 0
    inserted = 0
    skipped = 0

    with open(MAINTENANCE_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        
        if not reader.fieldnames:
            print("Total rows: 0")
            print("Inserted: 0")
            print("Skipped: 0")
            return
            
        for row in reader:
            total_rows += 1
            
            # Validate row
            if not validate_maintenance(row):
                skipped += 1
                continue
                
            reg = row["vehicle_registration_number"].strip()
            v_id = vehicle_map.get(reg)
            
            # Skip if vehicle reference is invalid
            if not v_id:
                skipped += 1
                continue
                
            # Parse dates
            start_date = datetime.date.fromisoformat(row["start_date"].strip())
            end_date = None
            end_date_str = row.get("end_date")
            if end_date_str and end_date_str.strip():
                end_date = datetime.date.fromisoformat(end_date_str.strip())
                
            # Parse status
            status_val = MaintenanceStatus.ACTIVE
            status_str = row.get("status")
            if status_str and status_str.strip():
                status_val = MaintenanceStatus(status_str.strip())
                
            maintenance = Maintenance(
                vehicle_id=v_id,
                maintenance_type=row["maintenance_type"].strip(),
                issue=row["issue"].strip(),
                description=row["description"].strip() if row.get("description") and row["description"].strip() else None,
                cost=float(row["cost"]),
                status=status_val,
                start_date=start_date,
                end_date=end_date
            )
            db.add(maintenance)
            inserted += 1

    db.commit()
    print(f"Total rows: {total_rows}")
    print(f"Inserted: {inserted}")
    print(f"Skipped: {skipped}")


def validate_fuel_log(row: dict) -> bool:
    """
    Validates that a row from fuel_logs.csv contains all required fields and correct formats.
    """
    # Required text fields
    if not row.get("vehicle_registration_number") or not row["vehicle_registration_number"].strip():
        return False
        
    # Required liters field
    try:
        liters = float(row["liters"])
        if liters <= 0.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Required cost field
    try:
        cost = float(row["cost"])
        if cost < 0.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Required date field
    date_str = row.get("date")
    if not date_str or not date_str.strip():
        return False
    try:
        datetime.date.fromisoformat(date_str.strip())
    except ValueError:
        return False
            
    return True


def seed_fuel_logs(db: Session):
    """
    Seeds fuel logs from fuel_logs.csv.
    """
    if not FUEL_LOGS_CSV.exists():
        print(f"[ERROR] fuel_logs.csv not found at {FUEL_LOGS_CSV}")
        return

    # Build a lookup map of registration_number -> vehicle_id
    vehicles = db.query(Vehicle).all()
    vehicle_map = {v.registration_number: v.id for v in vehicles}

    total_rows = 0
    inserted = 0
    skipped = 0

    with open(FUEL_LOGS_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        
        if not reader.fieldnames:
            print("Total rows: 0")
            print("Inserted: 0")
            print("Skipped: 0")
            return
            
        for row in reader:
            total_rows += 1
            
            # Validate row
            if not validate_fuel_log(row):
                skipped += 1
                continue
                
            reg = row["vehicle_registration_number"].strip()
            v_id = vehicle_map.get(reg)
            
            # Skip if vehicle reference is invalid
            if not v_id:
                skipped += 1
                continue
                
            # Parse date
            log_date = datetime.date.fromisoformat(row["date"].strip())
                
            fuel_log = FuelLog(
                vehicle_id=v_id,
                liters=float(row["liters"]),
                cost=float(row["cost"]),
                date=log_date
            )
            db.add(fuel_log)
            inserted += 1

    db.commit()
    print(f"Total rows: {total_rows}")
    print(f"Inserted: {inserted}")
    print(f"Skipped: {skipped}")


def validate_expense(row: dict) -> bool:
    """
    Validates that a row from expenses.csv contains all required fields and correct formats.
    """
    # Required text fields
    if not row.get("vehicle_registration_number") or not row["vehicle_registration_number"].strip():
        return False
        
    # Required expense_type validation
    expense_type_str = row.get("expense_type")
    if not expense_type_str or not expense_type_str.strip():
        return False
    try:
        ExpenseType(expense_type_str.strip())
    except ValueError:
        return False
        
    # Required amount field
    try:
        amount = float(row["amount"])
        if amount < 0.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Required date field
    date_str = row.get("date")
    if not date_str or not date_str.strip():
        return False
    try:
        datetime.date.fromisoformat(date_str.strip())
    except ValueError:
        return False
            
    return True


def seed_expenses(db: Session):
    """
    Seeds expenses from expenses.csv.
    """
    if not EXPENSES_CSV.exists():
        print(f"[ERROR] expenses.csv not found at {EXPENSES_CSV}")
        return

    # Build a lookup map of registration_number -> vehicle_id
    vehicles = db.query(Vehicle).all()
    vehicle_map = {v.registration_number: v.id for v in vehicles}

    total_rows = 0
    inserted = 0
    skipped = 0

    with open(EXPENSES_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        
        if not reader.fieldnames:
            print("Total rows: 0")
            print("Inserted: 0")
            print("Skipped: 0")
            return
            
        for row in reader:
            total_rows += 1
            
            # Validate row
            if not validate_expense(row):
                skipped += 1
                continue
                
            reg = row["vehicle_registration_number"].strip()
            v_id = vehicle_map.get(reg)
            
            # Skip if vehicle reference is invalid
            if not v_id:
                skipped += 1
                continue
                
            # Parse date
            exp_date = datetime.date.fromisoformat(row["date"].strip())
                
            expense = Expense(
                vehicle_id=v_id,
                expense_type=ExpenseType(row["expense_type"].strip()),
                amount=float(row["amount"]),
                description=row["description"].strip() if row.get("description") and row["description"].strip() else None,
                date=exp_date
            )
            db.add(expense)
            inserted += 1

    db.commit()
    print(f"Total rows: {total_rows}")
    print(f"Inserted: {inserted}")
    print(f"Skipped: {skipped}")


def main():
    create_tables()
    db = get_db_session()
    try:
        print("Seeding Vehicles...")
        seed_vehicles(db)
        print("Seeding Drivers...")
        seed_drivers(db)
        print("Seeding Maintenance Logs...")
        seed_maintenance(db)
        print("Seeding Fuel Logs...")
        seed_fuel_logs(db)
        print("Seeding Expenses...")
        seed_expenses(db)
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
