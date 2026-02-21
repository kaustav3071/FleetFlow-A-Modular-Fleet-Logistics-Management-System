import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge, MapPin, Truck, User, Fuel } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { tripsAPI } from '../../api/trips.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatCurrency } from '../../utils/formatters.js';

export default function TripCompleteModal({ isOpen, onClose, trip, onSuccess }) {
  const toast = useToast();
  const [endOdometer, setEndOdometer] = useState('');
  const [loading, setLoading] = useState(false);

  if (!trip) return null;

  const startOdometer = trip.startOdometer || 0;
  const endOdometerNum = parseFloat(endOdometer) || 0;
  const distance = endOdometerNum > startOdometer ? endOdometerNum - startOdometer : 0;

  // Estimate fuel cost (default 10 per km if not known)
  const estimatedFuelCost = distance * 10;

  const isValid = endOdometerNum > startOdometer;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error(`End odometer must be greater than start odometer (${startOdometer} km).`);
      return;
    }

    setLoading(true);
    try {
      const { data } = await tripsAPI.complete(trip._id, { endOdometer: endOdometerNum });
      const fuelInfo = data.data?.fuelExpense;
      if (fuelInfo) {
        toast.success(`Trip completed! Distance: ${fuelInfo.distanceTraveled} km. Fuel cost: ₹${fuelInfo.totalFuelCost} auto-added.`);
      } else {
        toast.success('Trip completed successfully!');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Trip" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Trip Summary */}
        <div className="p-4 rounded-xl bg-surface-50 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-surface-500" />
            <span className="font-medium text-surface-800">{trip.origin} → {trip.destination}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              {trip.vehicle?.name || trip.vehicle?.licensePlate || 'N/A'}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {trip.driver?.name || 'N/A'}
            </span>
          </div>
        </div>

        {/* Odometer Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">Start Odometer</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-100 text-sm text-surface-600">
              <Gauge className="w-4 h-4 text-surface-400" />
              {startOdometer.toLocaleString()} km
            </div>
          </div>
          <Input
            name="endOdometer"
            label="End Odometer (km)"
            type="number"
            step="0.1"
            value={endOdometer}
            onChange={(e) => setEndOdometer(e.target.value)}
            placeholder="Enter end reading"
            required
            error={endOdometer && !isValid ? 'Must be greater than start' : ''}
          />
        </div>

        {/* Live Calculation Preview */}
        {distance > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <Fuel className="w-4 h-4" />
              Fuel Expense Preview
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-emerald-600">Distance Traveled</span>
                <p className="font-semibold text-emerald-900 text-sm">{distance.toLocaleString()} km</p>
              </div>
              <div>
                <span className="text-emerald-600">Estimated Fuel Cost</span>
                <p className="font-semibold text-emerald-900 text-sm">{formatCurrency(estimatedFuelCost)}</p>
              </div>
            </div>
            <p className="text-[10px] text-emerald-500 mt-1">
              * Fuel expense will be auto-created based on vehicle's fuel cost per km.
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!isValid}>
            Complete Trip
          </Button>
        </div>
      </form>
    </Modal>
  );
}
