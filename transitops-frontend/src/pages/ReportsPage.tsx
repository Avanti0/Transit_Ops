import React, { useEffect, useState } from 'react';
import { Download, BarChart3, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { AppLayout } from '../layouts/AppLayout';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { StatusBadge } from '../components/StatusBadge';
import { vehicleService } from '../services/vehicleService';
import { tripService } from '../services/tripService';
import { fuelService } from '../services/fuelService';
import { expenseService } from '../services/expenseService';
import { maintenanceService } from '../services/maintenanceService';
import { api } from '../services/api';
import type { Vehicle, Trip, FuelLog, Expense, MaintenanceLog } from '../types';

// ─── Report row types ─────────────────────────────────────────────────────────

interface FleetUtilizationRow {
  vehicleId: string;
  regNumber: string;
  makeModel: string;
  status: string;
  completedTrips: number;
  totalDistance: number;
  utilizationRate: string;
}

interface FuelEfficiencyRow {
  vehicleId: string;
  regNumber: string;
  makeModel: string;
  fuelType: string;
  totalLiters: number;
  totalFuelCost: number;
  avgEfficiency: string;
}

interface OperationalCostRow {
  vehicleId: string;
  regNumber: string;
  makeModel: string;
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  totalCost: number;
}

interface VehicleROIRow {
  vehicleId: string;
  regNumber: string;
  makeModel: string;
  revenue: number;
  costs: number;
  acquisitionCost: number;
  roi: string;
}

type ReportType = 'fleet-utilization' | 'fuel-efficiency' | 'operational-cost' | 'vehicle-roi';

const REPORT_OPTIONS: { value: ReportType; label: string; icon: React.ElementType }[] = [
  { value: 'fleet-utilization', label: 'Fleet Utilization', icon: Percent },
  { value: 'fuel-efficiency', label: 'Fuel Efficiency', icon: TrendingUp },
  { value: 'operational-cost', label: 'Operational Cost', icon: DollarSign },
  { value: 'vehicle-roi', label: 'Vehicle ROI', icon: BarChart3 },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('fleet-utilization');
  const [loading, setLoading] = useState(true);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [v, t, f, e, m] = await Promise.all([
          vehicleService.getAll(),
          tripService.getAll(),
          fuelService.getAll(),
          expenseService.getAll(),
          maintenanceService.getAll(),
        ]);
        setVehicles(v);
        setTrips(t);
        setFuelLogs(f);
        setExpenses(e);
        setMaintenanceLogs(m);
      } catch {
        toast.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Build fleet utilization report ──────────────────────────────────────

  const fleetUtilizationData: FleetUtilizationRow[] = vehicles.map((v) => {
    const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === 'Completed');
    const totalDistance = vTrips.reduce((s, t) => s + t.distance, 0);
    const activeVehicles = vehicles.filter((x) => x.status !== 'Retired').length;
    const utilizationRate = activeVehicles > 0 && v.status !== 'Retired'
      ? ((vTrips.length / Math.max(trips.filter((t) => t.status === 'Completed').length, 1)) * 100).toFixed(1)
      : '0.0';
    return {
      vehicleId: v.id,
      regNumber: v.registrationNumber,
      makeModel: `${v.make} ${v.model}`,
      status: v.status,
      completedTrips: vTrips.length,
      totalDistance,
      utilizationRate,
    };
  });

  // ─── Build fuel efficiency report ─────────────────────────────────────────

  const fuelEfficiencyData: FuelEfficiencyRow[] = vehicles.map((v) => {
    const vFuel = fuelLogs.filter((f) => f.vehicleId === v.id);
    const totalLiters = vFuel.reduce((s, f) => s + f.liters, 0);
    const totalFuelCost = vFuel.reduce((s, f) => s + f.totalCost, 0);
    const efficiencies = vFuel.filter((f) => f.efficiency && f.efficiency > 0).map((f) => f.efficiency as number);
    const avgEfficiency = efficiencies.length
      ? (efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length).toFixed(2)
      : '—';
    return {
      vehicleId: v.id,
      regNumber: v.registrationNumber,
      makeModel: `${v.make} ${v.model}`,
      fuelType: v.fuelType,
      totalLiters,
      totalFuelCost,
      avgEfficiency,
    };
  });

  // ─── Build operational cost report ────────────────────────────────────────

  const operationalCostData: OperationalCostRow[] = vehicles.map((v) => {
    const fuelCost = expenses.filter((e) => e.vehicleId === v.id && e.type === 'Fuel').reduce((s, e) => s + e.amount, 0);
    const maintenanceCost = expenses.filter((e) => e.vehicleId === v.id && e.type === 'Maintenance').reduce((s, e) => s + e.amount, 0);
    const otherCost = expenses.filter((e) => e.vehicleId === v.id && e.type !== 'Fuel' && e.type !== 'Maintenance').reduce((s, e) => s + e.amount, 0);
    return {
      vehicleId: v.id,
      regNumber: v.registrationNumber,
      makeModel: `${v.make} ${v.model}`,
      fuelCost,
      maintenanceCost,
      otherCost,
      totalCost: fuelCost + maintenanceCost + otherCost,
    };
  });

  // ─── Build vehicle ROI report ──────────────────────────────────────────────

  const vehicleROIData: VehicleROIRow[] = vehicles.map((v) => {
    const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === 'Completed');
    // Simulated revenue: ₹50 per km for buses/vans, ₹80 for trucks, ₹120 for cars
    const ratePerKm = v.type === 'Truck' ? 80 : v.type === 'Car' ? 120 : 50;
    const revenue = vTrips.reduce((s, t) => s + t.distance * ratePerKm, 0);
    const costs = operationalCostData.find((r) => r.vehicleId === v.id)?.totalCost ?? 0;
    // Simulated acquisition cost
    const acquisitionCost = v.type === 'Bus' ? 3500000 : v.type === 'Truck' ? 2000000 : v.type === 'Van' ? 1200000 : 1500000;
    const roi = acquisitionCost > 0 ? (((revenue - costs) / acquisitionCost) * 100).toFixed(2) : '0.00';
    return {
      vehicleId: v.id,
      regNumber: v.registrationNumber,
      makeModel: `${v.make} ${v.model}`,
      revenue,
      costs,
      acquisitionCost,
      roi,
    };
  });

  // ─── CSV Export ────────────────────────────────────────────────────────────

  const handleExport = async () => {
    let dataset = 'vehicles';
    if (reportType === 'fleet-utilization') dataset = 'vehicles';
    else if (reportType === 'fuel-efficiency') dataset = 'fuel';
    else if (reportType === 'operational-cost') dataset = 'expenses';
    else if (reportType === 'vehicle-roi') dataset = 'trips';

    try {
      const res = await api.get(`/reports/csv?dataset=${dataset}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${dataset} report from server`);
    } catch {
      toast.error('Failed to download report from server');
    }
  };

  const currentReport = REPORT_OPTIONS.find((r) => r.value === reportType);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">Operational reports with CSV export</p>
        </div>
        <div className="flex gap-2">
          <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" size="default">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            {currentReport && React.createElement(currentReport.icon, { className: 'h-5 w-5 text-blue-600' })}
            {currentReport?.label} Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Building report…</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Fleet Utilization */}
              {reportType === 'fleet-utilization' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Make / Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Completed Trips</TableHead>
                      <TableHead className="text-right">Total Distance</TableHead>
                      <TableHead className="text-right">Utilization %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fleetUtilizationData.map((row) => (
                      <TableRow key={row.vehicleId} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{row.regNumber}</TableCell>
                        <TableCell>{row.makeModel}</TableCell>
                        <TableCell><StatusBadge status={row.status} /></TableCell>
                        <TableCell className="text-right">{row.completedTrips}</TableCell>
                        <TableCell className="text-right">{row.totalDistance.toLocaleString()} km</TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">{row.utilizationRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Fuel Efficiency */}
              {reportType === 'fuel-efficiency' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Make / Model</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead className="text-right">Total Liters</TableHead>
                      <TableHead className="text-right">Fuel Cost (₹)</TableHead>
                      <TableHead className="text-right">Avg km/L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelEfficiencyData.map((row) => (
                      <TableRow key={row.vehicleId} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{row.regNumber}</TableCell>
                        <TableCell>{row.makeModel}</TableCell>
                        <TableCell>{row.fuelType}</TableCell>
                        <TableCell className="text-right">{row.totalLiters} L</TableCell>
                        <TableCell className="text-right">₹{row.totalFuelCost.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">{row.avgEfficiency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Operational Cost */}
              {reportType === 'operational-cost' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Make / Model</TableHead>
                      <TableHead className="text-right">Fuel (₹)</TableHead>
                      <TableHead className="text-right">Maintenance (₹)</TableHead>
                      <TableHead className="text-right">Other (₹)</TableHead>
                      <TableHead className="text-right">Total (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operationalCostData.map((row) => (
                      <TableRow key={row.vehicleId} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{row.regNumber}</TableCell>
                        <TableCell>{row.makeModel}</TableCell>
                        <TableCell className="text-right">₹{row.fuelCost.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{row.maintenanceCost.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{row.otherCost.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-slate-800">₹{row.totalCost.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-50 font-semibold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">₹{operationalCostData.reduce((s, r) => s + r.fuelCost, 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{operationalCostData.reduce((s, r) => s + r.maintenanceCost, 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{operationalCostData.reduce((s, r) => s + r.otherCost, 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-blue-700">₹{operationalCostData.reduce((s, r) => s + r.totalCost, 0).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}

              {/* Vehicle ROI */}
              {reportType === 'vehicle-roi' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Make / Model</TableHead>
                      <TableHead className="text-right">Revenue (₹)</TableHead>
                      <TableHead className="text-right">Costs (₹)</TableHead>
                      <TableHead className="text-right">Acquisition (₹)</TableHead>
                      <TableHead className="text-right">ROI %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleROIData.map((row) => {
                      const roiNum = parseFloat(row.roi);
                      return (
                        <TableRow key={row.vehicleId} className="hover:bg-slate-50">
                          <TableCell className="font-medium">{row.regNumber}</TableCell>
                          <TableCell>{row.makeModel}</TableCell>
                          <TableCell className="text-right text-emerald-700">₹{row.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-red-600">₹{row.costs.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-slate-600">₹{row.acquisitionCost.toLocaleString()}</TableCell>
                          <TableCell className={`text-right font-bold ${roiNum >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {row.roi}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
