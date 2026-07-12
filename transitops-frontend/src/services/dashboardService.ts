import type { KPIData, ChartData, ChartDataPoint, CostBreakdownItem } from '../types';
import { vehicleService } from './vehicleService';
import { driverService } from './driverService';
import { tripService } from './tripService';
import { expenseService } from './expenseService';
import { fuelService } from './fuelService';

const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dashboardService = {
  async getKPIs(): Promise<KPIData> {
    await delay();

    const vehicles = vehicleService._getAll();
    const drivers = driverService._getAll();
    const trips = await tripService.getAll();
    const expenses = await expenseService.getAll();
    const fuelLogs = await fuelService.getAll();

    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const completedThisMonth = trips.filter(
      (t) => t.status === 'Completed' && t.updatedAt.startsWith(monthStr),
    ).length;

    const expensesThisMonth = expenses
      .filter((e) => e.date.startsWith(monthStr))
      .reduce((sum, e) => sum + e.amount, 0);

    const fuelCostThisMonth = expenses
      .filter((e) => e.type === 'Fuel' && e.date.startsWith(monthStr))
      .reduce((sum, e) => sum + e.amount, 0);

    const efficiencies = fuelLogs
      .filter((f) => f.efficiency != null && f.efficiency > 0)
      .map((f) => f.efficiency as number);
    const avgFuelEfficiency =
      efficiencies.length > 0
        ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length
        : 0;

    const availableVehicles = vehicles.filter((v) => v.status === 'Available').length;
    const vehiclesOnTrip = vehicles.filter((v) => v.status === 'On Trip').length;
    const vehiclesInShop = vehicles.filter((v) => v.status === 'In Shop').length;
    const activeVehicles = vehicles.filter((v) => v.status !== 'Retired').length;
    const fleetUtilizationRate =
      activeVehicles > 0 ? Math.round((vehiclesOnTrip / activeVehicles) * 100) : 0;

    return {
      totalVehicles: vehicles.length,
      availableVehicles,
      vehiclesOnTrip,
      vehiclesInShop,
      totalDrivers: drivers.length,
      availableDrivers: drivers.filter((d) => d.status === 'Available').length,
      activeTrips: trips.filter((t) => t.status === 'Dispatched').length,
      completedTripsThisMonth: completedThisMonth,
      totalExpensesThisMonth: expensesThisMonth,
      fuelCostThisMonth,
      avgFuelEfficiency: parseFloat(avgFuelEfficiency.toFixed(2)),
      maintenanceOpenCount: 0, // resolved lazily via maintenanceService if needed
      fleetUtilizationRate,
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
