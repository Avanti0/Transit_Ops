"""
Regenerate all TransitOps demo datasets with realistic, valid data.
Run from project root: python backend/scripts/generate_datasets.py
"""
import csv
import random
from datetime import date, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
random.seed(42)


def rand_date(start_year=2022, end_year=2026):
    start = date(start_year, 1, 1)
    end = date(end_year, 6, 30)
    return start + timedelta(days=random.randint(0, (end - start).days))


def future_date(extra_years=2):
    today = date.today()
    return today.replace(year=today.year + extra_years) + timedelta(days=random.randint(-180, 180))


# ── VEHICLES (50 rows) ──────────────────────────────────────────────────────
vehicle_types = ["Truck", "Van", "Bus", "Car", "Trailer"]
regions = ["North", "South", "East", "West", "Central"]
v_statuses = ["Available", "On Trip", "In Shop", "Retired"]
v_status_w = [0.55, 0.20, 0.15, 0.10]
makes = ["Tata", "Mahindra", "Ashok Leyland", "Eicher", "BharatBenz", "Volvo", "Force"]
reg_prefixes = ["AB", "CD", "EF", "GH", "KL", "MN", "PQ", "RS"]

reg_numbers = []

with open(DATA_DIR / "vehicle_dataset.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["registration_number", "vehicle_name", "vehicle_type", "max_capacity",
                "odometer", "acquisition_cost", "region", "status"])
    for i in range(1, 51):
        prefix = random.choice(reg_prefixes)
        reg = f"TN{random.randint(10, 99)}{prefix}{random.randint(1000, 9999)}"
        reg_numbers.append(reg)
        vtype = random.choice(vehicle_types)
        cap = round(random.uniform(500, 15000), 1)
        odo = round(random.uniform(5000, 300000), 1)
        cost = round(random.uniform(500000, 5000000), 2)
        status = random.choices(v_statuses, v_status_w)[0]
        make = random.choice(makes)
        w.writerow([reg, f"{make} {vtype} {i:02d}", vtype, cap, odo, cost,
                    random.choice(regions), status])

print(f"vehicle_dataset.csv   — {len(reg_numbers)} rows")


# ── DRIVERS (50 rows) ───────────────────────────────────────────────────────
first_names = [
    "Ravi", "Suresh", "Amit", "Vijay", "Kiran", "Arun", "Prakash", "Sanjay", "Deepak", "Manoj",
    "Ramesh", "Ganesh", "Rajesh", "Mahesh", "Dinesh", "Naresh", "Lokesh", "Umesh", "Mukesh", "Arjun",
    "Naveen", "Santosh", "Rakesh", "Pradeep", "Vikas", "Ashok", "Mohan", "Shankar", "Vinod", "Pavan",
    "Nitin", "Sachin", "Rohit", "Ajay", "Anand", "Harish", "Girish", "Satish", "Venkat", "Sunil",
    "Anil", "Kapil", "Rahul", "Varun", "Tarun", "Karun", "Sharun", "Larun", "Parun", "Barun",
]
last_names = [
    "Kumar", "Singh", "Sharma", "Verma", "Gupta", "Patel", "Reddy", "Nair", "Pillai", "Rao",
    "Mishra", "Pandey", "Tiwari", "Dubey", "Yadav", "Joshi", "Mehta", "Shah", "Malhotra", "Chopra",
]
lic_cats = ["CDL-A", "CDL-B", "HMV", "LMV-TR", "MGV"]
d_statuses = ["Available", "On Trip", "Off Duty", "Suspended"]
d_status_w = [0.50, 0.20, 0.25, 0.05]

lic_nums_seen: set = set()
driver_names = []

with open(DATA_DIR / "drivers_dataset.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["name", "license_number", "license_category", "license_expiry",
                "contact_number", "safety_score", "status"])
    for fn in first_names:
        ln = random.choice(last_names)
        name = f"{fn} {ln}"
        driver_names.append(name)
        while True:
            lic = f"DL{random.randint(10, 99)}{random.randint(10000000, 99999999)}"
            if lic not in lic_nums_seen:
                lic_nums_seen.add(lic)
                break
        expiry = future_date(extra_years=random.randint(1, 6))
        phone = f"+91 {random.randint(6000000000, 9999999999)}"
        score = round(random.uniform(60.0, 100.0), 1)
        status = random.choices(d_statuses, d_status_w)[0]
        w.writerow([name, lic, random.choice(lic_cats), expiry.strftime("%Y-%m-%d"),
                    phone, score, status])

print(f"drivers_dataset.csv   — 50 rows")


# ── MAINTENANCE (50 rows) ───────────────────────────────────────────────────
m_types = ["Preventive", "Corrective", "Emergency", "Inspection", "Oil Change", "Tyre Replacement"]
m_issues = [
    "Engine overheating", "Brake failure", "Oil leak", "Tyre puncture", "Battery dead",
    "AC not working", "Transmission issue", "Suspension damage", "Coolant leak",
    "Fuel pump failure", "Electrical fault", "Exhaust problem", "Steering issue", "Clutch wear",
]
m_statuses = ["Active", "Completed"]

