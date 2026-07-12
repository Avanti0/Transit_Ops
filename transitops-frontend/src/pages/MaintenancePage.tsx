import React, { useEffect, useState } from 'react';
import { Plus, Search, Wrench, CheckCircle, AlertCircle } from 'lucide-react';
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
import { maintenanceService } from '../services/maintenanceService';
import { vehicleService } from '../services/vehicleService';
import type { MaintenanceLog, MaintenanceStatus, MaintenanceType, Vehicle } from '../types';

const TYPE_OPTIONS: MaintenanceType[] = ['Preventive', 'Corrective', 'Emergency'];
const STATUS_OPTIONS: MaintenanceStatus[] = ['Open', 'In Progress', 'Completed'];

const EMPTY_FORM = {
  vehicleId: '',
  type: 'Preventive' as MaintenanceType,
  description: '',
  status: 'Open' as MaintenanceStatus,
  reportedDate: new Date().toISOString().split('T')[0],
  technicianName: '',
  cost: 0,
  mileageAtService: 0,
  notes: '',
};

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [l, v] = await Promise.all([maintenanceService.getAll(), vehicleService.getAll()]);
      setLogs(l);
      setVehicles(v);
    } catch {
      toast.error('Failed to load maintenance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);

  const filtered = logs.filter((l) => {
    const vehicle = getVehicle(l.vehicleId);
    const matchSearch =
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.technicianName.toLowerCase().includes(search.toLowerCase()) ||
      (vehicle?.registrationNumber ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchType = typeFilter === 'all' || l.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const handleSave = async () => {
    if (!formData.vehicleId || !formData.description || !formData.technicianName) {
      toast.error('Vehicle, description, and technician are required');
      return;
    }
    setSaving(true);
    try {
      await maintenanceService.create({ ...formData, cost: Number(formData.cost) || 0, mileageAtService: Number(formData.mileageAtService) || 0 });
      toast.success('Maintenance log created');
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id: string) => {
    setClosingId(id);
    try {
      await maintenanceService.completeMaintenance(id);
      toast.success('Maintenance closed — vehicle restored to Available');
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to close maintenance');
    } finally {
      setClosingId(null);
    }
  };

  const stats = {
    total: logs.length,
    open: logs.filter((l) => l.status === 'Open').length,
    inProgress: logs.filter((l) => l.status === 'In Progress').length,
    completed: logs.filter((l) => l.status === 'Completed').length,
    totalCost: logs.reduce((sum, l) => sum + l.cost, 0),
  };

  const TYPE_COLOR: Record<MaintenanceType, string> = {
    Preventive: 'bg-blue-100 text-blue-700',
    Corrective: 'bg-amber-100 text-amber-700',
    Emergency: 'bg-red-100 text-red-700',
  };

  return (
    <AppLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Open', value: stats.open, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Cost', value: `₹${stats.totalCost.toLocaleString()}`, color: 'text-slate-700', bg: 'bg-slate-50' },
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
            <CardTitle className="text-lg font-semibold text-slate-800">Maintenance Logs</CardTitle>
            <Button onClick={() => { setFormData(EMPTY_FORM); setModalOpen(true); }} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Log Maintenance
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by vehicle, description, technician…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Wrench className="h-8 w-8 text-slate-300" />
              <p className="text-sm">No maintenance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const vehicle = getVehicle(log.vehicleId);
                    const busy = closingId === log.id;
                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50">
                        <TableCell>
                          <p className="font-medium text-sm text-slate-800">{vehicle?.registrationNumber ?? log.vehicleId}</p>
                          <p className="text-xs text-slate-400">{vehicle ? `${vehicle.make} ${vehicle.model}` : ''}</p>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[log.type]}`}>
                            {log.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-700 max-w-[200px] truncate">{log.description}</p>
                          {log.parts && log.parts.length > 0 && (
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{log.parts.join(', ')}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-700">{log.technicianName}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-600">{format(parseISO(log.reportedDate), 'dd MMM yyyy')}</span>
                          {log.completedDate && (
                            <p className="text-xs text-slate-400">Done: {format(parseISO(log.completedDate), 'dd MMM yyyy')}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-slate-700">₹{log.cost.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {log.status !== 'Completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClose(log.id)}
                              disabled={busy}
                              className="text-xs h-7 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {busy ? '…' : 'Close'}
                            </Button>
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
            <DialogTitle>Log Maintenance</DialogTitle>
            <DialogDescription>Record a new maintenance event. Creating this log will set the vehicle status to In Shop.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 py-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Vehicle *</Label>
              <Select value={formData.vehicleId} onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model} ({v.status})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as MaintenanceType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as MaintenanceStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description *</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the issue or service" />
            </div>
            <div className="space-y-1.5">
              <Label>Technician *</Label>
              <Input value={formData.technicianName} onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })} placeholder="Technician name" />
            </div>
            <div className="space-y-1.5">
              <Label>Reported Date</Label>
              <Input type="date" value={formData.reportedDate} onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated Cost (₹)</Label>
              <Input type="number" min="0" value={formData.cost || ''} onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Mileage at Service (km)</Label>
              <Input type="number" min="0" value={formData.mileageAtService || ''} onChange={(e) => setFormData({ ...formData, mileageAtService: Number(e.target.value) })} placeholder="0" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Create Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
