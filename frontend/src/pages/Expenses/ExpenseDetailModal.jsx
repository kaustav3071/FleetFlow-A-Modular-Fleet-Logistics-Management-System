import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { EXPENSE_TYPES, EXPENSE_TYPE_CONFIG } from '../../utils/constants.js';
import { formatDate, formatCurrency } from '../../utils/formatters.js';
import { Truck, Tag, DollarSign, Calendar, Fuel, FileText } from 'lucide-react';

export default function ExpenseDetailModal({ isOpen, onClose, expense }) {
  if (!expense) return null;
  const typeConfig = EXPENSE_TYPE_CONFIG[expense.type] || {};
  const typeLabel = typeConfig.label || expense.type;
  const typeColors = { fuel: 'orange', maintenance: 'blue', toll: 'purple', insurance: 'cyan', other: 'gray' };

  const fields = [
    { icon: Truck, label: 'Vehicle', value: expense.vehicle?.name || expense.vehicle?.licensePlate || 'N/A' },
    { icon: Tag, label: 'Type', value: typeLabel },
    { icon: DollarSign, label: 'Cost', value: formatCurrency(expense.cost || 0) },
    { icon: Calendar, label: 'Date', value: formatDate(expense.date) },
  ];

  if (expense.type === 'fuel') {
    if (expense.fuelLiters) {
      fields.push({ icon: Fuel, label: 'Fuel Qty', value: `${expense.fuelLiters} liters` });
    }
    if (expense.pricePerLiter) {
      fields.push({ icon: DollarSign, label: 'Price/Liter', value: formatCurrency(expense.pricePerLiter) });
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense Details" size="md">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{formatCurrency(expense.cost || 0)}</h3>
            <p className="text-sm text-surface-400">{expense.vehicle?.name || expense.vehicle?.licensePlate}</p>
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
