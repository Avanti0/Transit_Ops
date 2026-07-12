import api from './api';
import type { MaintenanceLog, MaintenanceStatus } from '../types';

const mapMaintenance = (m: any): MaintenanceLog => ({
  id: m.id,
  vehicleId: m.vehicle_id,
  type: m.maintenance_type as any,
  description: m.description ?? m.issue,
  status: (m.status === 'Active' ? 'Open' : m.status === 'Completed' ? 'Completed' : m.status) as MaintenanceStatus,
  reportedDate: m.start_date,
  completedDate: m.end_date ?? undefined,
  technicianName: '',
  cost: m.cost,
  mileageAtService: 0,
  notes: m.issue,
  createdAt: m.created_at,
});

export const maintenanceService = {
  async getAll(): Promise<MaintenanceLog[]> {
    const res = await api.get('/maintenance/');
    return res.data.items.map(mapMaintenance);
  },

  async getById(id: string): Promise<MaintenanceLog | null> {
    const res = await api.get(`/maintenance/${id}`);
    return mapMaintenance(res.data);
  },

  async getByVehicle(vehicleId: string): Promise<MaintenanceLog[]> {
    const res = await api.get('/maintenance/', { params: { vehicle_id: vehicleId } });
    return res.data.items.map(mapMaintenance);
  },

  async create(data: any): Promise<MaintenanceLog> {
    const res = await api.post('/maintenance/', {
      vehicle_id: data.vehicleId,
      maintenance_type: data.maintenanceType ?? data.type ?? 'Routine',
      issue: data.issue ?? data.description ?? 'General maintenance',
      description: data.description,
      cost: data.cost ?? 0,
      start_date: data.startDate ?? data.reportedDate ?? new Date().toISOString().split('T')[0],
    });
    return mapMaintenance(res.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/maintenance/${id}`);
  },

  async completeMaintenance(id: string, endDate?: string, cost?: number): Promise<MaintenanceLog> {
    const res = await api.patch(`/maintenance/${id}/close`, {
      end_date: endDate ?? new Date().toISOString().split('T')[0],
      cost,
    });
    return mapMaintenance(res.data);
  },
};
