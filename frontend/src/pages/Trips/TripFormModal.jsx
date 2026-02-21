import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import { tripsAPI } from '../../api/trips.js';
import { vehiclesAPI } from '../../api/vehicles.js';
import { driversAPI } from '../../api/drivers.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function TripFormModal({ isOpen, onClose, trip, onSuccess }) {
  const isEdit = !!trip;
  const { user } = useAuth();
  const isDispatcher = user?.role === 'dispatcher';
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({
    origin: trip?.origin || '',
    destination: trip?.destination || '',
    vehicle: trip?.vehicle?._id || trip?.vehicle || '',
    driver: trip?.driver?._id || trip?.driver || '',
    estimatedCost: trip?.estimatedCost || '',
    cargoDescription: trip?.cargoDescription || '',
    cargoWeight: trip?.cargoWeight || '',
    cargoUnit: trip?.cargoUnit || 'kg',
    notes: trip?.notes || '',
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          vehiclesAPI.getAvailable(),
          driversAPI.getAvailable(),
        ]);
        setVehicles(vRes.data.data?.vehicles || []);
        setDrivers(dRes.data.data?.drivers || []);
      } catch {
        // silently fail, options will be empty
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // CargoWeight > MaxCapacity validation (from problem statement)
  const selectedVehicle = useMemo(
    () => vehicles.find(v => v._id === form.vehicle),
    [vehicles, form.vehicle]
  );

  const cargoWeightNum = parseFloat(form.cargoWeight) || 0;
  const maxCapacity = selectedVehicle?.maxLoadCapacity || 0;

  // Convert cargo weight to kg for comparison if units differ
  const cargoInKg = form.cargoUnit === 'tons' ? cargoWeightNum * 1000 : cargoWeightNum;
  const capacityInKg = selectedVehicle?.capacityUnit === 'tons'
    ? maxCapacity * 1000
    : maxCapacity;

  const isOverweight = cargoInKg > 0 && capacityInKg > 0 && cargoInKg > capacityInKg;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Block submission if overweight
    if (isOverweight) {
      toast.error(`Cargo weight (${cargoInKg} kg) exceeds vehicle capacity (${capacityInKg} kg). Choose a larger vehicle or reduce cargo.`);
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      if (payload.estimatedCost) payload.estimatedCost = Number(payload.estimatedCost);
      if (payload.cargoWeight) payload.cargoWeight = Number(payload.cargoWeight);

      if (isEdit) {
        await tripsAPI.update(trip._id, payload);
        toast.success('Trip updated');
      } else {
        await tripsAPI.create(payload);
        toast.success(isDispatcher ? 'Trip created and dispatched' : 'Trip created as draft');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save trip');
    } finally { setLoading(false); }
  };

  const vehicleOptions = vehicles.map(v => ({
    value: v._id,
    label: `${v.name} — ${v.licensePlate} (${v.maxLoadCapacity || '?'} ${v.capacityUnit || 'kg'})`,
  }));
  const driverOptions = drivers.map(d => ({ value: d._id, label: `${d.name} — ${d.licenseNumber}` }));

  const handleVehicleChange = (e) => {
    const selectedVehicleId = e.target.value;
    setForm({ ...form, vehicle: selectedVehicleId });

    // Find the selected vehicle
    const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId);

    if (selectedVehicle) {
      // Filter drivers based on vehicle type and license category
      const filteredDrivers = drivers.filter(driver => {
        if (driver.licenseCategory.includes('truck')) return true; // Truck drivers can drive all vehicles
        if (driver.licenseCategory.includes('van') && selectedVehicle.type !== 'truck') return true; // Van drivers can drive van, bike, and car
        if (driver.licenseCategory.includes('bike') && selectedVehicle.type === 'bike') return true; // Bike drivers can only drive bikes
        return false;
      });

      setDrivers(filteredDrivers);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Trip' : 'Create Trip'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="origin" label="Origin" value={form.origin} onChange={handleChange} required placeholder="Mumbai" />
          <Input name="destination" label="Destination" value={form.destination} onChange={handleChange} required placeholder="Delhi" />
          <Select
            name="vehicle"
            label="Vehicle"
            options={vehicleOptions}
            value={form.vehicle}
            onChange={handleVehicleChange}
            placeholder="Select vehicle"
            required
          />
          {/* Driver field: shown for dispatchers (required), hidden for managers (they only create drafts) */}
          {(isDispatcher || isEdit) && (
            <Select
              name="driver"
              label="Driver"
              options={driverOptions}
              value={form.driver}
              onChange={handleChange}
              placeholder="Select driver"
              required={isDispatcher}
            />
          )}
          <Input name="estimatedCost" label="Estimated Cost (₹)" type="number" step="0.01" value={form.estimatedCost} onChange={handleChange} placeholder="15000" />
          <Input name="cargoDescription" label="Cargo Description" value={form.cargoDescription} onChange={handleChange} placeholder="Electronics, 50 boxes" />
          <Input
            name="cargoWeight"
            label="Cargo Weight"
            type="number"
            step="0.1"
            value={form.cargoWeight}
            onChange={handleChange}
            placeholder="500"
            required
            error={isOverweight ? `Exceeds max capacity of ${capacityInKg} kg` : ''}
          />
          <Select name="cargoUnit" label="Weight Unit" options={[{ value: 'kg', label: 'Kilograms (kg)' }, { value: 'tons', label: 'Tons' }]} value={form.cargoUnit} onChange={handleChange} />
        </div>

        {/* Overweight Warning Banner */}
        <AnimatePresence>
          {isOverweight && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Cargo exceeds vehicle capacity</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Cargo: <strong>{cargoInKg} kg</strong> • Vehicle Max Capacity: <strong>{capacityInKg} kg</strong>
                  <br />Select a larger vehicle or reduce cargo weight to proceed.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Textarea name="notes" label="Notes" value={form.notes} onChange={handleChange} placeholder="Additional trip notes..." />

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} disabled={isOverweight}>
            {isEdit ? 'Update' : 'Create'} Trip
          </Button>
        </div>
      </form>
    </Modal>
  );
}
