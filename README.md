# 🚛 TransitOps – Smart Transport Operations Platform

<div align="center">

![Status](https://img.shields.io/badge/Status-Hackathon%20Project-success)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Built With](https://img.shields.io/badge/Built%20With-Full%20Stack-orange)

**An intelligent fleet and transport management platform that streamlines vehicle operations, trip dispatching, maintenance, fuel tracking, and operational analytics.**

</div>

---

# 📖 Overview

TransitOps is an end-to-end Transport Operations Platform designed for logistics and fleet management companies. It replaces manual spreadsheets and logbooks with a centralized system for managing vehicles, drivers, trips, maintenance, operational expenses, and analytics.

The platform enforces business rules automatically to prevent scheduling conflicts, improve fleet utilization, monitor maintenance schedules, ensure driver compliance, and provide real-time operational insights.

---

# 🚀 Problem Statement

Organizations managing transport fleets often face:

- Scheduling conflicts
- Vehicle overbooking
- Driver assignment errors
- Expired driving licenses
- Missed maintenance
- Poor fuel tracking
- Manual expense calculations
- Lack of operational visibility

TransitOps solves these challenges through automation, validations, and intelligent workflow management.

---

# ✨ Key Features

## 🔐 Authentication & Role-Based Access

- Secure Email & Password Authentication
- Protected Routes
- Role-Based Access Control (RBAC)

Supported Roles:

- Fleet Manager
- Driver
- Safety Officer
- Financial Analyst

---

## 🚚 Vehicle Management

- Register vehicles
- Edit vehicle details
- Delete vehicles
- Vehicle status management
- Unique registration number validation
- Vehicle lifecycle tracking

Vehicle Status:

- Available
- On Trip
- In Shop
- Retired

---

## 👨‍✈️ Driver Management

- Driver registration
- License management
- Safety score tracking
- Contact management
- License expiry validation
- Driver availability tracking

Driver Status:

- Available
- On Trip
- Off Duty
- Suspended

---

## 📦 Smart Trip Management

Create and manage transport trips including:

- Source
- Destination
- Vehicle Assignment
- Driver Assignment
- Cargo Weight
- Planned Distance

Trip Lifecycle:

```text
Draft
   │
   ▼
Dispatched
   │
   ▼
Completed

or

Cancelled
```

---

## 🔧 Maintenance Management

Maintain complete service records.

Features include:

- Create maintenance logs
- Track maintenance history
- Automatic vehicle status updates
- Vehicle unavailable during servicing
- Restore vehicle after maintenance completion

---

## ⛽ Fuel & Expense Tracking

Track:

- Fuel Consumption
- Fuel Cost
- Maintenance Cost
- Toll Charges
- Miscellaneous Expenses

Automatically calculate:

- Total Fuel Cost
- Total Maintenance Cost
- Overall Operational Cost

---

## 📊 Dashboard & Analytics

Interactive dashboard displaying:

- Active Vehicles
- Available Vehicles
- Vehicles in Maintenance
- Active Trips
- Pending Trips
- Drivers On Duty
- Fleet Utilization
- Operational Cost
- Fuel Efficiency
- Vehicle ROI

---

## 📈 Reports

Generate operational reports including:

- Fleet Utilization
- Fuel Efficiency
- Operational Cost
- Vehicle ROI

Export:

- CSV
- PDF (Bonus)

---

# 🧠 Business Rules

TransitOps automatically enforces business rules to maintain data consistency.

### Vehicle Rules

- Vehicle registration number must be unique.
- Retired vehicles cannot be assigned.
- Vehicles in maintenance cannot be dispatched.
- Vehicles already on a trip cannot be reassigned.

### Driver Rules

- Suspended drivers cannot be assigned.
- Drivers with expired licenses cannot be dispatched.
- Drivers already on a trip cannot be assigned again.

### Cargo Rules

- Cargo weight must never exceed vehicle capacity.

### Trip Rules

Dispatching automatically:

- Vehicle → On Trip
- Driver → On Trip

Completing trip automatically:

- Vehicle → Available
- Driver → Available

Cancelling trip:

- Restores vehicle availability
- Restores driver availability

Maintenance automatically:

- Moves vehicle to In Shop
- Removes vehicle from dispatch pool
- Restores availability after maintenance completion

---

# 🏗️ System Modules

```
Authentication
│
├── Dashboard
│
├── Vehicle Registry
│
├── Driver Management
│
├── Trip Management
│
├── Maintenance
│
├── Fuel Logs
│
├── Expense Tracking
│
├── Reports
│
└── Analytics
```

---

# 🗄️ Database Schema

## Users

- id
- name
- email
- password
- role_id

---

## Roles

- id
- role_name

---

## Vehicles

- id
- registration_number
- model
- vehicle_type
- max_capacity
- odometer
- acquisition_cost
- status

---

## Drivers

- id
- name
- license_number
- license_category
- expiry_date
- safety_score
- contact_number
- status

---

## Trips

- id
- vehicle_id
- driver_id
- source
- destination
- cargo_weight
- planned_distance
- actual_distance
- fuel_consumed
- status

---

## Maintenance Logs

- id
- vehicle_id
- issue
- maintenance_type
- cost
- start_date
- end_date
- status

---

## Fuel Logs

- id
- vehicle_id
- liters
- cost
- date

---

## Expenses

- id
- vehicle_id
- expense_type
- amount
- description
- date

---

# ⚙️ Project Workflow

```text
Login
      │
      ▼
Dashboard
      │
      ▼
Register Vehicles
      │
      ▼
Register Drivers
      │
      ▼
Create Trip
      │
      ▼
Business Validations
      │
      ▼
Dispatch Trip
      │
      ▼
Vehicle & Driver → On Trip
      │
      ▼
Complete Trip
      │
      ▼
Fuel Entry
      │
      ▼
Expense Entry
      │
      ▼
Reports & Analytics
```

---

# 📊 KPI Dashboard

The dashboard provides:

- Active Vehicles
- Available Vehicles
- Vehicles In Maintenance
- Active Trips
- Pending Trips
- Drivers On Duty
- Fleet Utilization %
- Operational Cost
- Fuel Efficiency
- Vehicle ROI

---

# 🛡️ Automatic Validations

✅ Unique Registration Number

✅ License Expiry Check

✅ Cargo Capacity Validation

✅ Vehicle Availability Check

✅ Driver Availability Check

✅ Maintenance Validation

✅ Automatic Status Updates

✅ Fleet Utilization Calculation

---

# 💻 Suggested Tech Stack

## Frontend

- React.js
- TypeScript
- Tailwind CSS
- ShadCN UI
- React Router

---

## Backend

- Python
- FastAPI

or

- Node.js
- Express.js

---

## Database

- PostgreSQL

or

- MySQL

---

## ORM

- SQLAlchemy

or

- Prisma

---

## Authentication

- JWT
- bcrypt

---

## Charts

- Recharts
- Chart.js

---

# 📂 Project Structure

```text
TransitOps/
│
├── backend/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── middleware/
│   ├── routes/
│   ├── schemas/
│   ├── database/
│   └── utils/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── layouts/
│   ├── services/
│   └── assets/
│
├── docs/
│
├── screenshots/
│
├── README.md
└── LICENSE
```

---

# ⭐ Bonus Features

- Interactive Charts
- PDF Report Export
- Email Alerts for Expiring Licenses
- Vehicle Document Management
- Search & Filtering
- Sorting
- Dark Mode
- Responsive Design

---

# 🎯 Hackathon Deliverables

- ✅ Authentication with RBAC
- ✅ Dashboard
- ✅ Vehicle CRUD
- ✅ Driver CRUD
- ✅ Smart Trip Management
- ✅ Automatic Status Transitions
- ✅ Maintenance Workflow
- ✅ Fuel Tracking
- ✅ Expense Tracking
- ✅ Reports
- ✅ Analytics
- ✅ Business Rule Validation

---

# 🌟 Future Enhancements

- GPS Vehicle Tracking
- Route Optimization
- Live Driver Location
- Predictive Maintenance using AI
- Fuel Consumption Forecasting
- Driver Performance Analytics
- Mobile Application
- Multi-Organization Support
- Notification System
- AI-powered Fleet Insights

---

# 👥 Team

Built with ❤️ during the Hackathon to simplify fleet operations through automation, intelligent workflows, and real-time analytics.

---

## 📄 License

This project is developed for educational and hackathon purposes.