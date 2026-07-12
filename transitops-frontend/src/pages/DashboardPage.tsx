import React, { useEffect, useState } from 'react';
import {
  Truck,
  CheckCircle,
  Navigation,
  Wrench,
  Users,
  MapPin,
  Check,
  Percent,
  DollarSign,
  Droplets,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { dashboardService } from '../services/dashboardService';
import type { KPIData, ChartData } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPICardConfig {
  key: keyof KPIData;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  format?: (v: number) => string;
}

// ─── KPI card definitions ─────────────────────────────────────────────────────

const KPI_CARDS: KPICardConfig[] = [
  {
    key: 'totalVehicles',
    label: 'Total Vehicles',
    subtitle: 'Entire fleet',
    icon: Truck,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    key: 'availableVehicles',
    label: 'Available',
    subtitle: 'Ready to dispatch',
    icon: CheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    key: 'vehiclesOnTrip',
    label: 'On Trip',
    subtitle: 'Currently deployed',
    icon: Navigation,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    key: 'vehiclesInShop',
    label: 'In Shop',
    subtitle: 'Under maintenance',
    icon: Wrench,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    key: 'totalDrivers',
    label: 'Total Drivers',
    subtitle: 'Registered drivers',
    icon: Users,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    key: 'activeTrips',
    label: 'Active Trips',
    subtitle: 'Dispatched trips',
    icon: MapPin,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    key: 'completedTripsThisMonth',
    label: 'Completed Trips',
    subtitle: 'This month',
    icon: Check,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    key: 'fleetUtilizationRate',
    label: 'Fleet Utilization',
    subtitle: 'Active fleet %',
    icon: Percent,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    format: (v) => `${v}%`,
  },
  {
    key: 'totalExpensesThisMonth',
    label: 'Total Expenses',
    subtitle: 'This month',
    icon: DollarSign,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    format: (v) => `₹${v.toLocaleString('en-IN')}`,
  },
  {
    key: 'fuelCostThisMonth',
    label: 'Fuel Cost',
    subtitle: 'This month',
    icon: Droplets,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    format: (v) => `₹${v.toLocaleString('en-IN')}`,
  },
  {
    key: 'maintenanceOpenCount',
    label: 'Open Maintenance',
    subtitle: 'Pending issues',
    icon: AlertTriangle,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    key: 'avgFuelEfficiency',
    label: 'Avg Fuel Efficiency',
    subtitle: 'km / litre',
    icon: Zap,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    format: (v) => `${v} km/L`,
  },
];

// ─── Chart colours ────────────────────────────────────────────────────────────

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start gap-4">
            <SkeletonBox className="h-12 w-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <SkeletonBox className="h-6 w-20" />
              <SkeletonBox className="h-3 w-32" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <SkeletonBox className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <SkeletonBox className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  prefix = '',
  suffix = '',
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-sm">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-800">
            {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([dashboardService.getKPIs(), dashboardService.getChartData()])
      .then(([k, c]) => {
        if (!cancelled) {
          setKpis(k);
          setChartData(c);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <h2 className="text-lg font-semibold text-slate-800">Failed to load dashboard</h2>
        <p className="text-slate-500 text-sm max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Fleet overview and key performance indicators</p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <KPISkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map((card) => {
            const IconComp = card.icon;
            const rawValue = kpis ? kpis[card.key] : 0;
            const displayValue = card.format
              ? card.format(rawValue)
              : rawValue.toLocaleString();

            return (
              <Card
                key={card.key}
                className="p-5 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 rounded-xl p-2.5 ${card.iconBg}`}
                  >
                    <IconComp className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-slate-900 leading-tight">
                      {displayValue}
                    </p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">{card.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{card.subtitle}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <ChartSkeleton />
      ) : chartData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fleet Utilization — AreaChart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Percent className="h-4 w-4 text-indigo-500" />
                Fleet Utilization (12 months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData.fleetUtilization} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip content={<ChartTooltip suffix="%" />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Utilization"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#utilGradient)"
                    dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trips Per Month — BarChart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-blue-500" />
                Trips Per Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData.tripsPerMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip suffix=" trips" />} />
                  <Bar
                    dataKey="value"
                    name="Trips"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fuel Efficiency Trend — LineChart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-green-500" />
                Fuel Efficiency Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData.fuelEfficiency} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip suffix=" km/L" />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Efficiency"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Breakdown — PieChart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-red-500" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.costBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                  No expense data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={chartData.costBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={3}
                      label={({ percentage }: { percentage: number }) => `${percentage}%`}
                      labelLine={false}
                    >
                      {chartData.costBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span className="text-xs text-slate-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
