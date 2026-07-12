"""
Database seeding script for TransitOps.
Usage: python -m backend.scripts.seed_database
"""
import sys
import random
from pathlib import Path
from datetime import date, timedelta

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.database.session import SessionLocal, engine
from backend.database.base import Base
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.models.driver import Driver, DriverStatus
from backend.models.trip import Trip, TripStatus
from backend.models.maintenance import Maintenance, MaintenanceStatus
from backend.models.fuel_log import FuelLog
from backend.models.expense import Expense

Base.metadata.create_all(bind=engine)
db = SessionLocal()

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

    avail_vehicles = [v for v in vehicles if v.status == VehicleStatus.AVAILABLE]
    avail_drivers  = [d for d in drivers  if d.status == DriverStatus.AVAILABLE]

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

    # 2 pending (Draft) trips
    for i in range(5, min(7, len(avail_vehicles))):
        if i >= len(avail_drivers):
            break
        t = Trip(
            vehicle_id=avail_vehicles[i].id,
            driver_id=avail_drivers[i].id,
            source="Surat",
            destination="Ahmedabad",
            cargo_weight=300,
            planned_distance=265,
            revenue=0,
            status=TripStatus.DRAFT,
        )
        db.add(t)
        db.flush()
        trips.append(t)

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

    # ── Fuel Logs ─────────────────────────────────────────────────────────────
    for i, t in enumerate(trips[:5]):
        fl = FuelLog(
            vehicle_id=t.vehicle_id,
            liters=t.fuel_consumed or 40,
            cost=round((t.fuel_consumed or 40) * 92.5, 2),
            date=date(2026, 6, 1) + timedelta(days=i * 5),
        )
        db.add(fl)
        db.flush()

    for i, v in enumerate(vehicles[:5]):
        fl = FuelLog(
            vehicle_id=v.id,
            liters=round(random.uniform(30, 80), 1),
            cost=round(random.uniform(2800, 7400), 2),
            date=date(2026, 7, 1) + timedelta(days=i * 2),
        )
        db.add(fl)
        db.flush()

    # ── Expenses ──────────────────────────────────────────────────────────────
    expense_types = ["Toll", "Maintenance", "Repair", "Other", "Toll"]
    for i, v in enumerate(vehicles):
        e = Expense(
            vehicle_id=v.id,
            expense_type=expense_types[i % len(expense_types)],
            amount=round(random.uniform(500, 5000), 2),
            description=f"{expense_types[i % len(expense_types)]} charge",
            date=date(2026, 6, 15) + timedelta(days=i * 3),
        )
        db.add(e)
        db.flush()

    db.commit()
    print("✓ Database seeded successfully!")
    print(f"  Vehicles: {len(vehicles)}, Drivers: {len(drivers)}, Trips: {len(trips)}")

except Exception as e:
    db.rollback()
    print(f"✗ Seeding failed: {e}")
    raise
finally:
    db.close()
