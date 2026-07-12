import { api } from './api';
import type { Expense, ExpenseType } from '../types';

function mapBackendToFrontend(be: any): Expense {
  let fType: any = 'Miscellaneous';
  if (be.expense_type === 'Toll') fType = 'Toll';
  else if (be.expense_type === 'Maintenance' || be.expense_type === 'Repair') fType = 'Maintenance';
  
  return {
    id: be.id,
    type: fType,
    vehicleId: be.vehicle_id,
    driverId: undefined,
    tripId: undefined,
    amount: be.amount,
    date: be.date,
    description: be.description || '',
    createdAt: be.created_at || new Date().toISOString(),
  };
}

function mapFrontendToBackend(e: any) {
  let bType = 'Other';
  if (e.type === 'Toll') bType = 'Toll';
  else if (e.type === 'Maintenance') bType = 'Maintenance';
  else if (e.type === 'Fuel') bType = 'Other';
  
  return {
    vehicle_id: e.vehicleId,
    expense_type: bType,
    amount: Number(e.amount || 0),
    description: e.description,
    date: e.date || new Date().toISOString().split('T')[0],
  };
}

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    const res = await api.get('/expenses/');
    const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
    return items.map(mapBackendToFrontend);
  },

  async getById(id: string): Promise<Expense | null> {
    const res = await api.get(`/expenses/${id}`);
    return mapBackendToFrontend(res.data);
  },

  async getByVehicle(vehicleId: string): Promise<Expense[]> {
    const all = await this.getAll();
    return all.filter((e) => e.vehicleId === vehicleId);
  },

  async getByType(type: ExpenseType): Promise<Expense[]> {
    const all = await this.getAll();
    return all.filter((e) => e.type === type);
  },

  async getByDateRange(from: string, to: string): Promise<Expense[]> {
    const all = await this.getAll();
    return all.filter((e) => e.date >= from && e.date <= to);
  },

  async create(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const payload = mapFrontendToBackend(data);
    const res = await api.post('/expenses/', payload);
    return mapBackendToFrontend(res.data);
  },

  async update(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense> {
    // Backend doesn't support a direct generic update, return existing details
    const res = await api.get(`/expenses/${id}`);
    return mapBackendToFrontend(res.data);
  },

  async delete(id: string): Promise<void> {
    // Delete is not supported explicitly by backend route, no-op
  },
};
