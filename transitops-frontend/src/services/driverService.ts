import type { Driver, DriverStatus } from '../types';
import { mockDrivers } from '../data/mockData';

let drivers: Driver[] = [...mockDrivers];

const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const driverService = {
  async getAll(): Promise<Driver[]> {
    await delay();
    return [...drivers];
  },

  async getById(id: string): Promise<Driver | null> {
    await delay();
    return drivers.find((d) => d.id === id) ?? null;
  },

  async create(data: Omit<Driver, 'id' | 'createdAt'>): Promise<Driver> {
    await delay();
    const newDriver: Driver = {
      ...data,
      id: `d${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    drivers.push(newDriver);
    return { ...newDriver };
  },

  async update(id: string, data: Partial<Omit<Driver, 'id' | 'createdAt'>>): Promise<Driver> {
    await delay();
    const index = drivers.findIndex((d) => d.id === id);
    if (index === -1) throw new Error(`Driver ${id} not found`);
    drivers[index] = { ...drivers[index], ...data };
    return { ...drivers[index] };
  },

  async delete(id: string): Promise<void> {
    await delay();
    const index = drivers.findIndex((d) => d.id === id);
    if (index === -1) throw new Error(`Driver ${id} not found`);
    drivers.splice(index, 1);
  },

  async updateStatus(id: string, status: DriverStatus): Promise<Driver> {
    return driverService.update(id, { status });
  },

  // Internal helper used by other services (no delay)
  _updateStatusSync(id: string, status: DriverStatus): void {
    const d = drivers.find((d) => d.id === id);
    if (d) d.status = status;
  },

  _getAll(): Driver[] {
    return drivers;
  },
};
