from backend.schemas.user import UserCreate, UserResponse, Token, TokenData, LoginRequest, RoleResponse
from backend.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from backend.schemas.driver import DriverCreate, DriverUpdate, DriverResponse, DriverPaginatedResponse
from backend.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse, MaintenanceClose, MaintenancePaginatedResponse
from backend.schemas.trip import TripCreate, TripComplete, TripResponse
from backend.schemas.fuel_log import FuelLogCreate, FuelLogUpdate, FuelLogResponse, FuelLogPaginatedResponse
from backend.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpensePaginatedResponse
from backend.schemas.dashboard import DashboardKPIs
from backend.schemas.analytics import AnalyticsResponse, VehicleFuelEfficiency, VehicleROI, VehicleUsage, DriverUtilization, MonthlyCost, TripStats
