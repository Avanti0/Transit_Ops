from sqlalchemy.orm import Session
from typing import Generator
from backend.utils.exceptions import BusinessRuleException
import io
import csv
from backend.models.vehicle import Vehicle
from backend.models.driver import Driver
from backend.models.trip import Trip
from backend.models.maintenance import Maintenance
from backend.models.fuel_log import FuelLog
from backend.models.expense import Expense

class ReportService:
    """
    Service class executing database queries and returning memory-efficient generators
    for streaming CSV reports.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def generate_csv(self, dataset: str) -> Generator[str, None, None]:
        """
        Validates the requested dataset and yields CSV data line-by-line using a generator.
        """
        dataset = dataset.lower().strip()
        
        if dataset == "vehicles":
            headers = ["ID", "Registration Number", "Name", "Type", "Max Load Capacity (kg)", "Odometer (km)", "Acquisition Cost", "Status", "Region", "Created At"]
            records = self.db.query(Vehicle).order_by(Vehicle.created_at.desc()).all()
            
            def get_rows():
                for r in records:
                    yield [r.id, r.registration_number, r.name, r.vehicle_type, r.max_load_capacity, r.odometer, r.acquisition_cost, r.status.value, r.region or "", r.created_at.isoformat()]
            rows_gen = get_rows()
            
        elif dataset == "drivers":
            headers = ["ID", "Name", "License Number", "License Category", "License Expiry", "Contact Number", "Safety Score", "Status", "Created At"]
            records = self.db.query(Driver).order_by(Driver.created_at.desc()).all()
            
            def get_rows():
                for r in records:
                    yield [r.id, r.name, r.license_number, r.license_category, r.license_expiry.isoformat(), r.contact_number, r.safety_score, r.status.value, r.created_at.isoformat()]
            rows_gen = get_rows()
            
        elif dataset == "trips":
            headers = ["ID", "Vehicle ID", "Driver ID", "Source", "Destination", "Cargo Weight (kg)", "Planned Distance (km)", "Actual Distance (km)", "Fuel Consumed (L)", "Revenue", "Status", "Created At"]
            records = self.db.query(Trip).order_by(Trip.created_at.desc()).all()
            
            def get_rows():
                for r in records:
                    yield [r.id, r.vehicle_id, r.driver_id, r.source, r.destination, r.cargo_weight, r.planned_distance, r.actual_distance or "", r.fuel_consumed or "", r.revenue or "", r.status.value, r.created_at.isoformat()]
            rows_gen = get_rows()
            
        elif dataset == "maintenance" or dataset == "maintenance logs" or dataset == "maintenance_logs":
            headers = ["ID", "Vehicle ID", "Type", "Issue", "Description", "Cost", "Status", "Start Date", "End Date", "Created At"]
            records = self.db.query(Maintenance).order_by(Maintenance.created_at.desc()).all()
            
            def get_rows():
                for r in records:
                    yield [r.id, r.vehicle_id, r.maintenance_type, r.issue, r.description or "", r.cost, r.status.value, r.start_date.isoformat(), r.end_date.isoformat() if r.end_date else "", r.created_at.isoformat()]
            rows_gen = get_rows()
            
        elif dataset == "fuel" or dataset == "fuel logs" or dataset == "fuel_logs":
            headers = ["ID", "Vehicle ID", "Liters", "Cost", "Date", "Created At"]
            records = self.db.query(FuelLog).order_by(FuelLog.created_at.desc()).all()
            
            def get_rows():
                for r in records:
                    yield [r.id, r.vehicle_id, r.liters, r.cost, r.date.isoformat(), r.created_at.isoformat()]
            rows_gen = get_rows()
            
        elif dataset == "expenses":
            headers = ["ID", "Vehicle ID", "Type", "Amount", "Description", "Date", "Created At"]
            records = self.db.query(Expense).order_by(Expense.created_at.desc()).all()
            
            def get_rows():
                for r in records:
                    yield [r.id, r.vehicle_id, r.expense_type.value, r.amount, r.description or "", r.date.isoformat(), r.created_at.isoformat()]
            rows_gen = get_rows()
            
        else:
            raise BusinessRuleException(
                f"Invalid dataset '{dataset}'. Choose from 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'expenses'."
            )
            
        # Yield CSV data row by row
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        for row in rows_gen:
            writer.writerow(row)
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
