import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { MAINTENANCE_STATUS, SERVICE_TYPES } from '../../utils/constants.js';
import { formatDate, formatCurrency, formatKm } from '../../utils/formatters.js';
import { Truck, Wrench, Calendar, DollarSign, Store, FileText, Gauge } from 'lucide-react';

export default function MaintenanceDetailModal({ isOpen, onClose, record }) {
  if (!record) return null;
  const status = MAINTENANCE_STATUS[record.status] || {};
  const serviceLabel = SERVICE_TYPES.find(s => s.value === record.serviceType)?.label || record.serviceType;

  const fields = [
    { icon: Truck, label: 'Vehicle', value: record.vehicle?.name || record.vehicle?.licensePlate || 'N/A' },
    { icon: Wrench, label: 'Service Type', value: serviceLabel },
    { icon: DollarSign, label: 'Cost', value: formatCurrency(record.cost || 0) },
    { icon: Calendar, label: 'Service Date', value: record.serviceDate ? formatDate(record.serviceDate) : 'N/A' },
    { icon: Calendar, label: 'Completed', value: record.completedDate ? formatDate(record.completedDate) : 'N/A' },
    { icon: Gauge, label: 'Odometer at Service', value: record.odometerAtService ? formatKm(record.odometerAtService) : 'N/A' },
    { icon: Store, label: 'Vendor', value: record.vendor || 'N/A' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Maintenance Details" size="md">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white capitalize">{serviceLabel}</h3>
            <p className="text-sm text-surface-400">{record.vehicle?.name || record.vehicle?.licensePlate}</p>
          </div>
          <Badge color={status.color || 'gray'} dot size="md">{status.label || record.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/40">
              <f.icon className="w-4 h-4 text-surface-500 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500">{f.label}</p>
                <p className="text-sm font-medium text-surface-200">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
        {record.description && (
          <div className="p-3 rounded-xl bg-surface-800/40">
            <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-surface-500" /><p className="text-xs text-surface-500">Description</p></div>
            <p className="text-sm text-surface-300">{record.description}</p>
          </div>
        )}
        {record.notes && (
          <div className="p-3 rounded-xl bg-surface-800/40">
            <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-surface-500" /><p className="text-xs text-surface-500">Notes</p></div>
            <p className="text-sm text-surface-300">{record.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
