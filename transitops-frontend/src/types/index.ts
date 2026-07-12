// ─── Roles & Status Enums ─────────────────────────────────────────────────────

export type Role = 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst';
export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';
export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
export type MaintenanceStatus = 'Open' | 'In Progress' | 'Completed';
export type ExpenseType = 'Fuel' | 'Maintenance' | 'Toll' | 'Miscellaneous';
export type VehicleType = 'Bus' | 'Van' | 'Truck' | 'Car';
export type FuelType = 'Diesel' | 'Petrol' | 'CNG' | 'Electric';
export type MaintenanceType = 'Preventive' | 'Corrective' | 'Emergency';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  capacity: number;
  status: VehicleStatus;
  currentMileage: number;
  lastServiceDate: string;
  nextServiceDue: number;
  fuelType: FuelType;
  insuranceExpiry: string;
  permitExpiry: string;
  assignedDriverId?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: DriverStatus;
  rating: number;
  totalTrips: number;
  joiningDate: string;
  address: string;
  emergencyContact: string;
  assignedVehicleId?: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  title: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  distance: number;
  status: TripStatus;
  notes?: string;
  passengerCount?: number;
  cargoWeight?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  status: MaintenanceStatus;
  reportedDate: string;
  completedDate?: string;
  technicianName: string;
  cost: number;
  parts?: string[];
  mileageAtService: number;
  notes?: string;
  createdAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string;
  date: string;
  fuelStation: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  efficiency?: number;
  tripId?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  type: ExpenseType;
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  amount: number;
  date: string;
  description: string;
  approvedBy?: string;
  receiptUrl?: string;
  createdAt: string;
}

// ─── Dashboard / Analytics ────────────────────────────────────────────────────

export interface KPIData {
  totalVehicles: number;
  availableVehicles: number;
  vehiclesOnTrip: number;
  vehiclesInShop: number;
  totalDrivers: number;
  availableDrivers: number;
  activeTrips: number;
  completedTripsThisMonth: number;
  totalExpensesThisMonth: number;
  fuelCostThisMonth: number;
  avgFuelEfficiency: number;
  maintenanceOpenCount: number;
  fleetUtilizationRate: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface CostBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface ChartData {
  fleetUtilization: ChartDataPoint[];
  fuelEfficiency: ChartDataPoint[];
  costBreakdown: CostBreakdownItem[];
  tripsPerMonth: ChartDataPoint[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
