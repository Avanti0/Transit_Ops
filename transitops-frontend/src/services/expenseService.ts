import type { Expense, ExpenseType } from '../types';
import { mockExpenses } from '../data/mockData';

let expenses: Expense[] = [...mockExpenses];

const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    await delay();
    return [...expenses];
  },

  async getById(id: string): Promise<Expense | null> {
    await delay();
    return expenses.find((e) => e.id === id) ?? null;
  },

  async getByVehicle(vehicleId: string): Promise<Expense[]> {
    await delay();
    return expenses.filter((e) => e.vehicleId === vehicleId);
  },

  async getByType(type: ExpenseType): Promise<Expense[]> {
    await delay();
    return expenses.filter((e) => e.type === type);
  },

  async getByDateRange(from: string, to: string): Promise<Expense[]> {
    await delay();
    return expenses.filter((e) => e.date >= from && e.date <= to);
  },

  async create(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    await delay();
    const newExpense: Expense = {
      ...data,
      id: `e${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    expenses.push(newExpense);
    return { ...newExpense };
  },

  async update(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense> {
    await delay();
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`Expense ${id} not found`);
    expenses[index] = { ...expenses[index], ...data };
    return { ...expenses[index] };
  },

  async delete(id: string): Promise<void> {
    await delay();
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) throw new Error(`Expense ${id} not found`);
    expenses.splice(index, 1);
  },
};
