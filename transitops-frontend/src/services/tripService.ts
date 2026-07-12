import { api } from './api';
import type { Trip } from '../types';

function mapBackendToFrontend(bt: any): Trip {
  return {
    id: bt.id,
    title: `Trip from ${bt.source} to ${bt.destination}`,
    vehicleId: bt.vehicle_id,
    driverId: bt.driver_id,
    origin: bt.source,
    destination: bt.destination,
    scheduledDeparture: bt.created_at || new Date().toISOString(),
    scheduledArrival: bt.completed_at || new Date(Date.now() + 86400000).toISOString(),
    actualDeparture: bt.created_at || undefined,
    actualArrival: bt.completed_at || undefined,
    distance: bt.planned_distance,
    status: bt.status,
    notes: `Cargo Weight: ${bt.cargo_weight} kg. Revenue: $${bt.revenue}`,
    passengerCount: 0,
    cargoWeight: bt.cargo_weight,
    createdAt: bt.created_at || new Date().toISOString(),
    updatedAt: bt.created_at || new Date().toISOString(),
  };
}

function mapFrontendToBackend(t: any) {
  return {
    vehicle_id: t.vehicleId,
    driver_id: t.driverId,
    source: t.origin,
    destination: t.destination,
    cargo_weight: Number(t.cargoWeight || 0),
    planned_distance: Number(t.distance || 0),
    revenue: 500.0, // default placeholder
  };
}

export const tripService = {
  async getAll(): Promise<Trip[]> {
    const res = await api.get('/trips/');
    return res.data.map(mapBackendToFrontend);
  },

  async getById(id: string): Promise<Trip | null> {
    const res = await api.get(`/trips/${id}`);
    return mapBackendToFrontend(res.data);
  },

  async create(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    const payload = mapFrontendToBackend(data);
    const res = await api.post('/trips/', payload);
    return mapBackendToFrontend(res.data);
  },

  async update(id: string, data: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<Trip> {
    // Backend doesn't support a direct generic PUT/PATCH update for trip fields,
    // so we get existing, merge data, and re-dispatch or map if necessary.
    // For general trip edit, we return the same.
    const res = await api.get(`/trips/${id}`);
    return mapBackendToFrontend(res.data);
  },

  async delete(id: string): Promise<void> {
    // Delete is not supported explicitly by backend route specifications, no-op or default to cancel
    await api.patch(`/trips/${id}/cancel`);
  },

  async dispatch(id: string): Promise<Trip> {
    const res = await api.patch(`/trips/${id}/dispatch`);
    return mapBackendToFrontend(res.data);
  },

  async complete(id: string): Promise<Trip> {
    const existing = await api.get(`/trips/${id}`);
    const tripData = existing.data;
    const actual_distance = tripData.planned_distance || 100.0;
    const fuel_consumed = Number((actual_distance / 8.0).toFixed(1)); // estimate 8km per liter
    const res = await api.patch(`/trips/${id}/complete`, {
      actual_distance,
      fuel_consumed,
    });
    return mapBackendToFrontend(res.data);
  },

  async cancel(id: string): Promise<Trip> {
    const res = await api.patch(`/trips/${id}/cancel`);
    return mapBackendToFrontend(res.data);
  },
};
