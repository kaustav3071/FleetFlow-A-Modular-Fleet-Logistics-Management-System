import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { EXPENSE_TYPES } from '../../utils/constants.js';
import { formatDate, formatCurrency, formatKm } from '../../utils/formatters.js';
import { Truck, Tag, DollarSign, Calendar, Store, Fuel, FileText } from 'lucide-react';

export default function ExpenseDetailModal({ isOpen, onClose, expense }) {
  if (!expense) return null;
  const typeLabel = EXPENSE_TYPES.find(t => t.value === expense.type)?.label || expense.type;
  const typeColors = { fuel: 'orange', maintenance: 'blue', toll: 'purple', insurance: 'cyan', other: 'gray' };

  const fields = [
    { icon: Truck, label: 'Vehicle', value: expense.vehicle?.registrationNumber || 'N/A' },
    { icon: Tag, label: 'Type', value: typeLabel },
    { icon: DollarSign, label: 'Amount', value: formatCurrency(expense.amount || 0) },
    { icon: Calendar, label: 'Date', value: formatDate(expense.date) },
    { icon: Store, label: 'Vendor', value: expense.vendor || 'N/A' },
    { icon: Fuel, label: 'Odometer', value: expense.odometerReading ? formatKm(expense.odometerReading) : 'N/A' },
  ];

  if (expense.type === 'fuel' && expense.fuelQuantity) {
    fields.push({ icon: Fuel, label: 'Fuel Qty', value: `${expense.fuelQuantity} liters` });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense Details" size="md">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{formatCurrency(expense.amount || 0)}</h3>
            <p className="text-sm text-surface-400">{expense.vehicle?.registrationNumber}</p>
          </div>
          <Badge color={typeColors[expense.type] || 'gray'} dot size="md">{typeLabel}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/40">
              <f.icon className="w-4 h-4 text-surface-500 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500">{f.label}</p>
                <p className="text-sm font-medium text-surface-200 capitalize">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
        {expense.receipt && (
          <div className="rounded-xl overflow-hidden border border-surface-700">
            <img src={expense.receipt} alt="Receipt" className="w-full max-h-64 object-contain bg-surface-800" />
          </div>
        )}
        {expense.description && (
          <div className="p-3 rounded-xl bg-surface-800/40">
            <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-surface-500" /><p className="text-xs text-surface-500">Description</p></div>
            <p className="text-sm text-surface-300">{expense.description}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
