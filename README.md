# TransitOps – Smart Transport Operations Platform

TransitOps is an intelligent fleet management platform that eliminates manual transport operations by automating dispatch, maintenance, fuel tracking, driver compliance, and operational analytics. It enforces critical business rules to prevent scheduling conflicts, improve fleet utilization, and provide actionable insights for logistics companies.

---

## What This Platform Does

TransitOps replaces spreadsheets and manual logbooks with a centralized system for managing the complete lifecycle of transport operations — from vehicle registration and driver management to dispatching, maintenance, fuel logging, and analytics.

---

## Key Modules

- Authentication with Role-Based Access Control
- Dashboard with real-time KPIs
- Vehicle Registry
- Driver Management
- Trip Management with automatic status transitions
- Maintenance Workflow
- Fuel and Expense Tracking
- Reports and Analytics

---

## Target Users

| Role | Responsibility |
|---|---|
| Fleet Manager | Oversees fleet assets, maintenance, and operational efficiency |
| Driver / Dispatcher | Creates trips, assigns vehicles and drivers, monitors deliveries |
| Safety Officer | Tracks license validity, driver compliance, and safety scores |
| Financial Analyst | Reviews expenses, fuel consumption, maintenance costs, and ROI |

---

## Business Rules

The system automatically enforces the following rules:

- Vehicle registration number must be unique
- Retired or In Shop vehicles cannot be dispatched
- Suspended drivers cannot be assigned to trips
- Drivers with expired licenses cannot be dispatched
- A vehicle or driver already On Trip cannot be reassigned
- Cargo weight must not exceed the vehicle's maximum load capacity
- Dispatching a trip sets both vehicle and driver status to On Trip
- Completing a trip restores both vehicle and driver to Available
- Cancelling a dispatched trip restores vehicle and driver to Available
- Creating a maintenance record sets vehicle status to In Shop
- Closing maintenance restores vehicle to Available (unless Retired)

---

## Architecture

```
React + TypeScript
        |
     REST API
        |
FastAPI (Python)
        |
   PostgreSQL
```

---

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, ShadCN UI
- Backend: Python, FastAPI
- Database: PostgreSQL, SQLAlchemy
- Auth: JWT, bcrypt
- Charts: Recharts

---

## Database Entities

Users, Roles, Vehicles, Drivers, Trips, Maintenance Logs, Fuel Logs, Expenses

---

## Example Workflow

```
Login
  |
Dashboard
  |
Register Vehicle  (e.g. Van-05, max capacity 500 kg)
  |
Register Driver   (e.g. Alex, valid license)
  |
Create Trip       (cargo 450 kg — validated against capacity)
  |
Dispatch          (Vehicle and Driver become On Trip)
  |
Complete Trip     (enter final odometer and fuel consumed)
  |
Vehicle and Driver return to Available
  |
Create Maintenance Record  (Vehicle moves to In Shop)
  |
Close Maintenance          (Vehicle restored to Available)
  |
Reports reflect updated fuel efficiency and operational cost
```

---

## Dashboard KPIs

- Active Vehicles, Available Vehicles, Vehicles In Maintenance
- Active Trips, Pending Trips, Drivers On Duty
- Fleet Utilization %
- Fuel Efficiency (Distance / Fuel)
- Operational Cost (Fuel + Maintenance)
- Vehicle ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost

---

## Reports

- Fleet Utilization
- Fuel Efficiency
- Operational Cost
- Vehicle ROI
- Export: CSV

---

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Database Seeding

TransitOps includes a flexible and idempotent command-line database seeding system to populate the database with realistic demo data from CSV templates.

### CSV Files Placement

Seed files should be placed in the `backend/data/` directory. The seeder expects the following file names:
- `vehicles.csv`: Registry of fleet vehicles.
- `drivers.csv`: List of fleet drivers.
- `maintenance.csv`: Logs of vehicle maintenance activities.
- `fuel_logs.csv`: Fuel transaction history.
- `expenses.csv`: General operational expenses.

### How to Run the Seeder

Ensure you have activated the backend virtual environment:
```bash
# From the project root directory
backend\venv\Scripts\activate
```

You can execute the seeding script from the project root:
```bash
python backend/scripts/seed_database.py [options]
```
Or from the `backend/` directory:
```bash
cd backend
python scripts/seed_database.py [options]
```

#### Command-Line Options

By default, the script seeds all tables. You can also seed specific tables using command-line flags:
- `--vehicles`: Seed vehicles only.
- `--drivers`: Seed drivers only.
- `--maintenance`: Seed maintenance logs only.
- `--fuel`: Seed fuel logs only.
- `--expenses`: Seed expenses only.
- `--all`: Seed all tables (default).
- `-h`, `--help`: Show the command help message.

Example of seeding only vehicles and drivers:
```bash
python backend/scripts/seed_database.py --vehicles --drivers
```

### Expected Output

When running successfully, the script displays the seeding progress per module and prints a final execution summary:
```text
[INFO] Seeding Vehicles...
[INFO] Seeding Drivers...

==================================================
TransitOps Seeding Execution Summary
==================================================
Vehicles: 50 inserted, 0 skipped
Drivers: 50 inserted, 0 skipped
--------------------------------------------------
Seeding completed successfully in 0.25 seconds.
==================================================
```

### Troubleshooting

1. **`ModuleNotFoundError: No module named 'jose'`**
   - Ensure the virtual environment is activated before running the script (`backend\venv\Scripts\activate`).
2. **Database Constraint / Duplicate Errors**
   - The seeding script is fully idempotent and automatically skips records that already exist (detected by vehicle registration number, driver license number, or matching dates/amounts/types for logs). However, if schema changes occur, you may want to delete the local `transitops.db` SQLite file and re-run the seeder to regenerate tables.
3. **Invalid Path / Alternate Data Streams (`Zone.Identifier`)**
   - If git fails with path errors on Windows, turn off NTFS protection locally:
     ```bash
     git config core.protectNTFS false
     ```

---

## Project Structure

```
TransitOps/
|
|-- backend/
|   |-- api/
|   |-- models/
|   |-- services/
|   |-- middleware/
|   |-- routes/
|   |-- schemas/
|   |-- database/
|   `-- utils/
|
|-- frontend/
|   |-- components/
|   |-- pages/
|   |-- hooks/
|   |-- layouts/
|   |-- services/
|   `-- assets/
|
|-- docs/
|-- screenshots/
|-- README.md
`-- LICENSE
```

---

## Roadmap

- GPS vehicle tracking
- Route optimization
- Predictive maintenance using AI
- Mobile application
- Multi-organization support

---

## License

This project is developed for educational and hackathon purposes.
