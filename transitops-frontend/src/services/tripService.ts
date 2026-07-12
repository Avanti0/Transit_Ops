import api from './api';
import type { Trip, TripStatus } from '../types';

const mapTrip = (t: any): Trip => ({
  id: t.id,
  title: `${t.source} → ${t.destination}`,
  vehicleId: t.vehicle_id,
  driverId: t.driver_id,
  origin: t.source,
  destination: t.destination,
  scheduledDeparture: t.created_at,
  scheduledArrival: t.completed_at ?? '',
  actualDeparture: t.status === 'Dispatched' || t.status === 'Completed' ? t.created_at : undefined,
  actualArrival: t.completed_at ?? undefined,
  distance: t.actual_distance ?? t.planned_distance,
  status: t.status as TripStatus,
  cargoWeight: t.cargo_weight,
  createdAt: t.created_at,
  updatedAt: t.completed_at ?? t.created_at,
});

export const tripService = {
  async getAll(): Promise<Trip[]> {
    const res = await api.get('/trips/');
    return res.data.map(mapTrip);
  },

  async getById(id: string): Promise<Trip | null> {
    const res = await api.get(`/trips/${id}`);
    return mapTrip(res.data);
  },

  async create(data: any): Promise<Trip> {
    const res = await api.post('/trips/', {
      vehicle_id: data.vehicleId,
      driver_id: data.driverId,
      source: data.source ?? data.origin,
      destination: data.destination,
      cargo_weight: data.cargoWeight ?? data.cargo_weight ?? 0,
      planned_distance: data.plannedDistance ?? data.distance ?? 0,
      revenue: data.revenue ?? 0,
    });
    return mapTrip(res.data);
  },

  async dispatch(id: string): Promise<Trip> {
    const res = await api.patch(`/trips/${id}/dispatch`);
    return mapTrip(res.data);
  },

  async complete(id: string, actualDistance: number, fuelConsumed: number): Promise<Trip> {
    const res = await api.patch(`/trips/${id}/complete`, {
      actual_distance: actualDistance,
      fuel_consumed: fuelConsumed,
    });
    return mapTrip(res.data);
  },

  async cancel(id: string): Promise<Trip> {
    const res = await api.patch(`/trips/${id}/cancel`);
    return mapTrip(res.data);
  },
};
