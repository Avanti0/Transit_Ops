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
