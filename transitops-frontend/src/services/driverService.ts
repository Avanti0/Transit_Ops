import { api } from './api';
import type { Driver, DriverStatus } from '../types';

function mapBackendToFrontend(bd: any): Driver {
  return {
    id: bd.id,
    name: bd.name,
    phone: bd.contact_number,
    email: `${bd.name.toLowerCase().replace(/\s+/g, '')}@transitops.com`,
    licenseNumber: bd.license_number,
    licenseExpiry: bd.license_expiry,
    status: bd.status,
    rating: Number((bd.safety_score / 20).toFixed(1)), // 0-100 rating to 0-5
    totalTrips: 0,
    joiningDate: bd.created_at ? bd.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    address: 'HQ Terminal',
    emergencyContact: '+1-555-0199',
    createdAt: bd.created_at || new Date().toISOString(),
  };
}

function mapFrontendToBackend(d: any) {
  return {
    name: d.name,
    contact_number: d.phone,
    license_number: d.licenseNumber,
    license_expiry: d.licenseExpiry,
    license_category: d.licenseCategory || 'CDL-A',
    safety_score: d.rating ? d.rating * 20 : 100.0,
    status: d.status,
  };
}

export const driverService = {
  async getAll(): Promise<Driver[]> {
    const res = await api.get('/drivers/');
    const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
    return items.map(mapBackendToFrontend);
  },

  async getById(id: string): Promise<Driver | null> {
    const res = await api.get(`/drivers/${id}`);
    return mapBackendToFrontend(res.data);
  },

  async create(data: Omit<Driver, 'id' | 'createdAt'>): Promise<Driver> {
    const payload = mapFrontendToBackend(data);
    const res = await api.post('/drivers/', payload);
    return mapBackendToFrontend(res.data);
  },

  async update(id: string, data: Partial<Omit<Driver, 'id' | 'createdAt'>>): Promise<Driver> {
    const existing = await api.get(`/drivers/${id}`);
    const updatedPayload = {
      ...mapFrontendToBackend({ ...mapBackendToFrontend(existing.data), ...data }),
    };
    const res = await api.put(`/drivers/${id}`, updatedPayload);
    return mapBackendToFrontend(res.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/drivers/${id}`);
  },

  async updateStatus(id: string, status: DriverStatus): Promise<Driver> {
    return this.update(id, { status });
  },

  // Internal compatibility helpers
  _updateStatusSync(id: string, status: DriverStatus): void {
    // No-op for compatibility as real backend handles state transitions
  },

  _getAll(): Driver[] {
    return [];
  },
};
