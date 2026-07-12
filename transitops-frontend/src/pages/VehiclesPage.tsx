import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Pencil, Trash2, Plus, Search, Truck, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/StatusBadge';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle, VehicleStatus, VehicleType, FuelType } from '../types';
import { cn } from '../lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const VEHICLE_STATUSES: VehicleStatus[] = ['Available', 'On Trip', 'In Shop', 'Retired'];
const VEHICLE_TYPES: VehicleType[] = ['Bus', 'Van', 'Truck', 'Car'];
const FUEL_TYPES: FuelType[] = ['Diesel', 'Petrol', 'CNG', 'Electric'];

// ─── Form state ───────────────────────────────────────────────────────────────

interface VehicleFormState {
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  type: VehicleType | '';
  capacity: string;
  fuelType: FuelType | '';
  currentMileage: string;
  status: VehicleStatus;
  insuranceExpiry: string;
  permitExpiry: string;
}

const EMPTY_FORM: VehicleFormState = {
  registrationNumber: '',
  make: '',
  model: '',
  year: String(new Date().getFullYear()),
  type: '',
  capacity: '',
  fuelType: '',
  currentMileage: '0',
  status: 'Available',
  insuranceExpiry: '',
  permitExpiry: '',
};

function vehicleToForm(v: Vehicle): VehicleFormState {
  return {
    registrationNumber: v.registrationNumber,
    make: v.make,
    model: v.model,
    year: String(v.year),
    type: v.type,
    capacity: String(v.capacity),
    fuelType: v.fuelType,
    currentMileage: String(v.currentMileage),
    status: v.status,
    insuranceExpiry: v.insuranceExpiry,
    permitExpiry: v.permitExpiry,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  registrationNumber?: string;
  make?: string;
  model?: string;
  year?: string;
  type?: string;
  capacity?: string;
  fuelType?: string;
  currentMileage?: string;
  insuranceExpiry?: string;
  permitExpiry?: string;
}

function validateForm(
  form: VehicleFormState,
  vehicles: Vehicle[],
  editingId: string | null,
): FormErrors {
  const errors: FormErrors = {};

  if (!form.registrationNumber.trim()) {
    errors.registrationNumber = 'Registration number is required.';
  } else {
    const duplicate = vehicles.find(
      (v) =>
        v.registrationNumber.toLowerCase() === form.registrationNumber.trim().toLowerCase() &&
        v.id !== editingId,
    );
    if (duplicate) {
      errors.registrationNumber = 'This registration number already exists.';
    }
  }

  if (!form.make.trim()) errors.make = 'Make is required.';
  if (!form.model.trim()) errors.model = 'Model is required.';

  const yearNum = Number(form.year);
  if (!form.year || isNaN(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 1) {
    errors.year = `Year must be between 1990 and ${new Date().getFullYear() + 1}.`;
  }

  if (!form.type) errors.type = 'Vehicle type is required.';
  if (!form.fuelType) errors.fuelType = 'Fuel type is required.';

  const cap = Number(form.capacity);
  if (!form.capacity || isNaN(cap) || cap <= 0) {
    errors.capacity = 'Capacity must be greater than 0.';
  }

  const mileage = Number(form.currentMileage);
  if (form.currentMileage === '' || isNaN(mileage) || mileage < 0) {
    errors.currentMileage = 'Mileage must be 0 or greater.';
  }

  if (!form.insuranceExpiry) errors.insuranceExpiry = 'Insurance expiry date is required.';
  if (!form.permitExpiry) errors.permitExpiry = 'Permit expiry date is required.';

  return errors;
}

// ─── Field component helper ───────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  // Data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VehicleStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | VehicleType>('all');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch (err) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // ─── Filtered list ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicles.filter((v) => {
      const matchSearch =
        !q ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchType = typeFilter === 'all' || v.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [vehicles, search, statusFilter, typeFilter]);

  // ─── Modal helpers ───────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm(vehicleToForm(v));
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const setField = <K extends keyof VehicleFormState>(key: K, value: VehicleFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const errors = validateForm(form, vehicles, editingVehicle?.id ?? null);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        registrationNumber: form.registrationNumber.trim().toUpperCase(),
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        type: form.type as VehicleType,
        capacity: Number(form.capacity),
        fuelType: form.fuelType as FuelType,
        currentMileage: Number(form.currentMileage),
        status: form.status,
        insuranceExpiry: form.insuranceExpiry,
        permitExpiry: form.permitExpiry,
        // preserve existing computed fields when editing
        lastServiceDate: editingVehicle?.lastServiceDate ?? new Date().toISOString().split('T')[0],
        nextServiceDue: editingVehicle?.nextServiceDue ?? Number(form.currentMileage) + 5000,
      };

      if (editingVehicle) {
        const updated = await vehicleService.update(editingVehicle.id, payload);
        setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        toast.success(`Vehicle ${updated.registrationNumber} updated successfully`);
      } else {
        const created = await vehicleService.create(payload);
        setVehicles((prev) => [...prev, created]);
        toast.success(`Vehicle ${created.registrationNumber} added successfully`);
      }
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save vehicle';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await vehicleService.delete(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success('Vehicle removed from registry');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete vehicle';
      toast.error(message);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle Registry</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in fleet
          </p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by registration, make, or model…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {VEHICLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type filter */}
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table / Loading / Empty */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
            <div className="bg-slate-100 rounded-full p-5">
              <Truck className="h-10 w-10 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-700">
                {vehicles.length === 0 ? 'No vehicles yet' : 'No vehicles match your filters'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {vehicles.length === 0
                  ? 'Add your first vehicle to get started managing your fleet.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
            {vehicles.length === 0 && (
              <Button onClick={openAdd} size="sm">
                <Plus className="h-4 w-4" />
                Add First Vehicle
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration</TableHead>
                <TableHead>Make / Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead className="text-right">Mileage (km)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-slate-800">
                      {vehicle.registrationNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-800">{vehicle.make}</p>
                      <p className="text-xs text-slate-500">
                        {vehicle.model} · {vehicle.year}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-700">{vehicle.type}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-700">
                    {vehicle.capacity}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={vehicle.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-700">{vehicle.fuelType}</span>
                  </TableCell>
                  <TableCell className="text-right text-slate-700">
                    {vehicle.currentMileage.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {confirmDeleteId === vehicle.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={deleting}
                            className="h-8 text-xs px-2"
                          >
                            {deleting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Confirm?'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deleting}
                            className="h-8 text-xs px-2"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(vehicle)}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            aria-label={`Edit ${vehicle.registrationNumber}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(vehicle.id)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${vehicle.registrationNumber}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? `Editing ${editingVehicle.registrationNumber}`
                : 'Fill in the details to register a new vehicle in the fleet.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 py-2">
            {/* Registration Number */}
            <div className="sm:col-span-2">
              <Label htmlFor="reg" className="font-medium">
                Registration Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reg"
                placeholder="e.g. MH12AB1234"
                value={form.registrationNumber}
                onChange={(e) => setField('registrationNumber', e.target.value.toUpperCase())}
                className={cn('mt-1', formErrors.registrationNumber && 'border-red-400 focus-visible:ring-red-400')}
              />
              <FieldError msg={formErrors.registrationNumber} />
            </div>

            {/* Make */}
            <div>
              <Label htmlFor="make" className="font-medium">
                Make <span className="text-red-500">*</span>
              </Label>
              <Input
                id="make"
                placeholder="e.g. Tata"
                value={form.make}
                onChange={(e) => setField('make', e.target.value)}
                className={cn('mt-1', formErrors.make && 'border-red-400 focus-visible:ring-red-400')}
              />
              <FieldError msg={formErrors.make} />
            </div>

            {/* Model */}
            <div>
              <Label htmlFor="model" className="font-medium">
                Model <span className="text-red-500">*</span>
              </Label>
              <Input
                id="model"
                placeholder="e.g. Starbus"
                value={form.model}
                onChange={(e) => setField('model', e.target.value)}
                className={cn('mt-1', formErrors.model && 'border-red-400 focus-visible:ring-red-400')}
              />
              <FieldError msg={formErrors.model} />
            </div>

            {/* Year */}
            <div>
              <Label htmlFor="year" className="font-medium">
                Year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="year"
                type="number"
                placeholder="e.g. 2022"
                value={form.year}
                onChange={(e) => setField('year', e.target.value)}
                className={cn('mt-1', formErrors.year && 'border-red-400 focus-visible:ring-red-400')}
              />
              <FieldError msg={formErrors.year} />
            </div>

            {/* Capacity */}
            <div>
              <Label htmlFor="capacity" className="font-medium">
                Capacity (seats/tonnes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                placeholder="e.g. 45"
                value={form.capacity}
                onChange={(e) => setField('capacity', e.target.value)}
                className={cn('mt-1', formErrors.capacity && 'border-red-400 focus-visible:ring-red-400')}
              />
              <FieldError msg={formErrors.capacity} />
            </div>

            {/* Vehicle Type */}
            <div>
              <Label className="font-medium">
                Vehicle Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) => setField('type', v as VehicleType)}
              >
                <SelectTrigger className={cn('mt-1', formErrors.type && 'border-red-400')}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError msg={formErrors.type} />
            </div>

            {/* Fuel Type */}
            <div>
              <Label className="font-medium">
                Fuel Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.fuelType}
                onValueChange={(v) => setField('fuelType', v as FuelType)}
              >
                <SelectTrigger className={cn('mt-1', formErrors.fuelType && 'border-red-400')}>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError msg={formErrors.fuelType} />
            </div>

            {/* Current Mileage */}
            <div>
              <Label htmlFor="mileage" className="font-medium">
                Current Mileage (km)
              </Label>
              <Input
                id="mileage"
                type="number"
                min={0}
                placeholder="e.g. 52000"
                value={form.currentMileage}
                onChange={(e) => setField('currentMileage', e.target.value)}
                className={cn('mt-1', formErrors.currentMileage && 'border-red-400 focus-visible:ring-red-400')}
              />
              <FieldError msg={formErrors.currentMileage} />
            </div>

            {/* Status — only visible when editing */}
            {editingVehicle && (
              <div>
                <Label className="font-medium">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setField('status', v as VehicleStatus)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Insurance Expiry */}
            <div>
              <Label htmlFor="insurance" className="font-medium">
                Insurance Expiry <span className="text-red-500">*</span>
              </Label>
              <Input
                id="insurance"
                type="date"
                value={form.insuranceExpiry}
                onChange={(e) => setField('insuranceExpiry', e.target.value)}
                className={cn('mt-1', formErrors.insuranceExpiry && 'border-red-400 focus-visible:ring-red-400')}
              />
              <FieldError msg={formErrors.insuranceExpiry} />
            </div>

            {/* Permit Expiry */}
            <div>
              <Label htmlFor="permit" className="font-medium">
                Permit Expiry <span className="text-red-500">*</span>
              </Label>
              <Input
                id="permit"
                type="date"
                value={form.permitExpiry}
                onChange={(e) => setField('permitExpiry', e.target.value)}
                className={cn('mt-1', formErrors.permitExpiry && 'border-red-400 focus-visible:ring-red-400')}
              />
              <FieldError msg={formErrors.permitExpiry} />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editingVehicle ? (
                'Save Changes'
              ) : (
                'Add Vehicle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
