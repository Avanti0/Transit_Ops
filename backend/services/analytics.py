from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
from backend.models.vehicle import Vehicle, VehicleStatus
from backend.models.driver import Driver
from backend.models.trip import Trip, TripStatus
from backend.models.maintenance import Maintenance
from backend.models.fuel_log import FuelLog
from backend.models.expense import Expense
from backend.schemas.analytics import (
    AnalyticsResponse, 
    VehicleFuelEfficiency, 
    VehicleROI, 
    VehicleUsage, 
    DriverUtilization, 
    MonthlyCost, 
    TripStats
)

class AnalyticsService:
    """
    Service class executing optimized SQL aggregate queries to compute detailed operations analytics.
    """
    def __init__(self, db: Session):
        self.db = db
        
    def get_analytics(self) -> AnalyticsResponse:
        """
        Calculates and returns consolidated operational KPIs and metrics.
        Utilizes database aggregation where appropriate and processes date groupings
        in a database-agnostic manner.
        """
        # 1. Fleet Average Fuel Efficiency & Trip Totals
        # Overall: sum(actual_distance) / sum(fuel_consumed) for completed trips
        completed_trips_aggregates = self.db.query(
            func.sum(Trip.actual_distance),
            func.sum(Trip.fuel_consumed),
            func.count(Trip.id),
            func.sum(Trip.planned_distance),
            func.sum(Trip.revenue)
        ).filter(Trip.status == TripStatus.COMPLETED).first()
        
        total_actual_distance = completed_trips_aggregates[0] or 0.0
        total_fuel_consumed = completed_trips_aggregates[1] or 0.0
        completed_trips_count = completed_trips_aggregates[2] or 0
        total_planned_distance = completed_trips_aggregates[3] or 0.0
        total_revenue = completed_trips_aggregates[4] or 0.0
        
        fleet_avg_efficiency = 0.0
        if total_fuel_consumed > 0:
            fleet_avg_efficiency = round(total_actual_distance / total_fuel_consumed, 2)
            
        # 2. Vehicle-wise Fuel Efficiency
        # Calculate as sum(actual_distance) / sum(fuel_consumed) from completed trips per vehicle
        vehicle_efficiencies_query = self.db.query(
            Vehicle.id,
            Vehicle.registration_number,
            Vehicle.name,
            func.sum(Trip.actual_distance),
            func.sum(Trip.fuel_consumed)
        ).outerjoin(Trip, (Trip.vehicle_id == Vehicle.id) & (Trip.status == TripStatus.COMPLETED))\
         .group_by(Vehicle.id, Vehicle.registration_number, Vehicle.name).all()
         
        vehicle_fuel_efficiencies = []
        for v_id, reg, name, dist, fuel in vehicle_efficiencies_query:
            dist = dist or 0.0
            fuel = fuel or 0.0
            eff = round(dist / fuel, 2) if fuel > 0 else 0.0
            vehicle_fuel_efficiencies.append(
                VehicleFuelEfficiency(
                    vehicle_id=v_id,
                    registration_number=reg,
                    name=name,
                    fuel_efficiency=eff
                )
            )
            
        # 3. Vehicle ROIs
        # Vehicle ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
        revenue_query = self.db.query(
            Trip.vehicle_id,
            func.sum(Trip.revenue)
        ).filter(Trip.status == TripStatus.COMPLETED).group_by(Trip.vehicle_id).all()
        revenue_map = {v_id: rev for v_id, rev in revenue_query}
        
        maintenance_query = self.db.query(
            Maintenance.vehicle_id,
            func.sum(Maintenance.cost)
        ).group_by(Maintenance.vehicle_id).all()
        maintenance_map = {v_id: cost for v_id, cost in maintenance_query}
        
        fuel_query = self.db.query(
            FuelLog.vehicle_id,
            func.sum(FuelLog.cost)
        ).group_by(FuelLog.vehicle_id).all()
        fuel_map = {v_id: cost for v_id, cost in fuel_query}
        
        vehicles = self.db.query(Vehicle).all()
        vehicle_rois = []
        for v in vehicles:
            rev = revenue_map.get(v.id, 0.0) or 0.0
            m_cost = maintenance_map.get(v.id, 0.0) or 0.0
            f_cost = fuel_map.get(v.id, 0.0) or 0.0
            acq_cost = v.acquisition_cost
            
            roi_percentage = 0.0
            if acq_cost > 0:
                roi_percentage = round(((rev - (m_cost + f_cost)) / acq_cost) * 100, 2)
                
            vehicle_rois.append(
                VehicleROI(
                    vehicle_id=v.id,
                    registration_number=v.registration_number,
                    name=v.name,
                    revenue=round(rev, 2),
                    maintenance_cost=round(m_cost, 2),
                    fuel_cost=round(f_cost, 2),
                    acquisition_cost=round(acq_cost, 2),
                    roi_percentage=roi_percentage
                )
            )
            
        # 4. Fleet Utilization Percentage
        # active / (total - retired)
        vehicle_status_counts = self.db.query(
            Vehicle.status, 
            func.count(Vehicle.id)
        ).group_by(Vehicle.status).all()
        
        status_map = {status: count for status, count in vehicle_status_counts}
        total_vehicles = sum(status_map.values())
        active_vehicles = status_map.get(VehicleStatus.ON_TRIP, 0)
        retired_vehicles = status_map.get(VehicleStatus.RETIRED, 0)
        
        active_fleet_count = total_vehicles - retired_vehicles
        fleet_utilization = 0.0
        if active_fleet_count > 0:
            fleet_utilization = round((active_vehicles / active_fleet_count) * 100, 2)
            
        # 5. Vehicle Usage Statistics (trips count and total actual distance)
        usage_query = self.db.query(
            Vehicle.id,
            Vehicle.registration_number,
            Vehicle.name,
            func.count(Trip.id),
            func.sum(Trip.actual_distance)
        ).outerjoin(Trip, (Trip.vehicle_id == Vehicle.id) & (Trip.status == TripStatus.COMPLETED))\
         .group_by(Vehicle.id, Vehicle.registration_number, Vehicle.name).all()
         
        vehicle_usages = []
        for v_id, reg, name, trips_count, distance in usage_query:
            vehicle_usages.append(
                VehicleUsage(
                    vehicle_id=v_id,
                    registration_number=reg,
                    name=name,
                    total_trips=trips_count or 0,
                    total_distance=round(distance or 0.0, 2)
                )
            )
            
        # 6. Driver Utilization
        driver_util_query = self.db.query(
            Driver.id,
            Driver.name,
            Driver.safety_score,
            Driver.status,
            func.count(Trip.id),
            func.sum(Trip.actual_distance)
        ).outerjoin(Trip, (Trip.driver_id == Driver.id) & (Trip.status == TripStatus.COMPLETED))\
         .group_by(Driver.id, Driver.name, Driver.safety_score, Driver.status).all()
         
        driver_utilizations = []
        for d_id, d_name, safety, d_status, trips_count, distance in driver_util_query:
            driver_utilizations.append(
                DriverUtilization(
                    driver_id=d_id,
                    name=d_name,
                    total_trips=trips_count or 0,
                    total_distance=round(distance or 0.0, 2),
                    safety_score=safety,
                    status=d_status.value
                )
            )
            
        # 7. Monthly Fuel Costs
        # Format: "YYYY-MM"
        fuel_logs = self.db.query(FuelLog.date, FuelLog.cost).all()
        fuel_monthly = {}
        for date, cost in fuel_logs:
            if date:
                month_key = date.strftime("%Y-%m")
                fuel_monthly[month_key] = fuel_monthly.get(month_key, 0.0) + (cost or 0.0)
                
        monthly_fuel_costs = [
            MonthlyCost(month=k, cost=round(v, 2)) 
            for k, v in sorted(fuel_monthly.items())
        ]
        
        # 8. Monthly Maintenance Costs
        maintenances = self.db.query(Maintenance.start_date, Maintenance.cost).all()
        maint_monthly = {}
        for date, cost in maintenances:
            if date:
                month_key = date.strftime("%Y-%m")
                maint_monthly[month_key] = maint_monthly.get(month_key, 0.0) + (cost or 0.0)
                
        monthly_maintenance_costs = [
            MonthlyCost(month=k, cost=round(v, 2)) 
            for k, v in sorted(maint_monthly.items())
        ]
        
        # 9. Trip Statistics (consolidated status counts & sums)
        all_trips_aggregates = self.db.query(
            Trip.status,
            func.count(Trip.id),
            func.sum(Trip.revenue)
        ).group_by(Trip.status).all()
        
        trip_status_map = {status: count for status, count, _ in all_trips_aggregates}
        total_trips = sum(trip_status_map.values())
        completed_trips = trip_status_map.get(TripStatus.COMPLETED, 0)
        dispatched_trips = trip_status_map.get(TripStatus.DISPATCHED, 0)
        cancelled_trips = trip_status_map.get(TripStatus.CANCELLED, 0)
        draft_trips = trip_status_map.get(TripStatus.DRAFT, 0)
        
        total_trip_rev = sum(rev or 0.0 for _, _, rev in all_trips_aggregates if rev)
        avg_revenue = round(total_trip_rev / completed_trips, 2) if completed_trips > 0 else 0.0
        
        trip_stats = TripStats(
            total_trips=total_trips,
            completed_trips=completed_trips,
            dispatched_trips=dispatched_trips,
            cancelled_trips=cancelled_trips,
            draft_trips=draft_trips,
            total_revenue=round(total_trip_rev, 2),
            avg_revenue=avg_revenue,
            total_actual_distance=round(total_actual_distance, 2),
            total_planned_distance=round(total_planned_distance, 2)
        )
        
        return AnalyticsResponse(
            fleet_average_fuel_efficiency=fleet_avg_efficiency,
            vehicle_fuel_efficiencies=vehicle_fuel_efficiencies,
            vehicle_rois=vehicle_rois,
            fleet_utilization_percentage=fleet_utilization,
            vehicle_usages=vehicle_usages,
            driver_utilizations=driver_utilizations,
            monthly_fuel_costs=monthly_fuel_costs,
            monthly_maintenance_costs=monthly_maintenance_costs,
            trip_statistics=trip_stats
        )
