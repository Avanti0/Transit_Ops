import React, { useEffect, useState } from 'react';
import { Plus, Search, Receipt } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { AppLayout } from '../layouts/AppLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { expenseService } from '../services/expenseService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';
import type { Expense, ExpenseType, Vehicle, Driver } from '../types';

const EXPENSE_TYPES: ExpenseType[] = ['Fuel', 'Maintenance', 'Toll', 'Miscellaneous'];

const TYPE_STYLE: Record<ExpenseType, string> = {
  Fuel: 'bg-blue-100 text-blue-700',
  Maintenance: 'bg-orange-100 text-orange-700',
  Toll: 'bg-purple-100 text-purple-700',
  Miscellaneous: 'bg-slate-100 text-slate-700',
};

const EMPTY_FORM = {
  type: 'Miscellaneous' as ExpenseType,
  vehicleId: '',
  driverId: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  description: '',
  approvedBy: '',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [e, v, d] = await Promise.all([
        expenseService.getAll(),
        vehicleService.getAll(),
        driverService.getAll(),
      ]);
      setExpenses(e.sort((a, b) => b.date.localeCompare(a.date)));
      setVehicles(v);
      setDrivers(d);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const getVehicle = (id?: string) => id ? vehicles.find((v) => v.id === id) : undefined;
  const getDriver = (id?: string) => id ? drivers.find((d) => d.id === id) : undefined;

  const filtered = expenses.filter((e) => {
    const vehicle = getVehicle(e.vehicleId);
    const matchSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (vehicle?.registrationNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.approvedBy ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = {
    total: expenses.reduce((s, e) => s + e.amount, 0),
    fuel: expenses.filter((e) => e.type === 'Fuel').reduce((s, e) => s + e.amount, 0),
    maintenance: expenses.filter((e) => e.type === 'Maintenance').reduce((s, e) => s + e.amount, 0),
    toll: expenses.filter((e) => e.type === 'Toll').reduce((s, e) => s + e.amount, 0),
    misc: expenses.filter((e) => e.type === 'Miscellaneous').reduce((s, e) => s + e.amount, 0),
  };

  const handleSave = async () => {
    if (!formData.description || !formData.amount || !formData.date) {
      toast.error('Description, amount, and date are required');
      return;
    }
    setSaving(true);
    try {
      await expenseService.create({
        ...formData,
        amount: Number(formData.amount),
        vehicleId: formData.vehicleId || undefined,
        driverId: formData.driverId || undefined,
        approvedBy: formData.approvedBy || undefined,
      });
      toast.success('Expense recorded');
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
        {[
          { label: 'Total Expenses', value: `₹${stats.total.toLocaleString()}`, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Fuel', value: `₹${stats.fuel.toLocaleString()}`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Maintenance', value: `₹${stats.maintenance.toLocaleString()}`, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Toll', value: `₹${stats.toll.toLocaleString()}`, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Miscellaneous', value: `₹${stats.misc.toLocaleString()}`, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={`${bg} border-0 shadow-sm`}>
            <CardContent className="p-4 text-center">
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">Expenses</CardTitle>
            <Button onClick={() => { setFormData(EMPTY_FORM); setModalOpen(true); }} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by description, vehicle…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EXPENSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Receipt className="h-8 w-8 text-slate-300" />
              <p className="text-sm">No expenses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((expense) => {
                    const vehicle = getVehicle(expense.vehicleId);
                    const driver = getDriver(expense.driverId);
                    return (
                      <TableRow key={expense.id} className="hover:bg-slate-50">
                        <TableCell>
                          <span className="text-sm text-slate-700">{format(parseISO(expense.date), 'dd MMM yyyy')}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[expense.type]}`}>
                            {expense.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-700 max-w-[200px] truncate">{expense.description}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">{vehicle?.registrationNumber ?? '—'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">{driver?.name ?? '—'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-slate-800">₹{expense.amount.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          {expense.approvedBy ? (
                            <Badge variant="success" className="text-[10px]">Approved</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Pending</Badge>
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
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new expense entry.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 py-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as ExpenseType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description *</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the expense" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹) *</Label>
              <Input type="number" min="0" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Approved By</Label>
              <Input value={formData.approvedBy} onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })} placeholder="Approver email/name" />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle (optional)</Label>
              <Select value={formData.vehicleId || '_none'} onValueChange={(v) => setFormData({ ...formData, vehicleId: v === '_none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Driver (optional)</Label>
              <Select value={formData.driverId || '_none'} onValueChange={(v) => setFormData({ ...formData, driverId: v === '_none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
