import React, { useEffect, useState } from 'react';
import { Plus, Search, Fuel } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { AppLayout } from '../layouts/AppLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { fuelService } from '../services/fuelService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';
import type { FuelLog, Vehicle, Driver } from '../types';

const EMPTY_FORM = {
  vehicleId: '',
  driverId: '',
  date: new Date().toISOString().split('T')[0],
  fuelStation: '',
  liters: 0,
  pricePerLiter: 0,
  totalCost: 0,
  odometer: 0,
};

export default function FuelPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [f, v, d] = await Promise.all([fuelService.getAll(), vehicleService.getAll(), driverService.getAll()]);
      setFuelLogs(f.sort((a, b) => b.date.localeCompare(a.date)));
      setVehicles(v);
      setDrivers(d);
    } catch {
      toast.error('Failed to load fuel logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);
  const getDriver = (id: string) => drivers.find((d) => d.id === id);

  const filtered = fuelLogs.filter((f) => {
    const vehicle = getVehicle(f.vehicleId);
    const driver = getDriver(f.driverId);
    const matchSearch =
      (vehicle?.registrationNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      f.fuelStation.toLowerCase().includes(search.toLowerCase()) ||
      (driver?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchVehicle = vehicleFilter === 'all' || f.vehicleId === vehicleFilter;
    return matchSearch && matchVehicle;
  });

  // Auto-calculate total cost when liters or price changes
  const handleLitersChange = (liters: number) => {
    const total = liters * (formData.pricePerLiter || 0);
    setFormData({ ...formData, liters, totalCost: parseFloat(total.toFixed(2)) });
  };

  const handlePriceChange = (price: number) => {
    const total = (formData.liters || 0) * price;
    setFormData({ ...formData, pricePerLiter: price, totalCost: parseFloat(total.toFixed(2)) });
  };

  const handleSave = async () => {
    if (!formData.vehicleId || !formData.date || !formData.fuelStation) {
      toast.error('Vehicle, date, and fuel station are required');
      return;
    }
    setSaving(true);
    try {
      await fuelService.create({
        vehicleId: formData.vehicleId,
        liters: Number(formData.liters),
        cost: Number(formData.totalCost) || Number(formData.liters) * Number(formData.pricePerLiter),
        date: formData.date,
      });
      toast.success('Fuel log added');
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    totalLogs: fuelLogs.length,
    totalLiters: fuelLogs.reduce((s, f) => s + f.liters, 0),
    totalCost: fuelLogs.reduce((s, f) => s + f.totalCost, 0),
    avgEfficiency: (() => {
      const vals = fuelLogs.filter((f) => f.efficiency && f.efficiency > 0).map((f) => f.efficiency as number);
      return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
    })(),
  };

  return (
    <AppLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {[
          { label: 'Total Records', value: stats.totalLogs, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Liters', value: `${stats.totalLiters.toLocaleString()} L`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Cost', value: `₹${stats.totalCost.toLocaleString()}`, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Avg Efficiency', value: `${stats.avgEfficiency} km/L`, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={`${bg} border-0 shadow-sm`}>
            <CardContent className="p-4 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">Fuel Logs</CardTitle>
            <Button onClick={() => { setFormData(EMPTY_FORM); setModalOpen(true); }} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Fuel Log
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by vehicle, station, driver…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Fuel className="h-8 w-8 text-slate-300" />
              <p className="text-sm">No fuel logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Liters</TableHead>
                    <TableHead>Price/L</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Odometer</TableHead>
                    <TableHead>Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const vehicle = getVehicle(log.vehicleId);
                    const driver = getDriver(log.driverId);
                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50">
                        <TableCell>
                          <span className="text-sm text-slate-700">{format(parseISO(log.date), 'dd MMM yyyy')}</span>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm text-slate-800">{vehicle?.registrationNumber ?? log.vehicleId}</p>
                          <p className="text-xs text-slate-400">{vehicle ? `${vehicle.make} ${vehicle.model}` : ''}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-700">{driver?.name ?? log.driverId}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">{log.fuelStation}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-slate-700">{log.liters} L</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">₹{log.pricePerLiter}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-slate-800">₹{log.totalCost.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">{log.odometer.toLocaleString()} km</span>
                        </TableCell>
                        <TableCell>
                          {log.efficiency ? (
                            <span className="text-sm font-medium text-emerald-600">{log.efficiency} km/L</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Fuel Log</DialogTitle>
            <DialogDescription>Record a fuel fill-up event.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 py-2">
            <div className="space-y-1.5">
              <Label>Vehicle *</Label>
              <Select value={formData.vehicleId} onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Driver</Label>
              <Select value={formData.driverId} onValueChange={(v) => setFormData({ ...formData, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Fuel Station *</Label>
              <Input value={formData.fuelStation} onChange={(e) => setFormData({ ...formData, fuelStation: e.target.value })} placeholder="e.g. Indian Oil, Anna Nagar" />
            </div>
            <div className="space-y-1.5">
              <Label>Liters</Label>
              <Input type="number" min="0" step="0.1" value={formData.liters || ''} onChange={(e) => handleLitersChange(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Price per Liter (₹)</Label>
              <Input type="number" min="0" step="0.01" value={formData.pricePerLiter || ''} onChange={(e) => handlePriceChange(Number(e.target.value))} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Total Cost (₹)</Label>
              <Input type="number" min="0" value={formData.totalCost || ''} onChange={(e) => setFormData({ ...formData, totalCost: Number(e.target.value) })} placeholder="Auto-calculated" />
            </div>
            <div className="space-y-1.5">
              <Label>Odometer (km)</Label>
              <Input type="number" min="0" value={formData.odometer || ''} onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })} placeholder="Current reading" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Add Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
