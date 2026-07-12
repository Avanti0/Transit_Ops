import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Star,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import { format, isAfter, isBefore, addDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { AppLayout } from '../layouts/AppLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { driverService } from '../services/driverService';
import type { Driver, DriverStatus } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function licenseExpiryStatus(expiry: string): 'expired' | 'expiring-soon' | 'valid' {
  const expiryDate = parseISO(expiry);
  const today = new Date();
  if (isBefore(expiryDate, today)) return 'expired';
  if (isBefore(expiryDate, addDays(today, 60))) return 'expiring-soon';
  return 'valid';
}

const STATUS_OPTIONS: DriverStatus[] = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  licenseNumber: '',
  licenseCategory: 'CDL-A',
  licenseExpiry: '',
  contactNumber: '',
  status: 'Available' as DriverStatus,
  safetyScore: 100.0,
  joiningDate: new Date().toISOString().split('T')[0],
  address: '',
  emergencyContact: '',
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await driverService.getAll();
      setDrivers(data);
    } catch {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  // ─── Filtering ─────────────────────────────────────────────────────────────

  const filtered = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      d.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── Modal handlers ────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingDriver(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      licenseNumber: driver.licenseNumber,
      licenseCategory: 'CDL-A',
      licenseExpiry: driver.licenseExpiry,
      contactNumber: driver.phone,
      status: driver.status,
      safetyScore: driver.rating ?? 100.0,
      joiningDate: driver.joiningDate,
      address: driver.address,
      emergencyContact: driver.emergencyContact,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.licenseNumber.trim() || !formData.licenseExpiry) {
      toast.error('Name, license number, and expiry are required');
      return;
    }
    setSaving(true);
    try {
      if (editingDriver) {
        await driverService.update(editingDriver.id, {
          name: formData.name,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: formData.licenseExpiry,
          contactNumber: formData.contactNumber || formData.phone,
          safetyScore: formData.safetyScore,
        });
        toast.success('Driver updated');
      } else {
        await driverService.create({
          name: formData.name,
          licenseNumber: formData.licenseNumber,
          licenseCategory: formData.licenseCategory,
          licenseExpiry: formData.licenseExpiry,
          contactNumber: formData.contactNumber || formData.phone,
          safetyScore: formData.safetyScore,
        });
        toast.success('Driver added');
      }
      setModalOpen(false);
      await loadDrivers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete handler ────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await driverService.delete(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
      await loadDrivers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total: drivers.length,
    available: drivers.filter((d) => d.status === 'Available').length,
    onTrip: drivers.filter((d) => d.status === 'On Trip').length,
    suspended: drivers.filter((d) => d.status === 'Suspended').length,
    expiredLicense: drivers.filter((d) => licenseExpiryStatus(d.licenseExpiry) === 'expired').length,
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Available', value: stats.available, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'On Trip', value: stats.onTrip, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Suspended', value: stats.suspended, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Expired License', value: stats.expiredLicense, color: 'text-red-700', bg: 'bg-red-50' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={`${bg} border-0 shadow-sm`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Table card ──────────────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Driver Registry
            </CardTitle>
            <Button onClick={openAdd} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Driver
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, license, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              Loading drivers…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Shield className="h-8 w-8 text-slate-300" />
              <p className="text-sm">No drivers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Trips</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((driver) => {
                    const expiryStatus = licenseExpiryStatus(driver.licenseExpiry);
                    return (
                      <TableRow key={driver.id} className="hover:bg-slate-50">
                        {/* Driver name + joining */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {driver.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{driver.name}</p>
                              <p className="text-xs text-slate-400">
                                Joined {format(parseISO(driver.joiningDate), 'MMM yyyy')}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Contact */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                              {driver.phone}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Mail className="h-3 w-3 shrink-0" />
                              {driver.email}
                            </div>
                          </div>
                        </TableCell>

                        {/* License number */}
                        <TableCell>
                          <span className="font-mono text-xs text-slate-700">{driver.licenseNumber}</span>
                        </TableCell>

                        {/* License expiry with warning */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {expiryStatus !== 'valid' && (
                              <AlertTriangle
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  expiryStatus === 'expired' ? 'text-red-500' : 'text-amber-500'
                                }`}
                              />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                expiryStatus === 'expired'
                                  ? 'text-red-600'
                                  : expiryStatus === 'expiring-soon'
                                  ? 'text-amber-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {format(parseISO(driver.licenseExpiry), 'dd MMM yyyy')}
                            </span>
                          </div>
                          {expiryStatus === 'expired' && (
                            <Badge variant="destructive" className="text-[10px] mt-0.5">EXPIRED</Badge>
                          )}
                          {expiryStatus === 'expiring-soon' && (
                            <Badge variant="warning" className="text-[10px] mt-0.5">Expiring Soon</Badge>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={driver.status} />
                        </TableCell>

                        {/* Rating */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium text-slate-700">{driver.rating.toFixed(1)}</span>
                          </div>
                        </TableCell>

                        {/* Total trips */}
                        <TableCell>
                          <span className="text-sm text-slate-700">{driver.totalTrips}</span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit"
                              onClick={() => openEdit(driver)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              onClick={() => setDeleteTarget(driver)}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
            <DialogDescription>
              {editingDriver ? 'Update driver information.' : 'Fill in the details to register a new driver.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="d-name">Full Name *</Label>
              <Input
                id="d-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ravi Kumar"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-phone">Phone</Label>
              <Input
                id="d-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91-9876543210"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="d-email">Email</Label>
              <Input
                id="d-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="driver@transitops.in"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-license">License Number *</Label>
              <Input
                id="d-license"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="TN0120180012345"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-expiry">License Expiry *</Label>
              <Input
                id="d-expiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as DriverStatus })}
              >
                <SelectTrigger id="d-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-joining">Joining Date</Label>
              <Input
                id="d-joining"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="d-address">Address</Label>
              <Input
                id="d-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="12, Anna Nagar, Chennai"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="d-emergency">Emergency Contact</Label>
              <Input
                id="d-emergency"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="+91-9876501234"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editingDriver ? 'Update' : 'Add Driver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Driver?</DialogTitle>
            <DialogDescription>
              This will permanently remove{' '}
              <span className="font-semibold text-slate-800">{deleteTarget?.name}</span>. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
