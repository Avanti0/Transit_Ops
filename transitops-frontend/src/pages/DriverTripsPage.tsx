import React, { useEffect, useState } from 'react';
import { MapPin, Truck, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { AppLayout } from '../layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { StatusBadge } from '../components/StatusBadge';
import { tripService } from '../services/tripService';
import type { Trip } from '../types';

export default function DriverTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripService
      .getMyTrips()
      .then(setTrips)
      .catch(() => toast.error('Failed to load your trips'))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: trips.length,
    dispatched: trips.filter((t) => t.status === 'Dispatched').length,
    completed: trips.filter((t) => t.status === 'Completed').length,
    cancelled: trips.filter((t) => t.status === 'Cancelled').length,
  };

  return (
    <AppLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50', icon: MapPin },
          { label: 'Active', value: stats.dispatched, color: 'text-orange-600', bg: 'bg-orange-50', icon: Truck },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label} className={`${bg} border-0 shadow-sm`}>
            <CardContent className="p-4 text-center">
              <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trips list */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800">My Trips</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading your trips…
            </div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <MapPin className="h-8 w-8 text-slate-300" />
              <p className="text-sm">No trips assigned to you yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {trips.map((trip) => (
                <div key={trip.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-800 text-sm truncate">{trip.title}</p>
                        <StatusBadge status={trip.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {trip.origin} → {trip.destination}
                        </span>
                        {trip.distance > 0 && (
                          <span>{trip.distance} km</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(trip.scheduledDeparture), 'dd MMM, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
