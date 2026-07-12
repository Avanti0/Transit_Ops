import api from './api';
import type { FuelLog } from '../types';

const mapFuelLog = (f: any): FuelLog => ({
  id: f.id,
  vehicleId: f.vehicle_id,
  driverId: '',
  date: f.date,
  fuelStation: '',
  liters: f.liters,
  pricePerLiter: f.liters > 0 ? f.cost / f.liters : 0,
  totalCost: f.cost,
  odometer: 0,
  createdAt: f.created_at,
});

export const fuelService = {
  async getAll(): Promise<FuelLog[]> {
    const res = await api.get('/fuel/');
    return res.data.items.map(mapFuelLog);
  },

  async getById(id: string): Promise<FuelLog | null> {
    const res = await api.get(`/fuel/${id}`);
    return mapFuelLog(res.data);
  },

  async getByVehicle(vehicleId: string): Promise<FuelLog[]> {
    const res = await api.get('/fuel/', { params: { vehicle_id: vehicleId } });
    return res.data.items.map(mapFuelLog);
  },

  async create(data: { vehicleId: string; liters: number; cost: number; date: string }): Promise<FuelLog> {
    const res = await api.post('/fuel/', {
      vehicle_id: data.vehicleId,
      liters: data.liters,
      cost: data.cost,
      date: data.date,
    });
    return mapFuelLog(res.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/fuel/${id}`);
  },
};
