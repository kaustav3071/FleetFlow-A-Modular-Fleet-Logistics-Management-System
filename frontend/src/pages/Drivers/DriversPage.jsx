import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Edit, Trash2, Eye, Phone, Mail } from 'lucide-react';
import { driversAPI } from '../../api/drivers.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import SearchBar from '../../components/ui/SearchBar.jsx';
import Table from '../../components/ui/Table.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import DriverFormModal from './DriverFormModal.jsx';
import DriverDetailModal from './DriverDetailModal.jsx';
import { DRIVER_STATUS } from '../../utils/constants.js';
import { formatDate } from '../../utils/formatters.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import toast from 'react-hot-toast';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [detailDriver, setDetailDriver] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit: 10,
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const { data } = await driversAPI.getAll(params);
      setDrivers(data.data?.drivers || []);
      setTotalPages(data.data?.pagination?.pages || 1);
    } catch {
      toast.error('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, sortField, sortOrder]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await driversAPI.delete(deleteTarget._id);
      toast.success('Driver deleted');
      setDeleteTarget(null);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  const handleFormSuccess = () => { setShowForm(false); setEditDriver(null); fetchDrivers(); };

  const columns = [
    {
      key: 'name', label: 'Driver', sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400/20 to-brand-600/20 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-brand-500/20">
            {row.avatar ? (
              <img src={row.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-brand-400">{val?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-surface-200">{val}</p>
            <p className="text-xs text-surface-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (val) => <span className="text-surface-400">{val || '-'}</span> },
    {
      key: 'licenseNumber', label: 'License', sortable: true,
      render: (val) => <span className="font-mono text-xs text-surface-400">{val || '-'}</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (val) => {
        const s = DRIVER_STATUS[val] || {};
        return <Badge color={s.color || 'gray'} dot>{s.label || val}</Badge>;
      },
    },
    {
      key: 'licenseExpiry', label: 'License Expiry', sortable: true,
      render: (val) => val ? formatDate(val) : '-',
    },
    {
      key: 'safetyScore', label: 'Safety', sortable: true,
      render: (val) => {
        const score = val ?? 100;
        const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
        return <span className={`font-semibold ${color}`}>{score}</span>;
      },
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setDetailDriver(row); }} className="p-1.5 rounded-lg text-surface-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setEditDriver(row); setShowForm(true); }} className="p-1.5 rounded-lg text-surface-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"><Edit className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Drivers</h1>
          <p className="text-sm text-surface-500 mt-1">Manage fleet drivers</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditDriver(null); setShowForm(true); }}>Add Driver</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, license..." className="w-64" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-base text-sm">
            <option value="">All Status</option>
            {Object.entries(DRIVER_STATUS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? <LoadingSpinner /> : drivers.length === 0 ? (
          <EmptyState icon={Users} title="No drivers found" description="Add your first driver" action={<Button icon={Plus} onClick={() => setShowForm(true)}>Add Driver</Button>} />
        ) : (
          <>
            <Table columns={columns} data={drivers} sortField={sortField} sortOrder={sortOrder} onSort={handleSort} onRowClick={(row) => setDetailDriver(row)} />
            <div className="px-4 pb-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
          </>
        )}
      </Card>

      {showForm && <DriverFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditDriver(null); }} driver={editDriver} onSuccess={handleFormSuccess} />}
      {detailDriver && <DriverDetailModal isOpen={!!detailDriver} onClose={() => setDetailDriver(null)} driver={detailDriver} />}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Driver" message={`Delete driver ${deleteTarget?.name}? This action cannot be undone.`} />
    </motion.div>
  );
}