with open(DATA_DIR / "Maintanence_dataset.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["vehicle_registration_number", "maintenance_type", "issue", "description",
                "cost", "status", "start_date", "end_date"])
    for _ in range(50):
        reg = random.choice(reg_numbers)
        mtype = random.choice(m_types)
        issue = random.choice(m_issues)
        desc = f"Routine {mtype.lower()} — {issue.lower()}. Inspected and serviced as per schedule."
        cost = round(random.uniform(2000.0, 80000.0), 2)
        start = rand_date(2022, 2026)
        status = random.choice(m_statuses)
        end = "" if status == "Active" else (start + timedelta(days=random.randint(1, 15))).strftime("%Y-%m-%d")
        w.writerow([reg, mtype, issue, desc, cost, status, start.strftime("%Y-%m-%d"), end])

print(f"Maintanence_dataset.csv — 50 rows")


# ── FUEL LOGS (50 rows) ─────────────────────────────────────────────────────
with open(DATA_DIR / "FuelLog_Dataset.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["vehicle_registration_number", "liters", "cost", "date"])
    for _ in range(50):
        reg = random.choice(reg_numbers)
        liters = round(random.uniform(30.0, 200.0), 1)
        cost = round(liters * random.uniform(85.0, 105.0), 2)
        dt = rand_date(2024, 2026)
        w.writerow([reg, liters, cost, dt.strftime("%Y-%m-%d")])

print(f"FuelLog_Dataset.csv   — 50 rows")


# ── EXPENSES (50 rows) ──────────────────────────────────────────────────────
e_types = ["Toll", "Maintenance", "Repair", "Other"]
e_descs = {
    "Toll": ["Highway toll — NH48", "State border toll", "City toll gate", "Bridge toll"],
    "Maintenance": ["Scheduled service", "Fluid top-up", "Filter replacement", "Lubrication"],
    "Repair": ["Tyre replacement", "Battery replacement", "Windshield repair", "Dent repair"],
    "Other": ["Parking fee", "Driver allowance", "Loading charges", "Unloading charges"],
}

with open(DATA_DIR / "Expenses_dataset.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["vehicle_registration_number", "expense_type", "amount", "description", "date"])
    for _ in range(50):
        reg = random.choice(reg_numbers)
        etype = random.choice(e_types)
        amount = round(random.uniform(500.0, 50000.0), 2)
        desc = random.choice(e_descs[etype])
        dt = rand_date(2024, 2026)
        w.writerow([reg, etype, amount, desc, dt.strftime("%Y-%m-%d")])

print(f"Expenses_dataset.csv  — 50 rows")


# ── TRIPS (50 rows) ─────────────────────────────────────────────────────────
cities = [
    "Mumbai", "Delhi", "Chennai", "Kolkata", "Bangalore", "Hyderabad", "Pune", "Ahmedabad",
    "Jaipur", "Lucknow", "Surat", "Nagpur", "Indore", "Bhopal", "Patna", "Vadodara",
    "Coimbatore", "Visakhapatnam", "Kochi", "Chandigarh",
]
t_statuses = ["Draft", "Dispatched", "Completed", "Cancelled"]
t_status_w = [0.15, 0.20, 0.55, 0.10]

with open(DATA_DIR / "Trips_dataset.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["vehicle_registration_number", "driver_name", "source_city", "destination_city",
                "cargo_weight", "planned_distance", "actual_distance", "fuel_used",
                "revenue", "status", "date"])
    for _ in range(50):
        reg = random.choice(reg_numbers)
        driver = random.choice(driver_names)
        src, dst = random.sample(cities, 2)
        cargo = round(random.uniform(100.0, 12000.0), 1)
        planned = random.randint(100, 2500)
        status = random.choices(t_statuses, t_status_w)[0]
        actual = round(planned * random.uniform(0.85, 1.15), 1) if status == "Completed" else ""
        fuel = round(float(actual) / random.uniform(4.0, 10.0), 1) if actual != "" else ""
        rev = round(random.uniform(5000.0, 150000.0), 2)
        dt = rand_date(2024, 2026)
        w.writerow([reg, driver, src, dst, cargo, planned, actual, fuel, rev,
                    status, dt.strftime("%Y-%m-%d")])

print(f"Trips_dataset.csv     — 50 rows")


# ── USERS (50 rows) ─────────────────────────────────────────────────────────
roles = ["Fleet Manager", "Driver/Dispatcher", "Safety Officer", "Financial Analyst"]
role_w = [0.15, 0.55, 0.15, 0.15]
domains = ["gmail.com", "yahoo.com", "outlook.com", "company.in", "transitops.com"]

with open(DATA_DIR / "Users_dataset.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["name", "email", "role"])
    used_emails: set = set()
    for fn in first_names:
        ln = random.choice(last_names)
        name = f"{fn} {ln}"
        slug = name.lower().replace(" ", ".")
        email = f"{slug}@{random.choice(domains)}"
        if email in used_emails:
            email = f"{slug}{random.randint(1, 99)}@{random.choice(domains)}"
        used_emails.add(email)
        role = random.choices(roles, role_w)[0]
        w.writerow([name, email, role])

print(f"Users_dataset.csv     — 50 rows")
print()
print("All datasets regenerated successfully.")
