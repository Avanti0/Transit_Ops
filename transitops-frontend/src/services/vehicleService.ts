import type { Vehicle, VehicleStatus } from '../types';
import { mockVehicles } from '../data/mockData';

// In-memory store seeded from mock data
let vehicles: Vehicle[] = [...mockVehicles];

const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    await delay();
    return [...vehicles];
  },

  async getById(id: string): Promise<Vehicle | null> {
    await delay();
    return vehicles.find((v) => v.id === id) ?? null;
  },

  async create(data: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
    await delay();
    const newVehicle: Vehicle = {
      ...data,
      id: `v${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    vehicles.push(newVehicle);
    return { ...newVehicle };
  },

  async update(id: string, data: Partial<Omit<Vehicle, 'id' | 'createdAt'>>): Promise<Vehicle> {
    await delay();
    const index = vehicles.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Vehicle ${id} not found`);
    vehicles[index] = { ...vehicles[index], ...data };
    return { ...vehicles[index] };
  },

  async delete(id: string): Promise<void> {
    await delay();
    const index = vehicles.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Vehicle ${id} not found`);
    vehicles.splice(index, 1);
  },

  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    return vehicleService.update(id, { status });
  },

  // Internal helper used by other services (no delay)
  _updateStatusSync(id: string, status: VehicleStatus): void {
    const v = vehicles.find((v) => v.id === id);
    if (v) v.status = status;
  },

  _getAll(): Vehicle[] {
    return vehicles;
  },
};
