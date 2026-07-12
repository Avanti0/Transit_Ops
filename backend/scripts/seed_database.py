"""
Database seeding script for TransitOps.

This script reads vehicles.csv and seeds the vehicles table.

Usage:
    python -m backend.scripts.seed_database
"""

import os
import sys
import csv
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from backend.database.session import SessionLocal, engine
from backend.database.base import Base
from backend.models.vehicle import Vehicle, VehicleStatus

# CSV file paths
DATA_DIR = Path(__file__).parent.parent / "data"
VEHICLES_CSV = DATA_DIR / "vehicles.csv"


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
        # Use DictReader to parse headers
        reader = csv.DictReader(f)
        
        # If headers are missing or reader has no fieldnames, handle empty/corrupt files gracefully
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


def main():
    create_tables()
    db = get_db_session()
    try:
        seed_vehicles(db)
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
