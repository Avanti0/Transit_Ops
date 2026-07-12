import api from './api';
import type { KPIData, ChartData, ChartDataPoint, CostBreakdownItem } from '../types';
import { tripService } from './tripService';
import { expenseService } from './expenseService';
import { fuelService } from './fuelService';

const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dashboardService = {
  async getKPIs(): Promise<KPIData> {
    const res = await api.get('/dashboard/');
    const d = res.data;
    return {
      totalVehicles: d.totalVehicles,
      availableVehicles: d.availableVehicles,
      vehiclesOnTrip: d.activeVehicles,
      vehiclesInShop: d.vehiclesInMaintenance,
      totalDrivers: 0,
      availableDrivers: 0,
      activeTrips: d.activeTrips,
      completedTripsThisMonth: 0,
      totalExpensesThisMonth: d.operationalCost,
      fuelCostThisMonth: 0,
      avgFuelEfficiency: d.fuelEfficiency,
      maintenanceOpenCount: 0,
      fleetUtilizationRate: d.fleetUtilization,
    };
  },

  async getFleetUtilization(): Promise<ChartDataPoint[]> {
    await delay();
    // Simulated monthly fleet utilization % for the past 12 months
    const baseValues = [38, 42, 45, 50, 48, 55, 60, 58, 62, 57, 63, 65];
    const currentMonth = new Date().getMonth(); // 0-indexed
    return baseValues.map((val, i) => ({
      label: MONTHS[(currentMonth - 11 + i + 12) % 12],
      value: val,
    }));
  },

  async getFuelEfficiency(): Promise<ChartDataPoint[]> {
    await delay();
    // Simulated monthly average fuel efficiency (km/l)
    const baseValues = [6.2, 6.5, 6.3, 6.8, 7.0, 6.9, 7.1, 7.3, 7.0, 7.4, 7.2, 7.5];
    const currentMonth = new Date().getMonth();
    return baseValues.map((val, i) => ({
      label: MONTHS[(currentMonth - 11 + i + 12) % 12],
      value: val,
    }));
  },

  async getCostBreakdown(): Promise<CostBreakdownItem[]> {
    await delay();
    const expenses = await expenseService.getAll();

    const totals: Record<string, number> = {};
    for (const e of expenses) {
      totals[e.type] = (totals[e.type] ?? 0) + e.amount;
    }

    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

    return Object.entries(totals).map(([category, amount]) => ({
      category,
      amount,
      percentage: grandTotal > 0 ? parseFloat(((amount / grandTotal) * 100).toFixed(1)) : 0,
    }));
  },

  async getChartData(): Promise<ChartData> {
    const [fleetUtilization, fuelEfficiency, costBreakdown] = await Promise.all([
      dashboardService.getFleetUtilization(),
      dashboardService.getFuelEfficiency(),
      dashboardService.getCostBreakdown(),
    ]);

    const trips = await tripService.getAll();
    const currentMonth = new Date().getMonth();
    const tripsPerMonth: ChartDataPoint[] = MONTHS.map((_, i) => {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const count = trips.filter(
        (t) => t.status === 'Completed' && t.updatedAt.includes(`-${monthStr}-`),
      ).length;
      return { label: MONTHS[monthIndex], value: count };
    });

    return { fleetUtilization, fuelEfficiency, costBreakdown, tripsPerMonth };
  },
};
