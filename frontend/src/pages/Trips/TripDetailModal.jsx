import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { TRIP_STATUS } from '../../utils/constants.js';
import { formatDate, formatCurrency } from '../../utils/formatters.js';
import { MapPin, Truck, User, Calendar, DollarSign, Package, FileText } from 'lucide-react';

export default function TripDetailModal({ isOpen, onClose, trip }) {
  if (!trip) return null;
  const status = TRIP_STATUS[trip.status] || {};

  const fields = [
    { icon: MapPin, label: 'Origin', value: trip.origin },
    { icon: MapPin, label: 'Destination', value: trip.destination },
    { icon: Truck, label: 'Vehicle', value: trip.vehicle?.name || trip.vehicle?.licensePlate || 'Unassigned' },
    { icon: User, label: 'Driver', value: trip.driver?.name || 'Unassigned' },
    { icon: Calendar, label: 'Created', value: trip.createdAt ? formatDate(trip.createdAt) : 'N/A' },
    { icon: DollarSign, label: 'Est. Cost', value: trip.estimatedCost ? formatCurrency(trip.estimatedCost) : 'N/A' },
    { icon: Package, label: 'Cargo', value: trip.cargoDescription || 'N/A' },
    { icon: Package, label: 'Weight', value: trip.cargoWeight ? `${trip.cargoWeight} ${trip.cargoUnit || 'kg'}` : 'N/A' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Details" size="md">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">{trip.origin} → {trip.destination}</h3>
            <p className="text-sm text-surface-400 mt-1">Created {formatDate(trip.createdAt)}</p>
          </div>
          <Badge color={status.color || 'gray'} dot size="md">{status.label || trip.status}</Badge>
        </div>

        {/* Status Timeline */}
        <div className="flex items-center gap-2">
          {['draft', 'dispatched', 'completed'].map((s, i) => {
            const stages = ['draft', 'dispatched', 'completed'];
            const currentIdx = stages.indexOf(trip.status);
            const isCancelled = trip.status === 'cancelled';
            const isActive = stages.indexOf(s) <= currentIdx && !isCancelled;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isActive ? 'bg-brand-500' : 'bg-surface-300'} ${isCancelled && s === 'draft' ? 'bg-red-400' : ''}`} />
                <div className={`h-0.5 flex-1 ${i < 2 ? (isActive && stages.indexOf(s) < currentIdx ? 'bg-brand-500' : 'bg-surface-200') : 'hidden'}`} />
              </div>
            );
          })}
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

        {trip.notes && (
          <div className="p-3 rounded-xl bg-surface-50">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-surface-500" />
              <p className="text-xs text-surface-500">Notes</p>
            </div>
            <p className="text-sm text-surface-700">{trip.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
