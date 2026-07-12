"""
Database seeding script for TransitOps.

This script seeds the database in a single transaction and is fully idempotent.
It supports seeding selective models via command-line arguments and handles duplication
detection to allow multiple execution runs without corrupting database state.

Seeding Order:
1. Vehicles
2. Drivers
3. Maintenance Logs
4. Fuel Logs
5. Expenses

Usage:
    python backend/scripts/seed_database.py [options]
    or (from backend directory)
    python scripts/seed_database.py [options]
"""

import os
import sys
import csv
import datetime
import argparse
import time
from pathlib import Path
from typing import Tuple

# Add project root to system path for imports
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

# CSV file paths mapping to backend/data/
DATA_DIR = Path(__file__).parent.parent / "data"
VEHICLES_CSV = DATA_DIR / "vehicles.csv"
DRIVERS_CSV = DATA_DIR / "drivers.csv"
MAINTENANCE_CSV = DATA_DIR / "maintenance.csv"
FUEL_LOGS_CSV = DATA_DIR / "fuel_logs.csv"
EXPENSES_CSV = DATA_DIR / "expenses.csv"


def get_db_session() -> Session:
    """
    Establishes and returns a local database session.
    """
    return SessionLocal()


def create_tables():
    """
    Creates the database tables based on SQLAlchemy metadata if they don't already exist.
    """
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables created/verified")


def validate_vehicle(row: dict) -> bool:
    """
    Validates a row from vehicles.csv.
    Required Fields:
        - registration_number: Non-empty string
        - name: Non-empty string
        - vehicle_type: Non-empty string
        - max_load_capacity: Non-negative float
        - odometer: Non-negative float
        - acquisition_cost: Non-negative float
    Optional Fields:
        - status: Must match values in VehicleStatus enum if provided
    """
    # Verify non-empty required text fields
    if not row.get("registration_number") or not row["registration_number"].strip():
        return False
    if not row.get("name") or not row["name"].strip():
        return False
    if not row.get("vehicle_type") or not row["vehicle_type"].strip():
        return False
        
    # Verify required numeric formats and constraints
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
        
    # Validate optional status enum mapping
    status_str = row.get("status")
    if status_str and status_str.strip():
        try:
            VehicleStatus(status_str.strip())
        except ValueError:
            return False
            
    return True


