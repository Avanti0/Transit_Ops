import api from './api';
import type { Expense } from '../types';

const mapExpense = (e: any): Expense => ({
  id: e.id,
  type: e.expense_type,
  vehicleId: e.vehicle_id,
  amount: e.amount,
  date: e.date,
  description: e.description ?? '',
  createdAt: e.created_at,
});

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    const res = await api.get('/expenses/');
    return res.data.items.map(mapExpense);
  },

  async getById(id: string): Promise<Expense | null> {
    const res = await api.get(`/expenses/${id}`);
    return mapExpense(res.data);
  },

  async getByVehicle(vehicleId: string): Promise<Expense[]> {
    const res = await api.get('/expenses/', { params: { vehicle_id: vehicleId } });
    return res.data.items.map(mapExpense);
  },

  async create(data: { vehicleId: string; expenseType: string; amount: number; description?: string; date: string }): Promise<Expense> {
    const res = await api.post('/expenses/', {
      vehicle_id: data.vehicleId,
      expense_type: data.expenseType,
      amount: data.amount,
      description: data.description,
      date: data.date,
    });
    return mapExpense(res.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
