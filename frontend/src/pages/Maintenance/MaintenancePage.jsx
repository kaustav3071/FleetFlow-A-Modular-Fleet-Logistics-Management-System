import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wrench, Edit, Trash2, Eye, CheckCircle } from 'lucide-react';
import { maintenanceAPI } from '../../api/maintenance.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import SearchBar from '../../components/ui/SearchBar.jsx';
import Table from '../../components/ui/Table.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import MaintenanceFormModal from './MaintenanceFormModal.jsx';
import MaintenanceDetailModal from './MaintenanceDetailModal.jsx';
import { MAINTENANCE_STATUS, SERVICE_TYPES } from '../../utils/constants.js';
import { formatDate, formatCurrency } from '../../utils/formatters.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import toast from 'react-hot-toast';

export default function MaintenancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const debouncedSearch = useDebounce(search);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}` };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const { data } = await maintenanceAPI.getAll(params);
      setRecords(data.data?.logs || []);
      setTotalPages(data.data?.pagination?.pages || 1);
    } catch { toast.error('Failed to fetch maintenance records'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, statusFilter, sortField, sortOrder]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await maintenanceAPI.delete(deleteTarget._id); toast.success('Record deleted'); setDeleteTarget(null); fetchRecords(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleComplete = async (id) => {
    setActionLoading(id);
    try { await maintenanceAPI.complete(id); toast.success('Maintenance completed'); fetchRecords(); }
    catch (err) { toast.error(err.response?.data?.message || 'Completion failed'); }
    finally { setActionLoading(null); }
  };

  const columns = [
    {
      key: 'vehicle', label: 'Vehicle',
      render: (val) => (
        <div>
          <p className="font-medium text-surface-200">{val?.name || 'N/A'}</p>
          <p className="text-xs text-surface-500">{val?.licensePlate}</p>
        </div>
      ),
    },
    {
      key: 'serviceType', label: 'Service', sortable: true,
      render: (val) => {
        const found = SERVICE_TYPES.find(s => s.value === val);
        return <span className="text-surface-300 capitalize">{found?.label || val}</span>;
      },
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (val) => {
        const s = MAINTENANCE_STATUS[val] || {};
        return <Badge color={s.color || 'gray'} dot>{s.label || val}</Badge>;
      },
    },
    {
      key: 'cost', label: 'Cost', sortable: true,
      render: (val) => formatCurrency(val || 0),
    },
    {
      key: 'serviceDate', label: 'Service Date', sortable: true,
      render: (val) => val ? formatDate(val) : '-',
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.status === 'in_progress' && (
            <button onClick={(e) => { e.stopPropagation(); handleComplete(row._id); }} disabled={actionLoading === row._id} className="p-1.5 rounded-lg text-surface-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50" title="Mark Complete">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setDetailRecord(row); }} className="p-1.5 rounded-lg text-surface-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
          {row.status !== 'completed' && (
            <button onClick={(e) => { e.stopPropagation(); setEditRecord(row); setShowForm(true); }} className="p-1.5 rounded-lg text-surface-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"><Edit className="w-4 h-4" /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="text-sm text-surface-500 mt-1">Schedule and track vehicle maintenance</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditRecord(null); setShowForm(true); }}>Log Maintenance</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search vehicle, service..." className="w-64" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-base text-sm">
            <option value="">All Status</option>
            {Object.entries(MAINTENANCE_STATUS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? <LoadingSpinner /> : records.length === 0 ? (
          <EmptyState icon={Wrench} title="No maintenance records" description="Log your first maintenance entry" action={<Button icon={Plus} onClick={() => setShowForm(true)}>Log Maintenance</Button>} />
        ) : (
          <>
            <Table columns={columns} data={records} sortField={sortField} sortOrder={sortOrder} onSort={handleSort} onRowClick={(row) => setDetailRecord(row)} />
            <div className="px-4 pb-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
          </>
        )}
      </Card>

      {showForm && <MaintenanceFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditRecord(null); }} record={editRecord} onSuccess={() => { setShowForm(false); setEditRecord(null); fetchRecords(); }} />}
      {detailRecord && <MaintenanceDetailModal isOpen={!!detailRecord} onClose={() => setDetailRecord(null)} record={detailRecord} />}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Maintenance" message="Delete this maintenance record? This action cannot be undone." />
    </motion.div>
  );
}
