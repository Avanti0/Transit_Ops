"""
Database seeding script for TransitOps.

This script reads CSV files from backend/data/ and populates the database
with initial demo data for roles, users, vehicles, drivers, trips, maintenance logs,
fuel logs, and expenses.

Usage:
    python -m backend.scripts.seed_database
"""
import sys
import csv
import datetime
from pathlib import Path
from datetime import date, timedelta

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

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
    Trip,
    TripStatus,
    User,
    Role,
)
from backend.utils.auth import hash_password

# CSV file paths
DATA_DIR = Path(__file__).parent.parent / "data"
VEHICLES_CSV = DATA_DIR / "vehicle_dataset.csv"
DRIVERS_CSV = DATA_DIR / "drivers_dataset.csv"
MAINTENANCE_CSV = DATA_DIR / "Maintanence_dataset.csv"
FUEL_LOGS_CSV = DATA_DIR / "FuelLog_Dataset.csv"
EXPENSES_CSV = DATA_DIR / "Expenses_dataset.csv"
TRIPS_CSV = DATA_DIR / "Trips_dataset.csv"
USERS_CSV = DATA_DIR / "Users_dataset.csv"

try:
    # Skip if already seeded
    if db.query(Vehicle).count() > 5:
        print("Database already seeded. Skipping.")
        sys.exit(0)

    # ── Vehicles ──────────────────────────────────────────────────────────────
    vehicles_data = [
        ("TN01AB1234", "Tata Ace",       "Van",   800,   12000, 450000,  "North"),
        ("TN02CD5678", "Ashok Leyland",  "Truck", 5000,  45000, 1800000, "South"),
        ("TN03EF9012", "Mahindra Bolero","Van",   1200,  8500,  650000,  "East"),
        ("TN04GH3456", "Eicher Pro",     "Truck", 7500,  62000, 2200000, "West"),
        ("TN05IJ7890", "Force Traveller","Bus",   2000,  31000, 950000,  "North"),
        ("TN06KL2345", "Tata 407",       "Truck", 4000,  28000, 1200000, "South"),
        ("TN07MN6789", "Maruti Omni",    "Van",   500,   15000, 320000,  "East"),
        ("TN08OP1234", "Swaraj Mazda",   "Bus",   3000,  52000, 1500000, "West"),
        ("TN09QR5678", "Tata Prima",     "Truck", 10000, 78000, 3500000, "North"),
        ("TN10ST9012", "Bajaj Maxima",   "Van",   600,   9000,  280000,  "South"),
    ]
    v_statuses = [
        VehicleStatus.AVAILABLE, VehicleStatus.AVAILABLE, VehicleStatus.AVAILABLE,
        VehicleStatus.AVAILABLE, VehicleStatus.AVAILABLE, VehicleStatus.AVAILABLE,
        VehicleStatus.AVAILABLE, VehicleStatus.IN_SHOP, VehicleStatus.ON_TRIP,
        VehicleStatus.RETIRED,
    ]
    vehicles = []
    for i, (reg, name, vtype, cap, odo, cost, region) in enumerate(vehicles_data):
        if db.query(Vehicle).filter(Vehicle.registration_number == reg).first():
            continue
        v = Vehicle(
            registration_number=reg,
            name=name,
            vehicle_type=vtype,
            max_load_capacity=cap,
            odometer=odo,
            acquisition_cost=cost,
            region=region,
            status=v_statuses[i],
        )
        db.add(v)
        db.flush()
        vehicles.append(v)

    # ── Drivers ───────────────────────────────────────────────────────────────
    drivers_data = [
        ("Ravi Kumar",   "DL-MH-001", "LMV", "2028-06-15", "9876543210", 92),
        ("Suresh Patel", "DL-GJ-002", "HMV", "2027-03-20", "9765432109", 88),
        ("Amit Singh",   "DL-UP-003", "LMV", "2029-11-10", "9654321098", 95),
        ("Vijay Sharma", "DL-RJ-004", "HMV", "2026-08-05", "9543210987", 79),
        ("Deepak Yadav", "DL-MP-005", "LMV", "2028-01-25", "9432109876", 85),
        ("Manoj Tiwari", "DL-BR-006", "HMV", "2027-09-30", "9321098765", 91),
        ("Sanjay Gupta", "DL-DL-007", "LMV", "2030-04-12", "9210987654", 87),
        ("Prakash Nair", "DL-KL-008", "HMV", "2025-12-01", "9109876543", 73),
        ("Anand Reddy",  "DL-AP-009", "LMV", "2029-07-18", "9098765432", 94),
        ("Kiran Joshi",  "DL-MH-010", "HMV", "2028-02-28", "9987654321", 89),
    ]
    d_statuses = [
        DriverStatus.AVAILABLE, DriverStatus.AVAILABLE, DriverStatus.AVAILABLE,
        DriverStatus.AVAILABLE, DriverStatus.AVAILABLE, DriverStatus.AVAILABLE,
        DriverStatus.AVAILABLE, DriverStatus.ON_TRIP, DriverStatus.OFF_DUTY,
        DriverStatus.SUSPENDED,
    ]
    drivers = []
    for i, (name, lic, cat, expiry, phone, score) in enumerate(drivers_data):
        if db.query(Driver).filter(Driver.license_number == lic).first():
            continue
        d = Driver(
            name=name,
            license_number=lic,
            license_category=cat,
            license_expiry=date.fromisoformat(expiry),
            contact_number=phone,
            safety_score=score,
            status=d_statuses[i],
        )
        db.add(d)
        db.flush()
        drivers.append(d)

