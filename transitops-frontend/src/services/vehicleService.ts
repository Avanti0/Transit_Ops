import api from './api';
import type { Vehicle, VehicleStatus } from '../types';

// Map backend snake_case to frontend camelCase
const mapVehicle = (v: any): Vehicle => ({
  id: v.id,
  registrationNumber: v.registration_number,
  make: v.name,
  model: v.vehicle_type,
  year: new Date(v.created_at).getFullYear(),
  type: v.vehicle_type,
  capacity: v.max_load_capacity,
  status: v.status as VehicleStatus,
  currentMileage: v.odometer,
  lastServiceDate: v.created_at,
  nextServiceDue: v.odometer + 5000,
  fuelType: 'Diesel',
  insuranceExpiry: '',
  permitExpiry: '',
  createdAt: v.created_at,
});

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const res = await api.get('/vehicles/');
    return res.data.map(mapVehicle);
  },

  async getById(id: string): Promise<Vehicle | null> {
    const res = await api.get(`/vehicles/${id}`);
    return mapVehicle(res.data);
  },

  async create(data: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
    const payload = {
      registration_number: data.registrationNumber,
      name: data.make,
      vehicle_type: data.type,
      max_load_capacity: data.capacity,
      odometer: data.currentMileage ?? 0,
      acquisition_cost: 0,
      region: null,
    };
    const res = await api.post('/vehicles/', payload);
    return mapVehicle(res.data);
  },

  async update(id: string, data: Partial<Omit<Vehicle, 'id' | 'createdAt'>>): Promise<Vehicle> {
    const payload: any = {};
    if (data.registrationNumber) payload.registration_number = data.registrationNumber;
    if (data.make) payload.name = data.make;
    if (data.type) payload.vehicle_type = data.type;
    if (data.capacity) payload.max_load_capacity = data.capacity;
    if (data.currentMileage !== undefined) payload.odometer = data.currentMileage;
    if (data.status) payload.status = data.status;
    const res = await api.put(`/vehicles/${id}`, payload);
    return mapVehicle(res.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },

  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    return vehicleService.update(id, { status });
  },
};
