import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { DRIVER_STATUS } from '../../utils/constants.js';
import { formatDate } from '../../utils/formatters.js';
import { User, Phone, Mail, CreditCard, Calendar, Shield, MapPin } from 'lucide-react';

export default function DriverDetailModal({ isOpen, onClose, driver }) {
  if (!driver) return null;
  const status = DRIVER_STATUS[driver.status] || {};

  const safetyScore = driver.safetyScore ?? 100;
  const safetyColor = safetyScore >= 80 ? 'emerald' : safetyScore >= 60 ? 'yellow' : 'red';

  const fields = [
    { icon: Mail, label: 'Email', value: driver.email },
    { icon: Phone, label: 'Phone', value: driver.phone || 'N/A' },
    { icon: CreditCard, label: 'License', value: driver.licenseNumber },
    { icon: Calendar, label: 'License Expiry', value: driver.licenseExpiry ? formatDate(driver.licenseExpiry) : 'N/A' },
    { icon: Shield, label: 'Safety Score', value: safetyScore },
    { icon: MapPin, label: 'Address', value: driver.address || 'N/A' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Driver Details" size="md">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400/20 to-brand-600/20 flex items-center justify-center overflow-hidden ring-2 ring-brand-500/20">
            {driver.avatar ? (
              <img src={driver.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-brand-400">{driver.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{driver.name}</h3>
            <p className="text-sm text-surface-400">{driver.experience ? `${driver.experience} yrs experience` : 'Driver'}</p>
            <div className="flex gap-2 mt-2">
              <Badge color={status.color || 'gray'} dot>{status.label || driver.status}</Badge>
              <Badge color={safetyColor}>Score: {safetyScore}</Badge>
            </div>
          </div>
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
      </div>
    </Modal>
  );
}
