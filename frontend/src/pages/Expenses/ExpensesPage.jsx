import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Receipt, Edit, Trash2, Eye } from 'lucide-react';
import { expensesAPI } from '../../api/expenses.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import SearchBar from '../../components/ui/SearchBar.jsx';
import Table from '../../components/ui/Table.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import ExpenseFormModal from './ExpenseFormModal.jsx';
import ExpenseDetailModal from './ExpenseDetailModal.jsx';
import { EXPENSE_TYPES } from '../../utils/constants.js';
import { formatDate, formatCurrency } from '../../utils/formatters.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [detailExpense, setDetailExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}` };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.type = typeFilter;
      const { data } = await expensesAPI.getAll(params);
      setExpenses(data.data?.expenses || []);
      setTotalPages(data.data?.pagination?.pages || 1);
    } catch { toast.error('Failed to fetch expenses'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, typeFilter, sortField, sortOrder]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await expensesAPI.delete(deleteTarget._id); toast.success('Expense deleted'); setDeleteTarget(null); fetchExpenses(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const typeColors = { fuel: 'orange', maintenance: 'blue', toll: 'purple', insurance: 'cyan', other: 'gray' };

  const columns = [
    {
      key: 'type', label: 'Type', sortable: true,
      render: (val) => {
        const found = EXPENSE_TYPES.find(t => t.value === val);
        return <Badge color={typeColors[val] || 'gray'} dot>{found?.label || val}</Badge>;
      },
    },
    {
      key: 'vehicle', label: 'Vehicle',
      render: (val) => (
        <span className="text-surface-300">{val?.registrationNumber || 'N/A'}</span>
      ),
    },
    {
      key: 'amount', label: 'Amount', sortable: true,
      render: (val) => <span className="font-semibold text-surface-200">{formatCurrency(val || 0)}</span>,
    },
    {
      key: 'date', label: 'Date', sortable: true,
      render: (val) => formatDate(val),
    },
    {
      key: 'description', label: 'Description',
      render: (val) => <span className="text-surface-400 truncate max-w-[200px] block">{val || '-'}</span>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setDetailExpense(row); }} className="p-1.5 rounded-lg text-surface-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setEditExpense(row); setShowForm(true); }} className="p-1.5 rounded-lg text-surface-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"><Edit className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="text-sm text-surface-500 mt-1">Track fleet expenses by category</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditExpense(null); setShowForm(true); }}>Add Expense</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search description, vehicle..." className="w-64" />
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="input-base text-sm">
            <option value="">All Types</option>
            {EXPENSE_TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? <LoadingSpinner /> : expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="No expenses found" description="Log your first expense" action={<Button icon={Plus} onClick={() => setShowForm(true)}>Add Expense</Button>} />
        ) : (
          <>
            <Table columns={columns} data={expenses} sortField={sortField} sortOrder={sortOrder} onSort={handleSort} onRowClick={(row) => setDetailExpense(row)} />
            <div className="px-4 pb-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
          </>
        )}
      </Card>

      {showForm && <ExpenseFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditExpense(null); }} expense={editExpense} onSuccess={() => { setShowForm(false); setEditExpense(null); fetchExpenses(); }} />}
      {detailExpense && <ExpenseDetailModal isOpen={!!detailExpense} onClose={() => setDetailExpense(null)} expense={detailExpense} />}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Expense" message="Delete this expense? Vehicle cost will be adjusted." />
    </motion.div>
  );
}