def create_tables():
    """
    Creates all database tables defined in the models.
    This is safe to call multiple times — existing tables are not recreated.
    """
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables created/verified")

    # ── Trips ─────────────────────────────────────────────────────────────────
    routes = [
        ("Mumbai",     "Pune",         150),
        ("Delhi",      "Agra",         200),
        ("Chennai",    "Bangalore",    350),
        ("Hyderabad",  "Vijayawada",   275),
        ("Kolkata",    "Bhubaneswar",  440),
    ]
    trips = []
    for i, (src, dst, dist) in enumerate(routes):
        if i >= len(avail_vehicles) or i >= len(avail_drivers):
            break
        t = Trip(
            vehicle_id=avail_vehicles[i].id,
            driver_id=avail_drivers[i].id,
            source=src,
            destination=dst,
            cargo_weight=random.randint(200, 800),
            planned_distance=dist,
            actual_distance=dist + random.randint(-10, 20),
            fuel_consumed=round(dist / 8.5, 1),
            revenue=round(dist * 45, 2),
            status=TripStatus.COMPLETED,
        )
        db.add(t)
        db.flush()
        trips.append(t)

def clear_existing_data(db: Session):
    """
    Deletes all existing data in reverse dependency order to avoid foreign key violations.
    """
    print("Clearing existing database tables...")
    try:
        db.query(Expense).delete()
        db.query(FuelLog).delete()
        db.query(Maintenance).delete()
        db.query(Trip).delete()
        db.query(Driver).delete()
        db.query(Vehicle).delete()
        db.query(User).delete()
        db.commit()
        print("[OK] Database cleared successfully.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to clear database: {e}")
        raise


def seed_roles(db: Session) -> dict:
    """
    Ensures that the required roles are seeded in the database.
    Returns a mapping of role_name to role_id.
    """
    print("Seeding roles...")
    required_roles = ["Fleet Manager", "Safety Officer", "Financial Analyst", "Driver/Dispatcher"]
    roles_map = {}
    
    for role_name in required_roles:
        role = db.query(Role).filter(Role.role_name == role_name).first()
        if not role:
            role = Role(role_name=role_name)
            db.add(role)
            db.flush()  # to populate the ID
        roles_map[role_name] = role.id
        
    db.commit()
    print(f"[OK] Seeded/verified {len(roles_map)} roles.")
    return roles_map

    # ── Maintenance ───────────────────────────────────────────────────────────
    maint_data = [
        ("Oil Change",     "Routine",    2500,  "2026-05-01", "2026-05-02", MaintenanceStatus.COMPLETED),
        ("Brake Repair",   "Corrective", 8500,  "2026-05-10", "2026-05-12", MaintenanceStatus.COMPLETED),
        ("Tyre Rotation",  "Routine",    1200,  "2026-06-01", "2026-06-01", MaintenanceStatus.COMPLETED),
        ("Engine Overhaul","Major",      45000, "2026-06-15", None,         MaintenanceStatus.ACTIVE),
        ("AC Repair",      "Corrective", 6000,  "2026-07-01", None,         MaintenanceStatus.ACTIVE),
    ]
    for i, (issue, mtype, cost, start, end, status) in enumerate(maint_data):
        v = vehicles[i % len(vehicles)]
        m = Maintenance(
            vehicle_id=v.id,
            issue=issue,
            maintenance_type=mtype,
            cost=cost,
            start_date=date.fromisoformat(start),
            end_date=date.fromisoformat(end) if end else None,
            status=status,
        )
        db.add(m)
        db.flush()

