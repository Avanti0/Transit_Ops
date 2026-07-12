import type { FuelLog } from '../types';
import { mockFuelLogs } from '../data/mockData';

let fuelLogs: FuelLog[] = [...mockFuelLogs];

const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const fuelService = {
  async getAll(): Promise<FuelLog[]> {
    await delay();
    return [...fuelLogs];
  },

  async getById(id: string): Promise<FuelLog | null> {
    await delay();
    return fuelLogs.find((f) => f.id === id) ?? null;
  },

  async getByVehicle(vehicleId: string): Promise<FuelLog[]> {
    await delay();
    return fuelLogs.filter((f) => f.vehicleId === vehicleId);
  },

  async getByDriver(driverId: string): Promise<FuelLog[]> {
    await delay();
    return fuelLogs.filter((f) => f.driverId === driverId);
  },

  async create(data: Omit<FuelLog, 'id' | 'createdAt'>): Promise<FuelLog> {
    await delay();
    const newLog: FuelLog = {
      ...data,
      id: `f${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    fuelLogs.push(newLog);
    return { ...newLog };
  },

  async update(id: string, data: Partial<Omit<FuelLog, 'id' | 'createdAt'>>): Promise<FuelLog> {
    await delay();
    const index = fuelLogs.findIndex((f) => f.id === id);
    if (index === -1) throw new Error(`Fuel log ${id} not found`);
    fuelLogs[index] = { ...fuelLogs[index], ...data };
    return { ...fuelLogs[index] };
  },

  async delete(id: string): Promise<void> {
    await delay();
    const index = fuelLogs.findIndex((f) => f.id === id);
    if (index === -1) throw new Error(`Fuel log ${id} not found`);
    fuelLogs.splice(index, 1);
  },
};
