import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Fuel, DollarSign, Truck } from 'lucide-react';
import { toast } from 'sonner';

import { AppLayout } from '../layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { dashboardService } from '../services/dashboardService';
import { expenseService } from '../services/expenseService';
import { vehicleService } from '../services/vehicleService';
import { tripService } from '../services/tripService';
import type { ChartDataPoint, CostBreakdownItem } from '../types';

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [fleetUtilization, setFleetUtilization] = useState<ChartDataPoint[]>([]);
  const [fuelEfficiency, setFuelEfficiency] = useState<ChartDataPoint[]>([]);
  const [tripsPerMonth, setTripsPerMonth] = useState<ChartDataPoint[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownItem[]>([]);
  const [vehicleStatusData, setVehicleStatusData] = useState<{ name: string; value: number }[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<{ month: string; fuel: number; maintenance: number; other: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [chartData, expenses, vehicles] = await Promise.all([
          dashboardService.getChartData(),
          expenseService.getAll(),
          vehicleService.getAll(),
        ]);

        setFleetUtilization(chartData.fleetUtilization);
        setFuelEfficiency(chartData.fuelEfficiency);
        setTripsPerMonth(chartData.tripsPerMonth);
        setCostBreakdown(chartData.costBreakdown);

        // Vehicle status breakdown
        const statusCounts: Record<string, number> = {};
        for (const v of vehicles) {
          statusCounts[v.status] = (statusCounts[v.status] ?? 0) + 1;
        }
        setVehicleStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

        // Monthly expense breakdown (last 6 months)
        const monthlyMap: Record<string, { fuel: number; maintenance: number; other: number }> = {};
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = MONTHS[d.getMonth()];
          monthlyMap[key] = { fuel: 0, maintenance: 0, other: 0 };
        }
        for (const e of expenses) {
          const d = new Date(e.date);
          const key = MONTHS[d.getMonth()];
          if (!monthlyMap[key]) continue;
          if (e.type === 'Fuel') monthlyMap[key].fuel += e.amount;
          else if (e.type === 'Maintenance') monthlyMap[key].maintenance += e.amount;
          else monthlyMap[key].other += e.amount;
        }
        setMonthlyExpenses(Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v })));
      } catch {
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
          Loading analytics…
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">Visual overview of fleet performance and operational metrics</p>
      </div>

      {/* Row 1: Fleet Utilization + Trips per Month */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={Truck} title="Fleet Utilization" subtitle="Monthly utilization % over the past 12 months" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={fleetUtilization} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Utilization']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#utilGrad)" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={TrendingUp} title="Trips per Month" subtitle="Completed trips over the past 12 months" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tripsPerMonth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Trips" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Fuel Efficiency line chart + Vehicle Status pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={Fuel} title="Avg Fuel Efficiency" subtitle="Monthly average km/L across the fleet" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={fuelEfficiency} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" km/L" domain={['auto', 'auto']} />
                <Tooltip formatter={(v: number) => [`${v} km/L`, 'Efficiency']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={Truck} title="Vehicle Status Distribution" subtitle="Current status of all fleet vehicles" />
          </CardHeader>
          <CardContent className="flex items-center justify-center">
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
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Monthly expense stacked bar + Cost breakdown pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <SectionTitle icon={DollarSign} title="Monthly Expense Breakdown" subtitle="Fuel, maintenance, and other costs by month" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyExpenses} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
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
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                >
                  {costBreakdown.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`₹${v.toLocaleString()}`, '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
