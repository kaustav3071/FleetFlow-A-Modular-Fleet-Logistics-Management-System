import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { VEHICLE_STATUS } from '../../utils/constants.js';
import { formatCurrency, formatKm } from '../../utils/formatters.js';
import { Truck, Fuel, Gauge, DollarSign, FileText, MapPin, Package } from 'lucide-react';

export default function VehicleDetailModal({ isOpen, onClose, vehicle }) {
  if (!vehicle) return null;
  const status = VEHICLE_STATUS[vehicle.status] || {};

  const fields = [
    { icon: Truck, label: 'Type', value: vehicle.type },
    { icon: Fuel, label: 'Fuel Type', value: vehicle.fuelType },
    { icon: Gauge, label: 'Odometer', value: formatKm(vehicle.currentOdometer || 0) },
    { icon: Package, label: 'Max Capacity', value: `${vehicle.maxLoadCapacity || 0} ${vehicle.capacityUnit || 'kg'}` },
    { icon: MapPin, label: 'Region', value: vehicle.region || 'N/A' },
    { icon: DollarSign, label: 'Fuel Cost', value: formatCurrency(vehicle.totalFuelCost || 0) },
    { icon: DollarSign, label: 'Maintenance Cost', value: formatCurrency(vehicle.totalMaintenanceCost || 0) },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vehicle Details" size="md">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {vehicle.image ? (
              <img src={vehicle.image} alt="" className="w-16 h-16 object-cover rounded-xl" />
            ) : (
              <Truck className="w-8 h-8 text-brand-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-surface-900">{vehicle.name}</h3>
            <p className="text-sm text-surface-400">{vehicle.licensePlate} {vehicle.model ? `• ${vehicle.model}` : ''}</p>
            <Badge color={status.color || 'gray'} dot className="mt-2">{status.label || vehicle.status}</Badge>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50">
              <f.icon className="w-4 h-4 text-surface-500 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500">{f.label}</p>
                <p className="text-sm font-medium text-surface-800 capitalize">{f.value}</p>
              </div>
            </div>
          ))}
        </div>

        {vehicle.notes && (
          <div className="p-3 rounded-xl bg-surface-50">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-surface-500" />
              <p className="text-xs text-surface-500">Notes</p>
            </div>
            <p className="text-sm text-surface-700">{vehicle.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
