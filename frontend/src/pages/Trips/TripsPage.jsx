import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Route, Edit, Trash2, Eye, Send, CheckCircle, XCircle } from 'lucide-react';
import { tripsAPI } from '../../api/trips.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import SearchBar from '../../components/ui/SearchBar.jsx';
import Table from '../../components/ui/Table.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import TripFormModal from './TripFormModal.jsx';
import TripDetailModal from './TripDetailModal.jsx';
import TripCompleteModal from './TripCompleteModal.jsx';
import TripDispatchModal from './TripDispatchModal.jsx';
import { TRIP_STATUS } from '../../utils/constants.js';
import { formatDate, formatCurrency } from '../../utils/formatters.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';

export default function TripsPage() {
  const toast = useToast();
  const { can } = usePermissions('trips');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [detailTrip, setDetailTrip] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [completeTrip, setCompleteTrip] = useState(null);
  const [dispatchTrip, setDispatchTrip] = useState(null);

  const debouncedSearch = useDebounce(search);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}` };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await tripsAPI.getAll(params);
      setTrips(data.data?.trips || []);
      setTotalPages(data.data?.pagination?.pages || 1);
    } catch { toast.error('Failed to fetch trips'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, statusFilter, sortField, sortOrder]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await tripsAPI.delete(deleteTarget._id); toast.success('Trip deleted'); setDeleteTarget(null); fetchTrips(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleDispatch = (trip) => {
    setDispatchTrip(trip);
  };

  // Open the complete modal instead of completing directly
  const handleComplete = (trip) => {
    setCompleteTrip(trip);
  };

  const handleCancel = async (tripId) => {
    setActionLoading(tripId);
    try { await tripsAPI.cancel(tripId); toast.success('Trip cancelled'); fetchTrips(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cancel failed'); }
    finally { setActionLoading(null); }
  };

  const columns = [
    {
      key: 'origin', label: 'Route', sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-surface-800">{val}</p>
          <p className="text-xs text-surface-500">→ {row.destination}</p>
        </div>
      ),
    },
    {
      key: 'vehicle', label: 'Vehicle',
      render: (val) => <span className="text-surface-400">{val?.name || val?.licensePlate || '-'}</span>,
    },
    {
      key: 'driver', label: 'Driver',
      render: (val) => <span className="text-surface-400">{val?.name || val || '-'}</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (val) => {
        const s = TRIP_STATUS[val] || {};
        return <Badge color={s.color || 'gray'} dot>{s.label || val}</Badge>;
      },
    },
    {
      key: 'createdAt', label: 'Created', sortable: true,
      render: (val) => val ? formatDate(val) : '-',
    },
    {
      key: 'estimatedCost', label: 'Est. Cost', sortable: true,
      render: (val) => val ? formatCurrency(val) : '-',
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {can.edit && row.status === 'draft' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDispatch(row); }}
              disabled={actionLoading === row._id}
              className="p-1.5 rounded-lg text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 cursor-pointer disabled:opacity-50 hover:scale-110"
              title="Dispatch"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
          {can.edit && row.status === 'dispatched' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleComplete(row); }} disabled={actionLoading === row._id} className="p-1.5 rounded-lg text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 cursor-pointer disabled:opacity-50 hover:scale-110" title="Complete">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleCancel(row._id); }} disabled={actionLoading === row._id} className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer disabled:opacity-50 hover:scale-110" title="Cancel">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button onClick={(e) => { e.stopPropagation(); setDetailTrip(row); }} className="p-1.5 rounded-lg text-surface-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 cursor-pointer hover:scale-110" title="View"><Eye className="w-4 h-4" /></button>
          {can.edit && ['draft'].includes(row.status) && (
            <button onClick={(e) => { e.stopPropagation(); setEditTrip(row); setShowForm(true); }} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 cursor-pointer hover:scale-110" title="Edit"><Edit className="w-4 h-4" /></button>
          )}
          {can.delete && ['draft', 'cancelled'].includes(row.status) && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer hover:scale-110" title="Delete"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Trips</h1>
          <p className="text-sm text-surface-500 mt-1">Manage trip lifecycle — draft → dispatch → complete</p>
        </div>
        {can.create && <Button icon={Plus} onClick={() => { setEditTrip(null); setShowForm(true); }}>Create Trip</Button>}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search origin, destination..." className="w-64" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-base text-sm">
            <option value="">All Status</option>
            {Object.entries(TRIP_STATUS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? <LoadingSpinner /> : trips.length === 0 ? (
          <EmptyState icon={Route} title="No trips found" description="Create your first trip" action={can.create ? <Button icon={Plus} onClick={() => setShowForm(true)}>Create Trip</Button> : null} />
        ) : (
          <>
            <Table columns={columns} data={trips} sortField={sortField} sortOrder={sortOrder} onSort={handleSort} onRowClick={(row) => setDetailTrip(row)} />
            <div className="px-4 pb-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
          </>
        )}
      </Card>

      {showForm && <TripFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditTrip(null); }} trip={editTrip} onSuccess={() => { setShowForm(false); setEditTrip(null); fetchTrips(); }} />}
      {detailTrip && <TripDetailModal isOpen={!!detailTrip} onClose={() => setDetailTrip(null)} trip={detailTrip} />}
      {completeTrip && <TripCompleteModal isOpen={!!completeTrip} onClose={() => setCompleteTrip(null)} trip={completeTrip} onSuccess={() => { setCompleteTrip(null); fetchTrips(); }} />}
      {dispatchTrip && <TripDispatchModal isOpen={!!dispatchTrip} onClose={() => setDispatchTrip(null)} trip={dispatchTrip} onSuccess={() => { setDispatchTrip(null); fetchTrips(); }} />}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Trip" message={`Delete this trip from ${deleteTarget?.origin} to ${deleteTarget?.destination}?`} />
    </motion.div>
  );
}
