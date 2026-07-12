import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.base import Base
from backend.database.session import engine
from backend.utils.config import settings
import backend.models  # register all models
from backend.routes import auth, vehicles, drivers, trips, maintenance, fuel_log, dashboard, expense, analytics, reports
from backend.middleware.logging import RequestLoggingMiddleware
from backend.utils.exceptions import register_exception_handlers

Base.metadata.create_all(bind=engine)

# ─── Migrate: add user_id column to drivers table if missing ────────────────────
from sqlalchemy import text, inspect
_inspector = inspect(engine)
_drv_cols = {c["name"] for c in _inspector.get_columns("drivers")} if "drivers" in _inspector.get_table_names() else set()
if "user_id" not in _drv_cols:
    with engine.begin() as _conn:
        _conn.execute(text('ALTER TABLE drivers ADD COLUMN user_id VARCHAR(36) REFERENCES users(id)'))
    print("Migration: added user_id column to drivers table")

# Auto-seed roles and users if not present
from backend.database.session import SessionLocal
from backend.models.user import Role, User
from backend.models.driver import Driver
from backend.utils.auth import hash_password
db = SessionLocal()
try:
    existing_roles = [r.role_name for r in db.query(Role).all()]
    required_roles = ["Fleet Manager", "Safety Officer", "Financial Analyst", "Driver/Dispatcher"]
    for role_name in required_roles:
        if role_name not in existing_roles:
            db.add(Role(role_name=role_name))
    db.commit()

    # Seed demo users corresponding to frontend login cards
    roles_map = {r.role_name: r.id for r in db.query(Role).all()}
    demo_users = [
        {"name": "Admin User", "email": "admin@transitops.com", "password": "admin123", "role": "Fleet Manager"},
        {"name": "Ravi Kumar", "email": "driver@transitops.com", "password": "driver123", "role": "Driver/Dispatcher"},
        {"name": "Safety Officer", "email": "safety@transitops.com", "password": "safety123", "role": "Safety Officer"},
        {"name": "Finance Analyst", "email": "finance@transitops.com", "password": "finance123", "role": "Financial Analyst"},
    ]
    for du in demo_users:
        if not db.query(User).filter(User.email == du["email"]).first():
            role_id = roles_map.get(du["role"])
            if role_id:
                db.add(User(
                    name=du["name"],
                    email=du["email"],
                    password_hash=hash_password(du["password"]),
                    role_id=role_id
                ))
    db.commit()

    # Link driver user to a driver record (for Driver/Dispatcher role login)
    driver_user = db.query(User).filter(User.email == "driver@transitops.com").first()
    if driver_user:
        # Find or create a driver record linked to this user
        linked_driver = db.query(Driver).filter(Driver.user_id == driver_user.id).first()
        if not linked_driver:
            # 1. Try exact name match (works if seed_database.py already ran)
            existing_driver = db.query(Driver).filter(Driver.name == driver_user.name).first()
            if existing_driver:
                existing_driver.user_id = driver_user.id
            else:
                # 2. Grab any unlinked driver record (first available)
                unlinked = db.query(Driver).filter(Driver.user_id.is_(None)).first()
                if unlinked:
                    unlinked.user_id = driver_user.id
                else:
                    # 3. No drivers exist yet — create a minimal one
                    new_driver = Driver(
                        name=driver_user.name,
                        license_number=f"DL-{driver_user.id[:8].upper()}",
                        license_category="CDL-A",
                        license_expiry=datetime.date(2028, 12, 31),
                        contact_number="0000000000",
                        safety_score=100.0,
                        user_id=driver_user.id,
                    )
                    db.add(new_driver)
            db.commit()
except Exception as e:
    print(f"Error seeding database: {e}")
finally:
    db.close()

tags_metadata = [
    {
        "name": "Auth",
        "description": "User authentication, registration, and role assignment",
    },
    {
        "name": "Vehicles",
        "description": "Manage fleet vehicles, status transitions, and tracking",
    },
    {
        "name": "Drivers",
        "description": "Manage fleet drivers, license verification, and status",
    },
    {
        "name": "Trips",
        "description": "Schedule, dispatch, and track cargo trips",
    },
    {
        "name": "Maintenance",
        "description": "Schedule, perform, and close vehicle maintenance logs",
    },
    {
        "name": "Fuel Logs",
        "description": "Record fuel additions and cost tracking per vehicle",
    },
    {
        "name": "Expenses",
        "description": "Record auxiliary fleet operational costs",
    },
    {
        "name": "Dashboard",
        "description": "Get real-time Key Performance Indicators (KPIs) of fleet",
    },
    {
        "name": "Analytics",
        "description": "Compute fleet average fuel efficiency, vehicle ROIs, utilization, and cost trends",
    },
    {
        "name": "Reports",
        "description": "Download streaming CSV reports of core datasets",
    },
]

app = FastAPI(
    title="TransitOps API",
    description="Backend API for the TransitOps Fleet Operations & Analytics Platform",
    version="1.0.0",
    openapi_tags=tags_metadata
)

# Register request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Register CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom global exception handlers
register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(maintenance.router)
app.include_router(fuel_log.router)
app.include_router(dashboard.router)
app.include_router(expense.router)
app.include_router(analytics.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "TransitOps API is running"}
