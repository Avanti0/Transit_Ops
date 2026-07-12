import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Fuel, DollarSign, Truck, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AppLayout } from '../layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import api from '../services/api';
import { expenseService } from '../services/expenseService';
import { vehicleService } from '../services/vehicleService';
import { tripService } from '../services/tripService';
import type { CostBreakdownItem } from '../types';

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Backend response types ────────────────────────────────────────────────────
interface VehicleFuelEfficiency {
  vehicle_id: string;
  registration_number: string;
  name: string;
  fuel_efficiency: number;
}

interface VehicleROI {
  vehicle_id: string;
  registration_number: string;
  name: string;
  revenue: number;
  maintenance_cost: number;
  fuel_cost: number;
  acquisition_cost: number;
  roi_percentage: number;
}

interface DriverUtilization {
  driver_id: string;
  name: string;
  total_trips: number;
  total_distance: number;
  safety_score: number;
  status: string;
}

interface MonthlyCost {
  month: string; // "YYYY-MM"
  cost: number;
}

interface TripStats {
  total_trips: number;
  completed_trips: number;
  dispatched_trips: number;
  cancelled_trips: number;
  draft_trips: number;
  total_revenue: number;
  avg_revenue: number;
  total_actual_distance: number;
  total_planned_distance: number;
}

interface AnalyticsResponse {
  fleet_average_fuel_efficiency: number;
  vehicle_fuel_efficiencies: VehicleFuelEfficiency[];
  vehicle_rois: VehicleROI[];
  fleet_utilization_percentage: number;
  vehicle_usages: Array<{ vehicle_id: string; registration_number: string; name: string; total_trips: number; total_distance: number }>;
  driver_utilizations: DriverUtilization[];
  monthly_fuel_costs: MonthlyCost[];
  monthly_maintenance_costs: MonthlyCost[];
  trip_statistics: TripStats;
}

