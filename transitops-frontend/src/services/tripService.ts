import type { Trip } from '../types';
import { mockTrips } from '../data/mockData';
import { vehicleService } from './vehicleService';
import { driverService } from './driverService';

let trips: Trip[] = [...mockTrips];

const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const tripService = {
  async getAll(): Promise<Trip[]> {
    await delay();
    return [...trips];
  },

  async getById(id: string): Promise<Trip | null> {
    await delay();
    return trips.find((t) => t.id === id) ?? null;
  },

  async create(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    await delay();
    const now = new Date().toISOString();
    const newTrip: Trip = {
      ...data,
      id: `t${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    trips.push(newTrip);
    return { ...newTrip };
  },

  async update(id: string, data: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<Trip> {
    await delay();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Trip ${id} not found`);
    trips[index] = { ...trips[index], ...data, updatedAt: new Date().toISOString() };
    return { ...trips[index] };
  },

  async delete(id: string): Promise<void> {
    await delay();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Trip ${id} not found`);
    trips.splice(index, 1);
  },

  async dispatch(id: string): Promise<Trip> {
    await delay();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Trip ${id} not found`);
    const trip = trips[index];
    if (trip.status !== 'Draft') throw new Error(`Trip must be in Draft status to dispatch`);

    // Update vehicle and driver status to 'On Trip'
    vehicleService._updateStatusSync(trip.vehicleId, 'On Trip');
    driverService._updateStatusSync(trip.driverId, 'On Trip');

    trips[index] = {
      ...trip,
      status: 'Dispatched',
      actualDeparture: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { ...trips[index] };
  },

  async complete(id: string): Promise<Trip> {
    await delay();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Trip ${id} not found`);
    const trip = trips[index];
    if (trip.status !== 'Dispatched') throw new Error(`Trip must be Dispatched to complete`);

    // Restore vehicle and driver to 'Available'
    vehicleService._updateStatusSync(trip.vehicleId, 'Available');
    driverService._updateStatusSync(trip.driverId, 'Available');

    trips[index] = {
      ...trip,
      status: 'Completed',
      actualArrival: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { ...trips[index] };
  },

  async cancel(id: string): Promise<Trip> {
    await delay();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Trip ${id} not found`);
    const trip = trips[index];
    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      throw new Error(`Trip is already ${trip.status}`);
    }

    // If it was dispatched, restore vehicle and driver
    if (trip.status === 'Dispatched') {
      vehicleService._updateStatusSync(trip.vehicleId, 'Available');
      driverService._updateStatusSync(trip.driverId, 'Available');
    }

    trips[index] = {
      ...trip,
      status: 'Cancelled',
      updatedAt: new Date().toISOString(),
    };
    return { ...trips[index] };
  },
};
