import { useState, useEffect, useMemo } from 'react';
import { MapPin, Truck, Users, Send } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import { tripsAPI } from '../../api/trips.js';
import { driversAPI } from '../../api/drivers.js';
import { vehiclesAPI } from '../../api/vehicles.js';
import { useToast } from '../../components/ui/Toast.jsx';

export default function TripDispatchModal({ isOpen, onClose, trip, onSuccess }) {
  const toast = useToast();
  const [driverId, setDriverId] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDrivers, setFetchingDrivers] = useState(true);

  useEffect(() => {
    if (!trip) return;
    const fetchDrivers = async () => {
      setFetchingDrivers(true);
      try {
        // Fetch the vehicle to filter drivers by type
        let vehicleType = trip.vehicle?.type;
        if (!vehicleType && trip.vehicle?._id) {
          const { data } = await vehiclesAPI.getById(trip.vehicle._id);
          vehicleType = data.data?.vehicle?.type;
        }
        const params = vehicleType ? { vehicleType } : {};
        const { data } = await driversAPI.getAvailable(params);
        setDrivers(data.data?.drivers || []);
      } catch {
        toast.error('Failed to load available drivers');
      } finally {
        setFetchingDrivers(false);
      }
    };
    fetchDrivers();
  }, [trip]);

  if (!trip) return null;

  const driverOptions = drivers.map(d => ({
    value: d._id,
    label: `${d.name} — ${d.licenseNumber} (${d.licenseCategory.join(', ')})`,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!driverId) {
      toast.error('Please select a driver to dispatch this trip.');
      return;
    }
    setLoading(true);
    try {
      await tripsAPI.dispatch(trip._id, { driver: driverId });
      toast.success('Trip dispatched successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dispatch Trip" size="md">
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
              {trip.vehicle?.name || 'N/A'}
            </span>
            {trip.cargoWeight && (
              <span>Cargo: {trip.cargoWeight} {trip.cargoUnit || 'kg'}</span>
            )}
          </div>
        </div>

        {/* Driver Selection */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-brand-500" />
            <label className="text-sm font-medium text-surface-700">Assign a Driver</label>
          </div>
          {fetchingDrivers ? (
            <div className="text-sm text-surface-400 py-3">Loading available drivers...</div>
          ) : drivers.length === 0 ? (
            <div className="text-sm text-red-500 py-3">No available drivers found. Make sure drivers are on duty with valid licenses.</div>
          ) : (
            <Select
              name="driver"
              options={driverOptions}
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="Select a driver"
              required
            />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!driverId || fetchingDrivers}
            icon={Send}
          >
            Dispatch Trip
          </Button>
        </div>
      </form>
    </Modal>
  );
}
