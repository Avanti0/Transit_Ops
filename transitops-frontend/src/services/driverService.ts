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
  async getAll(): Promise<Driver[]> {
    const res = await api.get('/drivers/');
    return res.data.items.map(mapDriver);
  },

  async getById(id: string): Promise<Driver | null> {
    const res = await api.get(`/drivers/${id}`);
    return mapDriver(res.data);
  },

  async create(data: { name: string; licenseNumber: string; licenseCategory: string; licenseExpiry: string; contactNumber: string; safetyScore?: number }): Promise<Driver> {
    const res = await api.post('/drivers/', {
      name: data.name,
      license_number: data.licenseNumber,
      license_category: data.licenseCategory,
      license_expiry: data.licenseExpiry,
      contact_number: data.contactNumber,
      safety_score: data.safetyScore ?? 100.0,
    });
    return mapDriver(res.data);
  },

  async update(id: string, data: Partial<{ name: string; licenseNumber: string; licenseExpiry: string; contactNumber: string; status: DriverStatus; safetyScore: number }>): Promise<Driver> {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.licenseNumber) payload.license_number = data.licenseNumber;
    if (data.licenseExpiry) payload.license_expiry = data.licenseExpiry;
    if (data.contactNumber) payload.contact_number = data.contactNumber;
    if (data.status) payload.status = data.status;
    if (data.safetyScore !== undefined) payload.safety_score = data.safetyScore;
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
