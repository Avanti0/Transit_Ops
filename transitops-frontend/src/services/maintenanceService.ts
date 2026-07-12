import { api } from './api';
import type { MaintenanceLog } from '../types';

function mapBackendToFrontend(bm: any): MaintenanceLog {
  return {
    id: bm.id,
    vehicleId: bm.vehicle_id,
    type: bm.maintenance_type as any,
    description: bm.description || bm.issue || '',
    status: bm.status === 'Active' ? 'In Progress' : 'Completed',
    reportedDate: bm.start_date,
    completedDate: bm.end_date || undefined,
    technicianName: 'Internal Staff',
    cost: bm.cost,
    createdAt: bm.created_at || new Date().toISOString(),
    mileageAtService: 0,
  };
}

function mapFrontendToBackend(m: any) {
  return {
    vehicle_id: m.vehicleId,
    maintenance_type: m.type,
    issue: m.description ? m.description.slice(0, 100) : 'Standard Maintenance',
    description: m.description,
    cost: Number(m.cost || 0),
    start_date: m.reportedDate || new Date().toISOString().split('T')[0],
    end_date: m.completedDate || null,
  };
}

export const maintenanceService = {
  async getAll(): Promise<MaintenanceLog[]> {
    const res = await api.get('/maintenance/');
    const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
    return items.map(mapBackendToFrontend);
  },

  async getById(id: string): Promise<MaintenanceLog | null> {
    const res = await api.get(`/maintenance/${id}`);
    return mapBackendToFrontend(res.data);
  },

  async getByVehicle(vehicleId: string): Promise<MaintenanceLog[]> {
    const all = await this.getAll();
    return all.filter((l) => l.vehicleId === vehicleId);
  },

  async create(data: Omit<MaintenanceLog, 'id' | 'createdAt'>): Promise<MaintenanceLog> {
    const payload = mapFrontendToBackend(data);
    const res = await api.post('/maintenance/', payload);
    return mapBackendToFrontend(res.data);
  },

  async update(
    id: string,
    data: Partial<Omit<MaintenanceLog, 'id' | 'createdAt'>>,
  ): Promise<MaintenanceLog> {
    const existing = await api.get(`/maintenance/${id}`);
    const updatedPayload = {
      ...mapFrontendToBackend({ ...mapBackendToFrontend(existing.data), ...data }),
    };
    // Close or fallback
    const res = await api.patch(`/maintenance/${id}/close`, {
      end_date: updatedPayload.end_date || new Date().toISOString().split('T')[0],
      cost: updatedPayload.cost,
      description: updatedPayload.description,
    });
    return mapBackendToFrontend(res.data);
  },

  async delete(id: string): Promise<void> {
    // Delete is not supported explicitly by backend route, no-op or complete it
    await api.patch(`/maintenance/${id}/close`, {
      end_date: new Date().toISOString().split('T')[0],
    });
  },

  async completeMaintenance(id: string): Promise<MaintenanceLog> {
    const existing = await api.get(`/maintenance/${id}`);
    const res = await api.patch(`/maintenance/${id}/close`, {
      end_date: new Date().toISOString().split('T')[0],
      cost: existing.data.cost,
      description: existing.data.description,
    });
    return mapBackendToFrontend(res.data);
  },
};