def seed_users(db: Session, roles_map: dict):
    """
    Seeds default/demo users and users from Users_dataset.csv.
    """
    print("Seeding users...")
    
    # 1. Seed the default login card users
    demo_users = [
        {"name": "Admin User", "email": "admin@transitops.com", "password": "admin123", "role": "Fleet Manager"},
        {"name": "Ravi Kumar", "email": "driver@transitops.com", "password": "driver123", "role": "Driver/Dispatcher"},
        {"name": "Safety Officer", "email": "safety@transitops.com", "password": "safety123", "role": "Safety Officer"},
        {"name": "Finance Analyst", "email": "finance@transitops.com", "password": "finance123", "role": "Financial Analyst"},
    ]
    
    for du in demo_users:
        role_id = roles_map.get(du["role"])
        if role_id:
            user = User(
                name=du["name"],
                email=du["email"],
                password_hash=hash_password(du["password"]),
                role_id=role_id
            )
            db.add(user)
            
    # 2. Seed users from Users_dataset.csv
    if USERS_CSV.exists():
        with open(USERS_CSV, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                role_id = roles_map.get(row["role"])
                if role_id:
                    # Skip if email already added in demo_users
                    if any(du["email"] == row["email"] for du in demo_users):
                        continue
                    user = User(
                        name=row["name"],
                        email=row["email"],
                        password_hash=hash_password("password123"),  # default password
                        role_id=role_id
                    )
                    db.add(user)
        print("[OK] Users seeded from dataset.")
    else:
        print("[WARNING] Users dataset file not found. Skipping dataset user seeding.")
        
    db.commit()
    print("[OK] Users seeding completed.")

    db.commit()
    print("✓ Database seeded successfully!")
    print(f"  Vehicles: {len(vehicles)}, Drivers: {len(drivers)}, Trips: {len(trips)}")

def seed_vehicles(db: Session) -> dict:
    """
    Seeds vehicles from vehicle_dataset.csv.
    Returns a mapping of registration_number to vehicle_id.
    """
    print("Seeding vehicles...")
    vehicle_map = {}
    
    if not VEHICLES_CSV.exists():
        print(f"[ERROR] Vehicle dataset file not found at: {VEHICLES_CSV}")
        return vehicle_map
        
    with open(VEHICLES_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            vehicle = Vehicle(
                registration_number=row["registration_number"],
                name=row["vehicle_name"],
                vehicle_type=row["vehicle_type"],
                max_load_capacity=float(row["max_capacity"]),
                odometer=float(row["odometer"]),
                acquisition_cost=float(row["acquisition_cost"]),
                region=row["region"] if row["region"] else None,
                status=VehicleStatus(row["status"]),
            )
            db.add(vehicle)
            db.flush()  # to get vehicle.id populated
            vehicle_map[vehicle.registration_number] = vehicle.id
            
    db.commit()
    print(f"[OK] Seeded {len(vehicle_map)} vehicles.")
    return vehicle_map


def seed_drivers(db: Session) -> dict:
    """
    Seeds drivers from drivers_dataset.csv.
    Returns a mapping of driver_name to driver_id.
    """
    print("Seeding drivers...")
    driver_map = {}
    
    if not DRIVERS_CSV.exists():
        print(f"[ERROR] Driver dataset file not found at: {DRIVERS_CSV}")
        return driver_map
        
    with open(DRIVERS_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            driver = Driver(
                name=row["name"],
                license_number=row["license_number"],
                license_category=row["license_category"],
                license_expiry=datetime.date.fromisoformat(row["license_expiry"]),
                contact_number=row["contact_number"],
                safety_score=float(row["safety_score"]),
                status=DriverStatus(row["status"]),
            )
            db.add(driver)
            db.flush()  # to get driver.id populated
            driver_map[driver.name] = driver.id
            
    db.commit()
    print(f"[OK] Seeded {len(driver_map)} drivers.")
    return driver_map


def seed_trips(db: Session, vehicle_map: dict, driver_map: dict):
    """
    Seeds trips from Trips_dataset.csv.
    """
    print("Seeding trips...")
    if not TRIPS_CSV.exists():
        print(f"[ERROR] Trips dataset file not found at: {TRIPS_CSV}")
        return
        
    count = 0
    with open(TRIPS_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            v_id = vehicle_map.get(row["vehicle_registration_number"])
            d_id = driver_map.get(row["driver_name"])
            
            if not v_id or not d_id:
                # Skip if vehicle or driver lookup fails
                continue
                
            actual_distance = float(row["actual_distance"]) if row["actual_distance"] else None
            fuel_consumed = float(row["fuel_used"]) if row["fuel_used"] else None
            
            created_at_date = datetime.date.fromisoformat(row["date"])
            created_at = datetime.datetime.combine(created_at_date, datetime.time(9, 0))
            
            completed_at = None
            if row["status"] == "Completed":
                completed_at = datetime.datetime.combine(created_at_date, datetime.time(18, 0))
                
            trip = Trip(
                vehicle_id=v_id,
                driver_id=d_id,
                source=row["source_city"],
                destination=row["destination_city"],
                cargo_weight=float(row["cargo_weight"]),
                planned_distance=float(row["planned_distance"]),
                actual_distance=actual_distance,
                fuel_consumed=fuel_consumed,
                revenue=float(row["revenue"]) if row["revenue"] else 0.0,
                status=TripStatus(row["status"]),
                created_at=created_at,
                completed_at=completed_at,
            )
            db.add(trip)
            count += 1
            
    db.commit()
    print(f"[OK] Seeded {count} trips.")


def seed_maintenance(db: Session, vehicle_map: dict):
    """
    Seeds maintenance logs from Maintanence_dataset.csv.
    """
    print("Seeding maintenance logs...")
    if not MAINTENANCE_CSV.exists():
        print(f"[ERROR] Maintenance dataset file not found at: {MAINTENANCE_CSV}")
        return
        
    count = 0
    with open(MAINTENANCE_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            v_id = vehicle_map.get(row["vehicle_registration_number"])
            if not v_id:
                continue
                
            start_date = datetime.date.fromisoformat(row["start_date"])
            end_date = datetime.date.fromisoformat(row["end_date"]) if row["end_date"] else None
            
            maintenance = Maintenance(
                vehicle_id=v_id,
                maintenance_type=row["maintenance_type"],
                issue=row["issue"],
                description=row["description"] if row["description"] else None,
                cost=float(row["cost"]),
                status=MaintenanceStatus(row["status"]),
                start_date=start_date,
                end_date=end_date,
            )
            db.add(maintenance)
            count += 1
            
    db.commit()
    print(f"[OK] Seeded {count} maintenance records.")


def seed_fuel_logs(db: Session, vehicle_map: dict):
    """
    Seeds fuel logs from FuelLog_Dataset.csv.
    """
    print("Seeding fuel logs...")
    if not FUEL_LOGS_CSV.exists():
        print(f"[ERROR] Fuel logs dataset file not found at: {FUEL_LOGS_CSV}")
        return
        
    count = 0
    with open(FUEL_LOGS_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            v_id = vehicle_map.get(row["vehicle_registration_number"])
            if not v_id:
                continue
                
            fuel_log = FuelLog(
                vehicle_id=v_id,
                liters=float(row["liters"]),
                cost=float(row["cost"]),
                date=datetime.date.fromisoformat(row["date"]),
            )
            db.add(fuel_log)
            count += 1
            
    db.commit()
    print(f"[OK] Seeded {count} fuel logs.")


def seed_expenses(db: Session, vehicle_map: dict):
    """
    Seeds expenses from Expenses_dataset.csv.
    """
    print("Seeding expenses...")
    if not EXPENSES_CSV.exists():
        print(f"[ERROR] Expenses dataset file not found at: {EXPENSES_CSV}")
        return
        
    count = 0
    with open(EXPENSES_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            v_id = vehicle_map.get(row["vehicle_registration_number"])
            if not v_id:
                continue
                
            expense = Expense(
                vehicle_id=v_id,
                expense_type=ExpenseType(row["expense_type"]),
                amount=float(row["amount"]),
                description=row["description"] if row["description"] else None,
                date=datetime.date.fromisoformat(row["date"]),
            )
            db.add(expense)
            count += 1
            
    db.commit()
    print(f"[OK] Seeded {count} expenses.")


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
        
        # Clear any old data
        clear_existing_data(db)
        
        # Seed everything sequentially
        roles_map = seed_roles(db)
        seed_users(db, roles_map)
        vehicle_map = seed_vehicles(db)
        driver_map = seed_drivers(db)
        
        # Dependent seedings
        seed_trips(db, vehicle_map, driver_map)
        seed_maintenance(db, vehicle_map)
        seed_fuel_logs(db, vehicle_map)
        seed_expenses(db, vehicle_map)
        
        print("\n[OK] Database seeding completed successfully!")
        
    except Exception as e:
        print(f"\n[ERROR] Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        print("Database session closed")


if __name__ == "__main__":
    main()
