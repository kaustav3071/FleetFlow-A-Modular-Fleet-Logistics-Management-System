import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, CheckCircle, Clock, Truck, User, MapPin, Gauge, Package } from 'lucide-react';
import { tripsAPI } from '../../api/trips.js';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import TripCompleteModal from '../Trips/TripCompleteModal.jsx';
import { formatDate, formatCurrency } from '../../utils/formatters.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

const statusConfig = {
  draft: { label: 'Draft', color: 'gray' },
  dispatched: { label: 'Dispatched', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [completeTrip, setCompleteTrip] = useState(null);
  const [stats, setStats] = useState({ dispatched: 0, completed: 0, total: 0 });

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: '-createdAt' };
      if (statusFilter) params.status = statusFilter;
      const { data } = await tripsAPI.getMyTrips(params);
      setTrips(data.data?.trips || []);
      setTotalPages(data.data?.pagination?.pages || 1);
      setStats(prev => ({ ...prev, total: data.data?.pagination?.total || 0 }));
    } catch {
      toast.error('Failed to fetch your trips');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dispRes, compRes] = await Promise.all([
          tripsAPI.getMyTrips({ status: 'dispatched', limit: 1 }),
          tripsAPI.getMyTrips({ status: 'completed', limit: 1 }),
        ]);
        setStats({
          dispatched: dispRes.data.data?.pagination?.total || 0,
          completed: compRes.data.data?.pagination?.total || 0,
          total: (dispRes.data.data?.pagination?.total || 0) + (compRes.data.data?.pagination?.total || 0),
        });
      } catch { /* ignore */ }
    };
    fetchStats();
  }, []);

  const handleComplete = (trip) => setCompleteTrip(trip);

  const statusFilters = [
    { value: '', label: 'All Trips' },
    { value: 'dispatched', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">My Trips</h1>
        <p className="text-sm text-surface-500 mt-1">
          Welcome back, {user?.name}. Here are your assigned trips.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{stats.dispatched}</p>
              <p className="text-xs text-surface-500">Active Trips</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{stats.completed}</p>
              <p className="text-xs text-surface-500">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Route className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{stats.total}</p>
              <p className="text-xs text-surface-500">Total Trips</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
              ${statusFilter === f.value
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Trip List */}
      {loading ? (
        <LoadingSpinner size="lg" className="min-h-[200px]" />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No trips found"
          description={statusFilter ? 'No trips match this filter.' : 'You have no assigned trips yet.'}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {trips.map((trip, i) => (
              <motion.div
                key={trip._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    {/* Trip Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-brand-500" />
                          <span className="font-semibold text-surface-900 text-sm">
                            {trip.origin} → {trip.destination}
                          </span>
                        </div>
                        <Badge color={statusConfig[trip.status]?.color || 'gray'}>
                          {statusConfig[trip.status]?.label || trip.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-surface-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          {trip.vehicle?.name || 'N/A'} ({trip.vehicle?.registrationNumber || ''})
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {trip.cargoDescription || 'No cargo info'} — {trip.cargoWeight} {trip.cargoUnit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(trip.createdAt)}
                        </span>
                      </div>

                      {trip.startOdometer > 0 && (
                        <div className="flex items-center gap-1 text-xs text-surface-400">
                          <Gauge className="w-3.5 h-3.5" />
                          Start: {trip.startOdometer.toLocaleString()} km
                          {trip.endOdometer > 0 && (
                            <span className="ml-2">
                              End: {trip.endOdometer.toLocaleString()} km
                              <span className="ml-1 text-emerald-600 font-medium">
                                ({(trip.endOdometer - trip.startOdometer).toLocaleString()} km traveled)
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    {trip.status === 'dispatched' && (
                      <button
                        onClick={() => handleComplete(trip)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Trip
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Complete Trip Modal */}
      <TripCompleteModal
        isOpen={!!completeTrip}
        onClose={() => setCompleteTrip(null)}
        trip={completeTrip}
        onSuccess={() => {
          setCompleteTrip(null);
          fetchTrips();
        }}
      />
    </div>
  );
}
