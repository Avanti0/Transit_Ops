import { api } from './api';
import type { Vehicle, VehicleStatus } from '../types';

function mapBackendToFrontend(bv: any): Vehicle {
  const nameParts = (bv.name || '').split(' ');
  const make = nameParts[0] || 'Unknown';
  const model = nameParts.slice(1).join(' ') || 'Model';
  return {
    id: bv.id,
    registrationNumber: bv.registration_number,
    make: make,
    model: model,
    year: 2022,
    type: bv.vehicle_type as any,
    capacity: bv.max_load_capacity,
    status: bv.status,
    currentMileage: bv.odometer,
    lastServiceDate: new Date().toISOString().split('T')[0],
    nextServiceDue: bv.odometer + 5000,
    fuelType: 'Diesel',
    insuranceExpiry: new Date().toISOString().split('T')[0],
    permitExpiry: new Date().toISOString().split('T')[0],
    createdAt: bv.created_at || new Date().toISOString(),
  };
}

function mapFrontendToBackend(v: any) {
  return {
    registration_number: v.registrationNumber,
    name: `${v.make} ${v.model}`,
    vehicle_type: v.type,
    max_load_capacity: Number(v.capacity),
    odometer: Number(v.currentMileage),
    acquisition_cost: 25000.0,
    status: v.status,
    region: 'North',
  };
}

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const res = await api.get('/vehicles/');
    return res.data.map(mapBackendToFrontend);
  },

  async getById(id: string): Promise<Vehicle | null> {
    const res = await api.get(`/vehicles/${id}`);
    return mapBackendToFrontend(res.data);
  },

  async create(data: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
    const payload = mapFrontendToBackend(data);
    const res = await api.post('/vehicles/', payload);
    return mapBackendToFrontend(res.data);
  },

  async update(id: string, data: Partial<Omit<Vehicle, 'id' | 'createdAt'>>): Promise<Vehicle> {
    const existing = await api.get(`/vehicles/${id}`);
    const updatedPayload = {
      ...mapFrontendToBackend({ ...mapBackendToFrontend(existing.data), ...data }),
    };
    const res = await api.put(`/vehicles/${id}`, updatedPayload);
    return mapBackendToFrontend(res.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },

  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    return this.update(id, { status });
  },

  // Internal compatibility helpers
  _updateStatusSync(id: string, status: VehicleStatus): void {
    // No-op for compatibility as real backend handles state transitions
  },

  _getAll(): Vehicle[] {
    return [];
  },
};
