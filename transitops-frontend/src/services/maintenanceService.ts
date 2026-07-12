import type { MaintenanceLog } from '../types';
import { mockMaintenanceLogs } from '../data/mockData';
import { vehicleService } from './vehicleService';

let logs: MaintenanceLog[] = [...mockMaintenanceLogs];

const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const maintenanceService = {
  async getAll(): Promise<MaintenanceLog[]> {
    await delay();
    return [...logs];
  },

  async getById(id: string): Promise<MaintenanceLog | null> {
    await delay();
    return logs.find((l) => l.id === id) ?? null;
  },

  async getByVehicle(vehicleId: string): Promise<MaintenanceLog[]> {
    await delay();
    return logs.filter((l) => l.vehicleId === vehicleId);
  },

  async create(data: Omit<MaintenanceLog, 'id' | 'createdAt'>): Promise<MaintenanceLog> {
    await delay();
    const newLog: MaintenanceLog = {
      ...data,
      id: `m${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    logs.push(newLog);
    return { ...newLog };
  },

  async update(
    id: string,
    data: Partial<Omit<MaintenanceLog, 'id' | 'createdAt'>>,
  ): Promise<MaintenanceLog> {
    await delay();
    const index = logs.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Maintenance log ${id} not found`);
    logs[index] = { ...logs[index], ...data };
    return { ...logs[index] };
  },

  async delete(id: string): Promise<void> {
    await delay();
    const index = logs.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Maintenance log ${id} not found`);
    logs.splice(index, 1);
  },

  async completeMaintenance(id: string): Promise<MaintenanceLog> {
    await delay();
    const index = logs.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Maintenance log ${id} not found`);
    const log = logs[index];
    if (log.status === 'Completed') throw new Error(`Maintenance ${id} is already completed`);

    logs[index] = {
      ...log,
      status: 'Completed',
      completedDate: new Date().toISOString().split('T')[0],
    };

    // Restore vehicle status to Available
    vehicleService._updateStatusSync(log.vehicleId, 'Available');

    return { ...logs[index] };
  },
};
