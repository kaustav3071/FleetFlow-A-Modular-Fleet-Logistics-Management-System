import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import { tripsAPI } from '../../api/trips.js';
import { vehiclesAPI } from '../../api/vehicles.js';
import { driversAPI } from '../../api/drivers.js';
import toast from 'react-hot-toast';

export default function TripFormModal({ isOpen, onClose, trip, onSuccess }) {
  const isEdit = !!trip;
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({
    origin: trip?.origin || '',
    destination: trip?.destination || '',
    vehicle: trip?.vehicle?._id || trip?.vehicle || '',
    driver: trip?.driver?._id || trip?.driver || '',
    scheduledDate: trip?.scheduledDate?.slice(0, 10) || '',
    estimatedCost: trip?.estimatedCost || '',
    cargoDescription: trip?.cargoDescription || '',
    cargoWeight: trip?.cargoWeight || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      // Remove empty strings
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      if (payload.estimatedCost) payload.estimatedCost = Number(payload.estimatedCost);
      if (payload.cargoWeight) payload.cargoWeight = Number(payload.cargoWeight);

      if (isEdit) {
        await tripsAPI.update(trip._id, payload);
        toast.success('Trip updated');
      } else {
        await tripsAPI.create(payload);
        toast.success('Trip created as draft');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save trip');
    } finally { setLoading(false); }
  };

  const vehicleOptions = vehicles.map(v => ({ value: v._id, label: `${v.registrationNumber} — ${v.make} ${v.model}` }));
  const driverOptions = drivers.map(d => ({ value: d._id, label: `${d.name} — ${d.licenseNumber}` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Trip' : 'Create Trip'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="origin" label="Origin" value={form.origin} onChange={handleChange} required placeholder="Mumbai" />
          <Input name="destination" label="Destination" value={form.destination} onChange={handleChange} required placeholder="Delhi" />
          <Select name="vehicle" label="Vehicle" options={vehicleOptions} value={form.vehicle} onChange={handleChange} placeholder="Select vehicle" />
          <Select name="driver" label="Driver" options={driverOptions} value={form.driver} onChange={handleChange} placeholder="Select driver" />
          <Input name="scheduledDate" label="Scheduled Date" type="date" value={form.scheduledDate} onChange={handleChange} />
          <Input name="estimatedCost" label="Estimated Cost (₹)" type="number" step="0.01" value={form.estimatedCost} onChange={handleChange} placeholder="15000" />
          <Input name="cargoDescription" label="Cargo Description" value={form.cargoDescription} onChange={handleChange} placeholder="Electronics, 50 boxes" />
          <Input name="cargoWeight" label="Cargo Weight (tons)" type="number" step="0.1" value={form.cargoWeight} onChange={handleChange} placeholder="5.5" />
        </div>
        <Textarea name="notes" label="Notes" value={form.notes} onChange={handleChange} placeholder="Additional trip notes..." />

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-700">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Update' : 'Create'} Trip</Button>
        </div>
      </form>
    </Modal>
  );
}
