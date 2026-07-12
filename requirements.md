# TransitOps – Requirements

---

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, ShadCN UI, Recharts
- Backend: Python, FastAPI
- Database: PostgreSQL, SQLAlchemy
- Auth: JWT, bcrypt

---

## Database Entities

### Users
- id, name, email, password_hash, role_id, created_at

### Roles
- id, role_name

### Vehicles
- id, registration_number (unique), name, vehicle_type, max_load_capacity, odometer, acquisition_cost, status, region, created_at
- Status: Available | On Trip | In Shop | Retired

### Drivers
- id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status, created_at
- Status: Available | On Trip | Off Duty | Suspended

### Trips
- id, vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, actual_distance, fuel_consumed, revenue, status, created_at, completed_at
- Status: Draft | Dispatched | Completed | Cancelled

### Maintenance Logs
- id, vehicle_id, issue, maintenance_type, cost, start_date, end_date, status
- Status: Open | Closed

### Fuel Logs
- id, vehicle_id, trip_id (nullable), liters, cost, date

### Expenses
- id, vehicle_id, trip_id (nullable), expense_type, amount, description, date

---

## Functional Requirements

### Authentication
- Login with email and password
- JWT token issued on login
- All routes protected except login
- RBAC: Fleet Manager, Driver/Dispatcher, Safety Officer, Financial Analyst

### Dashboard
- KPIs: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %, Fuel Efficiency, Operational Cost, Vehicle ROI
- Filters: vehicle type, status, region

### Vehicle Registry
- CRUD operations
- Unique registration number validation
- Status management

### Driver Management
- CRUD operations
- License expiry tracking
- Status management

### Trip Management
- Create trip: source, destination, vehicle (available only), driver (available only), cargo weight, planned distance
- Dispatch, Complete, Cancel actions
- Complete trip: requires final odometer and fuel consumed entry

### Maintenance
- Create maintenance log per vehicle
- Close maintenance

### Fuel & Expense Tracking
- Log fuel per vehicle/trip
- Log expenses per vehicle/trip
- Auto-calculate operational cost

### Reports
- Fleet Utilization, Fuel Efficiency, Operational Cost, Vehicle ROI
- CSV export

---

## Business Rules

- Vehicle registration number must be unique
- Retired or In Shop vehicles cannot be dispatched
- Suspended drivers cannot be assigned
- Drivers with expired licenses cannot be dispatched
- Vehicle or driver already On Trip cannot be reassigned
- Cargo weight must not exceed vehicle max load capacity
- Dispatching a trip: Vehicle → On Trip, Driver → On Trip
- Completing a trip: Vehicle → Available, Driver → Available
- Cancelling a dispatched trip: Vehicle → Available, Driver → Available
- Creating a maintenance record: Vehicle → In Shop
- Closing maintenance: Vehicle → Available (unless Retired)

---

## Mandatory Deliverables

- Responsive web interface
- Authentication with RBAC
- CRUD for Vehicles and Drivers
- Trip Management with validations
- Automatic status transitions
- Maintenance workflow
- Fuel and Expense tracking
- Dashboard with KPIs
- Reports with CSV export

---

## Bonus Features

- Charts and visual analytics
- PDF export
- Email reminders for expiring licenses
- Search, filters, and sorting
- Dark mode

---

## Backend Dependencies

fastapi, uvicorn[standard], sqlalchemy, psycopg2-binary, alembic, python-jose[cryptography], passlib[bcrypt], python-multipart, pydantic-settings, python-dotenv, pandas

## Frontend Dependencies

react, typescript, vite, tailwindcss, shadcn/ui, react-router-dom, axios, recharts, @tanstack/react-query

---

## Integration

- Frontend communicates with backend via REST API
- JWT token stored in localStorage, sent as Authorization: Bearer <token> on every request
- CORS enabled on backend for frontend origin
