import React, { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Truck, Users, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { AppLayout } from '../layouts/AppLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { StatusBadge } from '../components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { tripService } from '../services/tripService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';
import type { Trip, Vehicle, Driver, TripStatus } from '../types';

const EMPTY_FORM = {
  title: '',
  vehicleId: '',
  driverId: '',
  origin: '',
  destination: '',
  scheduledDeparture: '',
  scheduledArrival: '',
  distance: 0,
  status: 'Draft' as TripStatus,
  passengerCount: undefined as number | undefined,
  cargoWeight: undefined as number | undefined,
  notes: '',
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [t, v, d] = await Promise.all([
        tripService.getAll(),
        vehicleService.getAll(),
        driverService.getAll(),
      ]);
      setTrips(t);
      setVehicles(v);
      setDrivers(d);
    } catch {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = trips.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.origin.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);
  const getDriver = (id: string) => drivers.find((d) => d.id === id);

  // Available vehicles/drivers for new trip
  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  const availableDrivers = drivers.filter(
    (d) => d.status === 'Available' && new Date(d.licenseExpiry) > new Date()
  );

  const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);

  // Cargo validation
  const cargoWarning =
    selectedVehicle &&
    formData.cargoWeight &&
    formData.cargoWeight > selectedVehicle.capacity
      ? `Exceeds vehicle capacity of ${selectedVehicle.capacity} tons`
      : null;

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.vehicleId || !formData.driverId || !formData.origin || !formData.destination || !formData.scheduledDeparture) {
      toast.error('Please fill all required fields');
      return;
    }
    if (cargoWarning) {
      toast.error(cargoWarning);
      return;
    }
    setSaving(true);
    try {
      await tripService.create({
        ...formData,
        distance: Number(formData.distance) || 0,
      });
      toast.success('Trip created');
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async (id: string) => {
    setActionLoading(id);
    try {
      await tripService.dispatch(id);
      toast.success('Trip dispatched');
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dispatch failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(id);
    try {
      await tripService.complete(id);
      toast.success('Trip completed');
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Complete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await tripService.cancel(id);
      toast.success('Trip cancelled');
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total: trips.length,
    draft: trips.filter((t) => t.status === 'Draft').length,
    dispatched: trips.filter((t) => t.status === 'Dispatched').length,
    completed: trips.filter((t) => t.status === 'Completed').length,
    cancelled: trips.filter((t) => t.status === 'Cancelled').length,
  };

  return (
    <AppLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Draft', value: stats.draft, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Dispatched', value: stats.dispatched, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={`${bg} border-0 shadow-sm`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">Trips</CardTitle>
            <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Trip
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search trips…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {(['Draft', 'Dispatched', 'Completed', 'Cancelled'] as TripStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading trips…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <MapPin className="h-8 w-8 text-slate-300" />
              <p className="text-sm">No trips found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((trip) => {
                    const vehicle = getVehicle(trip.vehicleId);
                    const driver = getDriver(trip.driverId);
                    const busy = actionLoading === trip.id;
                    return (
                      <TableRow key={trip.id} className="hover:bg-slate-50">
                        <TableCell>
                          <p className="font-medium text-slate-800 text-sm max-w-[180px] truncate">{trip.title}</p>
                          {trip.distance > 0 && (
                            <p className="text-xs text-slate-400">{trip.distance} km</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <p className="text-slate-700 truncate max-w-[140px]">{trip.origin}</p>
                            <p className="text-slate-400">→ {trip.destination}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-700">{vehicle?.registrationNumber ?? trip.vehicleId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-700">{driver?.name ?? trip.driverId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-600">
                            {format(parseISO(trip.scheduledDeparture), 'dd MMM, HH:mm')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={trip.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {trip.status === 'Draft' && (
                              <>
                                <Button size="sm" variant="default" onClick={() => handleDispatch(trip.id)} disabled={busy} className="text-xs h-7 px-2">
                                  {busy ? '…' : 'Dispatch'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleCancel(trip.id)} disabled={busy} className="text-xs h-7 px-2">
                                  Cancel
                                </Button>
                              </>
                            )}
                            {trip.status === 'Dispatched' && (
                              <>
                                <Button size="sm" variant="default" onClick={() => handleComplete(trip.id)} disabled={busy} className="text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-700">
                                  {busy ? '…' : 'Complete'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleCancel(trip.id)} disabled={busy} className="text-xs h-7 px-2">
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
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

      {/* Create Trip Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
            <DialogDescription>Fill in trip details. Only Available vehicles and drivers with valid licenses can be selected.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 py-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Trip Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Chennai to Coimbatore Express" />
            </div>
            <div className="space-y-1.5">
              <Label>Origin *</Label>
              <Input value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} placeholder="Departure location" />
            </div>
            <div className="space-y-1.5">
              <Label>Destination *</Label>
              <Input value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} placeholder="Arrival location" />
            </div>
            <div className="space-y-1.5">
              <Label>Scheduled Departure *</Label>
              <Input type="datetime-local" value={formData.scheduledDeparture} onChange={(e) => setFormData({ ...formData, scheduledDeparture: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Scheduled Arrival</Label>
              <Input type="datetime-local" value={formData.scheduledArrival} onChange={(e) => setFormData({ ...formData, scheduledArrival: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle *</Label>
              <Select value={formData.vehicleId} onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.length === 0 && <SelectItem value="_none" disabled>No available vehicles</SelectItem>}
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Driver *</Label>
              <Select value={formData.driverId} onValueChange={(v) => setFormData({ ...formData, driverId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.length === 0 && <SelectItem value="_none" disabled>No available drivers</SelectItem>}
                  {availableDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Distance (km)</Label>
              <Input type="number" min="0" value={formData.distance || ''} onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Cargo Weight (tons)</Label>
              <Input type="number" min="0" step="0.1" value={formData.cargoWeight ?? ''} onChange={(e) => setFormData({ ...formData, cargoWeight: e.target.value ? Number(e.target.value) : undefined })} placeholder="Optional" />
              {cargoWarning && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  {cargoWarning}
                </div>
              )}
              {selectedVehicle && (
                <p className="text-xs text-slate-400">Vehicle capacity: {selectedVehicle.capacity} tons</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Passenger Count</Label>
              <Input type="number" min="0" value={formData.passengerCount ?? ''} onChange={(e) => setFormData({ ...formData, passengerCount: e.target.value ? Number(e.target.value) : undefined })} placeholder="Optional" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !!cargoWarning}>
              {saving ? 'Creating…' : 'Create Trip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
