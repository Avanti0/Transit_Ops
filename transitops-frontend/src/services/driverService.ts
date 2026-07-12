import api from './api';
import type { Driver, DriverStatus } from '../types';

const mapDriver = (d: any): Driver => ({
  id: d.id,
  name: d.name,
  phone: d.contact_number,
  email: '',
  licenseNumber: d.license_number,
  licenseExpiry: d.license_expiry,
  status: d.status as DriverStatus,
  rating: d.safety_score,
  totalTrips: 0,
  joiningDate: d.created_at,
  address: '',
  emergencyContact: '',
  createdAt: d.created_at,
});

export const driverService = {
  async getMe(): Promise<Driver | null> {
    try {
      const res = await api.get('/drivers/me');
      return mapDriver(res.data);
    } catch {
      return null;
    }
  },

  async getAll(): Promise<Driver[]> {
    const res = await api.get('/drivers/');
    return res.data.items.map(mapDriver);
  },

  async getById(id: string): Promise<Driver | null> {
    const res = await api.get(`/drivers/${id}`);
    return mapDriver(res.data);
  },

  async create(data: any): Promise<Driver> {
    const res = await api.post('/drivers/', {
      name: data.name,
      license_number: data.licenseNumber,
      license_category: data.licenseCategory || 'B',
      license_expiry: data.licenseExpiry,
      contact_number: data.contactNumber || data.phone || '00000',
      safety_score: data.safetyScore ?? data.rating ?? 100.0,
    });
    return mapDriver(res.data);
  },

  async update(id: string, data: any): Promise<Driver> {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.licenseNumber) payload.license_number = data.licenseNumber;
    if (data.licenseExpiry) payload.license_expiry = data.licenseExpiry;
    if (data.contactNumber || data.phone) payload.contact_number = data.contactNumber || data.phone;
    if (data.status) payload.status = data.status;
    if (data.safetyScore !== undefined) payload.safety_score = data.safetyScore;
    if (data.rating !== undefined) payload.safety_score = data.rating;
    const res = await api.put(`/drivers/${id}`, payload);
    return mapDriver(res.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/drivers/${id}`);
  },

  async updateStatus(id: string, status: DriverStatus): Promise<Driver> {
    return driverService.update(id, { status });
  },
};
