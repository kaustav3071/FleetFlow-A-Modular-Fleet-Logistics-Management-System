import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Truck, Filter, Search, Edit, Trash2, Eye, MoreVertical
} from 'lucide-react';
import { vehiclesAPI } from '../../api/vehicles.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import SearchBar from '../../components/ui/SearchBar.jsx';
import Table from '../../components/ui/Table.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import VehicleFormModal from './VehicleFormModal.jsx';
import VehicleDetailModal from './VehicleDetailModal.jsx';
import { VEHICLE_STATUS, VEHICLE_TYPES } from '../../utils/constants.js';
import { formatCurrency, formatKm, formatDate } from '../../utils/formatters.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import toast from 'react-hot-toast';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const { data } = await vehiclesAPI.getAll(params);
      setVehicles(data.data?.vehicles || []);
      setTotalPages(data.data?.pagination?.pages || 1);
    } catch {
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter, sortField, sortOrder]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await vehiclesAPI.delete(deleteTarget._id);
      toast.success('Vehicle deleted');
      setDeleteTarget(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditVehicle(null);
    fetchVehicles();
  };

  const columns = [
    {
      key: 'registrationNumber',
      label: 'Registration',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-700/50 flex items-center justify-center flex-shrink-0">
            {row.image ? (
              <img src={row.image} alt="" className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <Truck className="w-4 h-4 text-brand-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-surface-200">{val}</p>
            <p className="text-xs text-surface-500">{row.make} {row.model}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (val) => <span className="capitalize text-surface-400">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => {
        const s = VEHICLE_STATUS[val] || {};
        return <Badge color={s.color || 'gray'} dot>{s.label || val}</Badge>;
      },
    },
    {
      key: 'odometerReading',
      label: 'Odometer',
      sortable: true,
      render: (val) => formatKm(val || 0),
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      sortable: true,
      render: (val) => formatCurrency(val || 0),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setDetailVehicle(row); }}
            className="p-1.5 rounded-lg text-surface-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditVehicle(row); setShowForm(true); }}
            className="p-1.5 rounded-lg text-surface-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Vehicles</h1>
          <p className="text-sm text-surface-500 mt-1">Manage your fleet vehicles</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditVehicle(null); setShowForm(true); }}>
          Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search registration, make, model..."
            className="w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-base text-sm"
          >
            <option value="">All Status</option>
            {Object.entries(VEHICLE_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="input-base text-sm"
          >
            <option value="">All Types</option>
            {VEHICLE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No vehicles found"
            description="Add your first vehicle to start managing your fleet"
            action={<Button icon={Plus} onClick={() => setShowForm(true)}>Add Vehicle</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={vehicles}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              onRowClick={(row) => setDetailVehicle(row)}
            />
            <div className="px-4 pb-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      {/* Modals */}
      {showForm && (
        <VehicleFormModal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditVehicle(null); }}
          vehicle={editVehicle}
          onSuccess={handleFormSuccess}
        />
      )}
      {detailVehicle && (
        <VehicleDetailModal
          isOpen={!!detailVehicle}
          onClose={() => setDetailVehicle(null)}
          vehicle={detailVehicle}
        />
      )}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Vehicle"
        message={`Delete vehicle ${deleteTarget?.registrationNumber}? This action cannot be undone.`}
      />
    </motion.div>
  );
}