def seed_vehicles(db: Session) -> Tuple[int, int]:
    """
    Seeds vehicle records from vehicles.csv.
    Ensures idempotency by skipping duplicate registration numbers.
    """
    if not VEHICLES_CSV.exists():
        print(f"[ERROR] vehicles.csv not found at: {VEHICLES_CSV}")
        return 0, 0

    inserted = 0
    skipped = 0
    seen_registrations = set()

    with open(VEHICLES_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return 0, 0
            
        for row in reader:
            if not validate_vehicle(row):
                skipped += 1
                continue
                
            reg = row["registration_number"].strip()
            # Skip if we already encountered it in the current CSV
            if reg in seen_registrations:
                skipped += 1
                continue
                
            # Skip if a vehicle with the same registration number already exists in DB
            db_vehicle = db.query(Vehicle).filter(Vehicle.registration_number == reg).first()
            if db_vehicle:
                seen_registrations.add(reg)
                skipped += 1
                continue
                
            seen_registrations.add(reg)
            
            # Default to AVAILABLE if status is missing/invalid
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

    # Flush changes to assign IDs within the session (accessible to subsequent seeders in transaction)
    db.flush()
    return inserted, skipped


def validate_driver(row: dict) -> bool:
    """
    Validates a row from drivers.csv.
    Required Fields:
        - name: Non-empty string
        - license_number: Non-empty string
        - license_category: Non-empty string
        - license_expiry: Date in YYYY-MM-DD ISO format
        - contact_number: Non-empty string
        - safety_score: Float between 0.0 and 100.0 inclusive
    Optional Fields:
        - status: Must match values in DriverStatus enum if provided
    """
    # Verify non-empty required text fields
    if not row.get("name") or not row["name"].strip():
        return False
    if not row.get("license_number") or not row["license_number"].strip():
        return False
    if not row.get("license_category") or not row["license_category"].strip():
        return False
    if not row.get("contact_number") or not row["contact_number"].strip():
        return False
        
    # Verify and parse required date field
    expiry_str = row.get("license_expiry")
    if not expiry_str or not expiry_str.strip():
        return False
    try:
        datetime.date.fromisoformat(expiry_str.strip())
    except ValueError:
        return False
        
    # Verify required safety score range [0.0, 100.0]
    try:
        score = float(row["safety_score"])
        if score < 0.0 or score > 100.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Validate optional status enum mapping
    status_str = row.get("status")
    if status_str and status_str.strip():
        try:
            DriverStatus(status_str.strip())
        except ValueError:
            return False
            
    return True


def seed_drivers(db: Session) -> Tuple[int, int]:
    """
    Seeds driver records from drivers.csv.
    Ensures idempotency by skipping duplicate license numbers.
    """
    if not DRIVERS_CSV.exists():
        print(f"[ERROR] drivers.csv not found at: {DRIVERS_CSV}")
        return 0, 0

    inserted = 0
    skipped = 0
    seen_licenses = set()

    with open(DRIVERS_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return 0, 0
            
        for row in reader:
            if not validate_driver(row):
                skipped += 1
                continue
                
            lic = row["license_number"].strip()
            # Skip if license is already encountered in this CSV run
            if lic in seen_licenses:
                skipped += 1
                continue
                
            # Skip if driver already exists in the database
            db_driver = db.query(Driver).filter(Driver.license_number == lic).first()
            if db_driver:
                seen_licenses.add(lic)
                skipped += 1
                continue
                
            seen_licenses.add(lic)
            
            # Default to AVAILABLE if status is missing/invalid
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

    # Flush changes to assign IDs within the session
    db.flush()
    return inserted, skipped


def validate_maintenance(row: dict) -> bool:
    """
    Validates a row from maintenance.csv.
    Required Fields:
        - vehicle_registration_number: Non-empty string
        - maintenance_type: Non-empty string
        - issue: Non-empty string
        - cost: Non-negative float
        - start_date: Date in YYYY-MM-DD ISO format
    Optional Fields:
        - end_date: Date in YYYY-MM-DD ISO format if provided
        - status: Must match values in MaintenanceStatus enum if provided
    """
    # Verify non-empty required text fields
    if not row.get("vehicle_registration_number") or not row["vehicle_registration_number"].strip():
        return False
    if not row.get("maintenance_type") or not row["maintenance_type"].strip():
        return False
    if not row.get("issue") or not row["issue"].strip():
        return False
        
    # Verify non-negative cost format
    try:
        cost = float(row["cost"])
        if cost < 0.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Verify and parse start date
    start_date_str = row.get("start_date")
    if not start_date_str or not start_date_str.strip():
        return False
    try:
        datetime.date.fromisoformat(start_date_str.strip())
    except ValueError:
        return False
        
    # Verify optional end date format
    end_date_str = row.get("end_date")
    if end_date_str and end_date_str.strip():
        try:
            datetime.date.fromisoformat(end_date_str.strip())
        except ValueError:
            return False
            
    # Validate optional status enum mapping
    status_str = row.get("status")
    if status_str and status_str.strip():
        try:
            MaintenanceStatus(status_str.strip())
        except ValueError:
            return False
            
    return True


def seed_maintenance(db: Session) -> Tuple[int, int]:
    """
    Seeds maintenance logs from maintenance.csv.
    Resolves vehicle references by registration number.
    Ensures idempotency by checking for duplicates based on vehicle, type, issue, and start date.
    """
    if not MAINTENANCE_CSV.exists():
        print(f"[ERROR] maintenance.csv not found at: {MAINTENANCE_CSV}")
        return 0, 0

    # Build registry lookup mapping of registration_number -> vehicle_id
    vehicles = db.query(Vehicle).all()
    vehicle_map = {v.registration_number: v.id for v in vehicles}

    inserted = 0
    skipped = 0

    with open(MAINTENANCE_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return 0, 0
            
        for row in reader:
            if not validate_maintenance(row):
                skipped += 1
                continue
                
            reg = row["vehicle_registration_number"].strip()
            v_id = vehicle_map.get(reg)
            # Skip if associated vehicle registration is invalid/non-existent
            if not v_id:
                skipped += 1
                continue
                
            start_date = datetime.date.fromisoformat(row["start_date"].strip())
            
            # Check for existing duplicate maintenance record in database (idempotency check)
            db_maint = db.query(Maintenance).filter(
                Maintenance.vehicle_id == v_id,
                Maintenance.maintenance_type == row["maintenance_type"].strip(),
                Maintenance.issue == row["issue"].strip(),
                Maintenance.start_date == start_date
            ).first()
            if db_maint:
                skipped += 1
                continue
                
            end_date = None
            end_date_str = row.get("end_date")
            if end_date_str and end_date_str.strip():
                end_date = datetime.date.fromisoformat(end_date_str.strip())
                
            # Default to ACTIVE if status is missing/invalid
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

    # Flush changes to assign IDs within the session
    db.flush()
    return inserted, skipped


def validate_fuel_log(row: dict) -> bool:
    """
    Validates a row from fuel_logs.csv.
    Required Fields:
        - vehicle_registration_number: Non-empty string
        - liters: Positive float
        - cost: Non-negative float
        - date: Date in YYYY-MM-DD ISO format
    """
    # Verify non-empty required text fields
    if not row.get("vehicle_registration_number") or not row["vehicle_registration_number"].strip():
        return False
        
    # Verify strictly positive liters format
    try:
        liters = float(row["liters"])
        if liters <= 0.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Verify non-negative cost format
    try:
        cost = float(row["cost"])
        if cost < 0.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Verify and parse date format
    date_str = row.get("date")
    if not date_str or not date_str.strip():
        return False
    try:
        datetime.date.fromisoformat(date_str.strip())
    except ValueError:
        return False
            
    return True


def seed_fuel_logs(db: Session) -> Tuple[int, int]:
    """
    Seeds fuel logs from fuel_logs.csv.
    Resolves vehicle references by registration number.
    Ensures idempotency by checking for duplicates based on vehicle, date, liters, and cost.
    """
    if not FUEL_LOGS_CSV.exists():
        print(f"[ERROR] fuel_logs.csv not found at: {FUEL_LOGS_CSV}")
        return 0, 0

    # Build registry lookup mapping of registration_number -> vehicle_id
    vehicles = db.query(Vehicle).all()
    vehicle_map = {v.registration_number: v.id for v in vehicles}

    inserted = 0
    skipped = 0

    with open(FUEL_LOGS_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return 0, 0
            
        for row in reader:
            if not validate_fuel_log(row):
                skipped += 1
                continue
                
            reg = row["vehicle_registration_number"].strip()
            v_id = vehicle_map.get(reg)
            # Skip if associated vehicle registration is invalid/non-existent
            if not v_id:
                skipped += 1
                continue
                
            log_date = datetime.date.fromisoformat(row["date"].strip())
            
            # Check for existing identical fuel log in database (idempotency check)
            db_fuel = db.query(FuelLog).filter(
                FuelLog.vehicle_id == v_id,
                FuelLog.date == log_date,
                FuelLog.liters == float(row["liters"]),
                FuelLog.cost == float(row["cost"])
            ).first()
            if db_fuel:
                skipped += 1
                continue
                
            fuel_log = FuelLog(
                vehicle_id=v_id,
                liters=float(row["liters"]),
                cost=float(row["cost"]),
                date=log_date
            )
            db.add(fuel_log)
            inserted += 1

    # Flush changes to assign IDs within the session
    db.flush()
    return inserted, skipped


def validate_expense(row: dict) -> bool:
    """
    Validates a row from expenses.csv.
    Required Fields:
        - vehicle_registration_number: Non-empty string
        - expense_type: Must match values in ExpenseType enum
        - amount: Non-negative float
        - date: Date in YYYY-MM-DD ISO format
    """
    # Verify non-empty required text fields
    if not row.get("vehicle_registration_number") or not row["vehicle_registration_number"].strip():
        return False
        
    # Validate expense_type enum mapping
    expense_type_str = row.get("expense_type")
    if not expense_type_str or not expense_type_str.strip():
        return False
    try:
        ExpenseType(expense_type_str.strip())
    except ValueError:
        return False
        
    # Verify non-negative amount format
    try:
        amount = float(row["amount"])
        if amount < 0.0:
            return False
    except (ValueError, TypeError, KeyError):
        return False
        
    # Verify and parse date format
    date_str = row.get("date")
    if not date_str or not date_str.strip():
        return False
    try:
        datetime.date.fromisoformat(date_str.strip())
    except ValueError:
        return False
            
    return True


def seed_expenses(db: Session) -> Tuple[int, int]:
    """
    Seeds expense records from expenses.csv.
    Resolves vehicle references by registration number.
    Ensures idempotency by checking for duplicates based on vehicle, date, type, and amount.
    """
    if not EXPENSES_CSV.exists():
        print(f"[ERROR] expenses.csv not found at: {EXPENSES_CSV}")
        return 0, 0

    # Build registry lookup mapping of registration_number -> vehicle_id
    vehicles = db.query(Vehicle).all()
    vehicle_map = {v.registration_number: v.id for v in vehicles}

    inserted = 0
    skipped = 0

    with open(EXPENSES_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return 0, 0
            
        for row in reader:
            if not validate_expense(row):
                skipped += 1
                continue
                
            reg = row["vehicle_registration_number"].strip()
            v_id = vehicle_map.get(reg)
            # Skip if associated vehicle registration is invalid/non-existent
            if not v_id:
                skipped += 1
                continue
                
            exp_date = datetime.date.fromisoformat(row["date"].strip())
            
            # Check for existing identical expense in database (idempotency check)
            db_exp = db.query(Expense).filter(
                Expense.vehicle_id == v_id,
                Expense.date == exp_date,
                Expense.expense_type == ExpenseType(row["expense_type"].strip()),
                Expense.amount == float(row["amount"])
            ).first()
            if db_exp:
                skipped += 1
                continue
                
            expense = Expense(
                vehicle_id=v_id,
                expense_type=ExpenseType(row["expense_type"].strip()),
                amount=float(row["amount"]),
                description=row["description"].strip() if row.get("description") and row["description"].strip() else None,
                date=exp_date
            )
            db.add(expense)
            inserted += 1

    # Flush changes to assign IDs within the session
    db.flush()
    return inserted, skipped


def main():
    """
    Command Line Interface entry point.
    Parses arguments, manages db session, executes transactions, and prints execution times/reports.
    """
    parser = argparse.ArgumentParser(description="TransitOps Database Seeding Command Line Interface")
    parser.add_argument("--vehicles", action="store_true", help="Seed vehicles table")
    parser.add_argument("--drivers", action="store_true", help="Seed drivers table")
    parser.add_argument("--maintenance", action="store_true", help="Seed maintenance table")
    parser.add_argument("--fuel", action="store_true", help="Seed fuel logs table")
    parser.add_argument("--expenses", action="store_true", help="Seed expenses table")
    parser.add_argument("--all", action="store_true", help="Seed all tables (default if no flag is specified)")
    
    args = parser.parse_args()
    
    # Run all modules if --all is explicitly provided, or if no individual flags are set
    run_all = args.all or not (args.vehicles or args.drivers or args.maintenance or args.fuel or args.expenses)
    
    # Verify tables are initialized
    create_tables()
    
    db = get_db_session()
    start_time = time.time()
    
    try:
        # Default seeding counts
        v_ins, v_skip = 0, 0
        d_ins, d_skip = 0, 0
        m_ins, m_skip = 0, 0
        f_ins, f_skip = 0, 0
        e_ins, e_skip = 0, 0
        
        # Execute seeders in transaction based on active flags
        if run_all or args.vehicles:
            print("[INFO] Seeding Vehicles...")
            v_ins, v_skip = seed_vehicles(db)
            
        if run_all or args.drivers:
            print("[INFO] Seeding Drivers...")
            d_ins, d_skip = seed_drivers(db)
            
        if run_all or args.maintenance:
            print("[INFO] Seeding Maintenance logs...")
            m_ins, m_skip = seed_maintenance(db)
            
        if run_all or args.fuel:
            print("[INFO] Seeding Fuel Logs...")
            f_ins, f_skip = seed_fuel_logs(db)
            
        if run_all or args.expenses:
            print("[INFO] Seeding Expenses...")
            e_ins, e_skip = seed_expenses(db)
            
        # Commit transactional changes only after all selected runs succeed
        db.commit()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Display execution output summary reports
        print("\n" + "=" * 50)
        print("TransitOps Seeding Execution Summary")
        print("=" * 50)
        if run_all or args.vehicles:
            print(f"Vehicles: {v_ins} inserted, {v_skip} skipped")
        if run_all or args.drivers:
            print(f"Drivers: {d_ins} inserted, {d_skip} skipped")
        if run_all or args.maintenance:
            print(f"Maintenance: {m_ins} inserted, {m_skip} skipped")
        if run_all or args.fuel:
            print(f"Fuel Logs: {f_ins} inserted, {f_skip} skipped")
        if run_all or args.expenses:
            print(f"Expenses: {e_ins} inserted, {e_skip} skipped")
        print("-" * 50)
        print(f"Seeding completed successfully in {duration:.2f} seconds.")
        print("=" * 50)
        
    except Exception as e:
        # Roll back all changes if any single seeder fails during execution
        db.rollback()
        print(f"\n[ERROR] Seeding transaction aborted due to error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
