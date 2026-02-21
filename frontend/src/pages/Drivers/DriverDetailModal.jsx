import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { DRIVER_STATUS } from '../../utils/constants.js';
import { formatDate } from '../../utils/formatters.js';
import { User, Phone, Mail, CreditCard, Calendar, Shield, Truck, FileText } from 'lucide-react';

export default function DriverDetailModal({ isOpen, onClose, driver }) {
  if (!driver) return null;
  const status = DRIVER_STATUS[driver.status] || {};

  const safetyScore = driver.safetyScore ?? 100;
  const safetyColor = safetyScore >= 80 ? 'emerald' : safetyScore >= 60 ? 'yellow' : 'red';

  // Format license categories
  const licenseCategories = Array.isArray(driver.licenseCategory)
    ? driver.licenseCategory.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')
    : driver.licenseCategory || 'N/A';

  const fields = [
    { icon: Mail, label: 'Email', value: driver.email || 'N/A' },
    { icon: Phone, label: 'Phone', value: driver.phone || 'N/A' },
    { icon: CreditCard, label: 'License Number', value: driver.licenseNumber },
    { icon: Truck, label: 'License Categories', value: licenseCategories },
    { icon: Calendar, label: 'License Expiry', value: driver.licenseExpiry ? formatDate(driver.licenseExpiry) : 'N/A' },
    { icon: Shield, label: 'Safety Score', value: safetyScore },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Driver Details" size="md">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400/20 to-brand-600/20 flex items-center justify-center overflow-hidden ring-2 ring-brand-500/20">
            {driver.avatar ? (
              <img src={driver.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-brand-600">{driver.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-surface-900">{driver.name}</h3>
            <p className="text-sm text-surface-400">
              {driver.totalTripsCompleted || 0} trips completed
            </p>
            <div className="flex gap-2 mt-2">
              <Badge color={status.color || 'gray'} dot>{status.label || driver.status}</Badge>
              <Badge color={safetyColor}>Score: {safetyScore}</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50">
              <f.icon className="w-4 h-4 text-surface-500 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500">{f.label}</p>
                <p className="text-sm font-medium text-surface-800">{f.value}</p>
              </div>
            </div>
          ))}
        </div>

        {driver.notes && (
          <div className="p-3 rounded-xl bg-surface-50">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-surface-500" />
              <p className="text-xs text-surface-500">Notes</p>
            </div>
            <p className="text-sm text-surface-700">{driver.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