// ─── Helper components ─────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">{message}</div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  // For cost breakdown (from expenses) and vehicle status (from vehicles)
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownItem[]>([]);
  const [vehicleStatusData, setVehicleStatusData] = useState<{ name: string; value: number }[]>([]);
  const [tripsPerMonth, setTripsPerMonth] = useState<{ label: string; value: number }[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<{ month: string; fuel: number; maintenance: number; other: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [analyticsRes, expenses, vehicles, trips] = await Promise.all([
          api.get<AnalyticsResponse>('/analytics/'),
          expenseService.getAll(),
          vehicleService.getAll(),
          tripService.getAll(),
        ]);

        if (cancelled) return;

        setAnalytics(analyticsRes.data);

        // ── Cost Breakdown from expenses ────────────────────────────────────
        const totals: Record<string, number> = {};
        for (const e of expenses) {
          totals[e.type] = (totals[e.type] ?? 0) + e.amount;
        }
        const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
        setCostBreakdown(
          Object.entries(totals).map(([category, amount]) => ({
            category,
            amount,
            percentage: grandTotal > 0 ? parseFloat(((amount / grandTotal) * 100).toFixed(1)) : 0,
          })),
        );

        // ── Vehicle status distribution ─────────────────────────────────────
        const statusCounts: Record<string, number> = {};
        for (const v of vehicles) {
          statusCounts[v.status] = (statusCounts[v.status] ?? 0) + 1;
        }
        setVehicleStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

        // ── Trips per month (last 12 months, completed trips) ───────────────
        const now = new Date();
        const currentMonth = now.getMonth();
        const tripMonthData = Array.from({ length: 12 }, (_, i) => {
          const monthIndex = (currentMonth - 11 + i + 12) % 12;
          const year = now.getFullYear() - (monthIndex > currentMonth ? 1 : 0);
          const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
          const count = trips.filter(
            (t) => t.status === 'Completed' && (t.updatedAt ?? t.createdAt).startsWith(monthStr),
          ).length;
          return { label: MONTHS_SHORT[monthIndex], value: count };
        });
        setTripsPerMonth(tripMonthData);

        // ── Monthly expense breakdown (last 6 months) ───────────────────────
        const monthlyMap: Record<string, { fuel: number; maintenance: number; other: number }> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = MONTHS_SHORT[d.getMonth()];
          monthlyMap[key] = { fuel: 0, maintenance: 0, other: 0 };
        }
        for (const e of expenses) {
          const d = new Date(e.date);
          const key = MONTHS_SHORT[d.getMonth()];
          if (!monthlyMap[key]) continue;
          if (e.type === 'Fuel') monthlyMap[key].fuel += e.amount;
          else if (e.type === 'Maintenance') monthlyMap[key].maintenance += e.amount;
          else monthlyMap[key].other += e.amount;
        }
        setMonthlyExpenses(Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v })));
      } catch (err) {
        if (!cancelled) {
          console.error('Analytics load error:', err);
          toast.error('Failed to load analytics data. Please check your connection and try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 gap-3 text-slate-400 text-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading analytics…
        </div>
      </AppLayout>
    );
  }

  // Convert backend MonthlyCost "YYYY-MM" → short label for charts
  const fuelCostTrend = (analytics?.monthly_fuel_costs ?? []).slice(-12).map((m) => ({
    label: MONTHS_SHORT[parseInt(m.month.slice(5), 10) - 1],
    value: m.cost,
  }));

  const maintenanceCostTrend = (analytics?.monthly_maintenance_costs ?? []).slice(-12).map((m) => ({
    label: MONTHS_SHORT[parseInt(m.month.slice(5), 10) - 1],
    value: m.cost,
  }));

  // Top-5 vehicles by fuel efficiency
  const topVehicleEfficiency = [...(analytics?.vehicle_fuel_efficiencies ?? [])]
    .sort((a, b) => b.fuel_efficiency - a.fuel_efficiency)
    .slice(0, 5)
    .map((v) => ({ label: v.registration_number, value: v.fuel_efficiency }));

  // Vehicle ROI table data (top 5 by ROI)
  const topROI = [...(analytics?.vehicle_rois ?? [])].sort((a, b) => b.roi_percentage - a.roi_percentage).slice(0, 5);

  // Driver utilisation bar chart
  const driverBars = [...(analytics?.driver_utilizations ?? [])]
    .sort((a, b) => b.total_trips - a.total_trips)
    .slice(0, 8)
    .map((d) => ({ label: d.name.split(' ')[0], trips: d.total_trips, distance: Math.round(d.total_distance) }));

  const tripStats = analytics?.trip_statistics;
  const fleetUtil = analytics?.fleet_utilization_percentage ?? 0;
  const fleetAvgEff = analytics?.fleet_average_fuel_efficiency ?? 0;

  return (
    <AppLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">Visual overview of fleet performance and operational metrics</p>
      </div>

      {/* ── Summary KPI strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Fleet Utilization', value: `${fleetUtil}%`, color: 'text-blue-600' },
          { label: 'Avg Fuel Efficiency', value: `${fleetAvgEff} km/L`, color: 'text-green-600' },
          { label: 'Total Trips', value: tripStats?.total_trips ?? 0, color: 'text-slate-700' },
          { label: 'Total Revenue', value: `₹${(tripStats?.total_revenue ?? 0).toLocaleString('en-IN')}`, color: 'text-emerald-600' },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Row 1: Vehicle Status + Trips per Month ───────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={Truck} title="Vehicle Status Distribution" subtitle="Current status of all fleet vehicles" />
          </CardHeader>
          <CardContent>
            {vehicleStatusData.length === 0 ? (
              <EmptyChart message="No vehicle data available" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={vehicleStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {vehicleStatusData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={TrendingUp} title="Trips per Month" subtitle="Completed trips over the past 12 months" />
          </CardHeader>
          <CardContent>
            {tripsPerMonth.every((t) => t.value === 0) ? (
              <EmptyChart message="No completed trip data available" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tripsPerMonth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Trips" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Fuel Efficiency per Vehicle + Monthly Fuel Cost ─────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={Fuel} title="Top Vehicle Fuel Efficiency" subtitle="km/L for top-performing vehicles" />
          </CardHeader>
          <CardContent>
            {topVehicleEfficiency.length === 0 ? (
              <EmptyChart message="No fuel efficiency data — complete some trips first" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topVehicleEfficiency} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" km/L" domain={[0, 'auto']} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} width={72} />
                  <Tooltip formatter={(v: number) => [`${v} km/L`, 'Efficiency']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Fuel Efficiency" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={DollarSign} title="Monthly Fuel Cost Trend" subtitle="Total fuel expenditure per month" />
          </CardHeader>
          <CardContent>
            {fuelCostTrend.length === 0 ? (
              <EmptyChart message="No fuel cost data available" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={fuelCostTrend} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Fuel Cost']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#fuelGrad)" dot={{ r: 3 }} name="Fuel Cost" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Driver Utilization + Monthly Maintenance Cost ──────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={Users} title="Driver Utilization" subtitle="Completed trips per driver (top 8)" />
          </CardHeader>
          <CardContent>
            {driverBars.length === 0 ? (
              <EmptyChart message="No driver data available" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={driverBars} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="trips" name="Completed Trips" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={DollarSign} title="Monthly Maintenance Cost" subtitle="Total maintenance expenditure per month" />
          </CardHeader>
          <CardContent>
            {maintenanceCostTrend.length === 0 ? (
              <EmptyChart message="No maintenance cost data available" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={maintenanceCostTrend} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Maintenance Cost']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} name="Maintenance Cost" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Monthly Expense Stacked Bar + Cost Breakdown Pie ────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={DollarSign} title="Monthly Expense Breakdown" subtitle="Fuel, maintenance, and other costs by month (last 6)" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyExpenses} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="fuel" name="Fuel" stackId="a" fill="#3b82f6" />
                <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#f59e0b" />
                <Bar dataKey="other" name="Other" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={DollarSign} title="Overall Cost Breakdown" subtitle="Proportional split of all expenses by category" />
          </CardHeader>
          <CardContent>
            {costBreakdown.length === 0 ? (
              <EmptyChart message="No expense data available" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="45%"
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                    label={({ category, percentage }: { category: string; percentage: number }) => `${category} ${percentage}%`}
                  >
                    {costBreakdown.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Vehicle ROI table ──────────────────────────────────────────────── */}
      {topROI.length > 0 && (
        <Card className="shadow-sm mb-6">
          <CardHeader className="pb-2">
            <SectionTitle icon={TrendingUp} title="Vehicle ROI" subtitle="Return on investment per vehicle (revenue - costs) / acquisition cost" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-2 font-semibold text-slate-600">Reg. No.</th>
                    <th className="pb-2 font-semibold text-slate-600">Name</th>
                    <th className="pb-2 font-semibold text-slate-600 text-right">Revenue</th>
                    <th className="pb-2 font-semibold text-slate-600 text-right">Costs</th>
                    <th className="pb-2 font-semibold text-slate-600 text-right">ROI %</th>
                  </tr>
                </thead>
                <tbody>
                  {topROI.map((v) => (
                    <tr key={v.vehicle_id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 font-mono text-xs text-slate-700">{v.registration_number}</td>
                      <td className="py-2 text-slate-700">{v.name}</td>
                      <td className="py-2 text-right text-green-600">₹{v.revenue.toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right text-red-500">₹{(v.maintenance_cost + v.fuel_cost).toLocaleString('en-IN')}</td>
                      <td className={`py-2 text-right font-semibold ${v.roi_percentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {v.roi_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Trip Statistics ─────────────────────────────────────────────────── */}
      {tripStats && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={TrendingUp} title="Trip Statistics" subtitle="All-time aggregated trip performance" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Trips', value: tripStats.total_trips },
                { label: 'Completed', value: tripStats.completed_trips, color: 'text-green-600' },
                { label: 'Active', value: tripStats.dispatched_trips, color: 'text-blue-600' },
                { label: 'Cancelled', value: tripStats.cancelled_trips, color: 'text-red-500' },
                { label: 'Avg Revenue', value: `₹${tripStats.avg_revenue.toLocaleString('en-IN')}`, color: 'text-emerald-600' },
                { label: 'Total Distance', value: `${tripStats.total_actual_distance.toLocaleString('en-IN')} km` },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${s.color ?? 'text-slate-800'}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
