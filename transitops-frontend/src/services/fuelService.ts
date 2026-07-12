import { api } from './api';
import type { FuelLog } from '../types';

function mapBackendToFrontend(bf: any): FuelLog {
  return {
    id: bf.id,
    vehicleId: bf.vehicle_id,
    driverId: 'default-driver',
    date: bf.date,
    fuelStation: 'City Fuel Stop',
    liters: bf.liters,
    pricePerLiter: Number((bf.cost / bf.liters).toFixed(2)),
    totalCost: bf.cost,
    odometer: 0,
    createdAt: bf.created_at || new Date().toISOString(),
  };
}

function mapFrontendToBackend(f: any) {
  return {
    vehicle_id: f.vehicleId,
    liters: Number(f.liters || 0),
    cost: Number(f.totalCost || 0),
    date: f.date || new Date().toISOString().split('T')[0],
  };
}

export const fuelService = {
  async getAll(): Promise<FuelLog[]> {
    const res = await api.get('/fuel/');
    const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
    return items.map(mapBackendToFrontend);
  },

  async getById(id: string): Promise<FuelLog | null> {
    const res = await api.get(`/fuel/${id}`);
    return mapBackendToFrontend(res.data);
  },

  async getByVehicle(vehicleId: string): Promise<FuelLog[]> {
    const all = await this.getAll();
    return all.filter((f) => f.vehicleId === vehicleId);
  },

  async getByDriver(driverId: string): Promise<FuelLog[]> {
    const all = await this.getAll();
    return all.filter((f) => f.driverId === driverId);
  },

  async create(data: Omit<FuelLog, 'id' | 'createdAt'>): Promise<FuelLog> {
    const payload = mapFrontendToBackend(data);
    const res = await api.post('/fuel/', payload);
    return mapBackendToFrontend(res.data);
  },

  async update(id: string, data: Partial<Omit<FuelLog, 'id' | 'createdAt'>>): Promise<FuelLog> {
    // Backend doesn't support a direct generic update, return existing details
    const res = await api.get(`/fuel/${id}`);
    return mapBackendToFrontend(res.data);
  },

  async delete(id: string): Promise<void> {
    // Delete is not supported explicitly by backend route, no-op
  },
};
