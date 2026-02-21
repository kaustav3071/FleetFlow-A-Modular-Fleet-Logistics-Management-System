import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import { maintenanceAPI } from '../../api/maintenance.js';
import { vehiclesAPI } from '../../api/vehicles.js';
import { SERVICE_TYPES } from '../../utils/constants.js';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function MaintenanceFormModal({ isOpen, onClose, record, onSuccess }) {
  const isEdit = !!record;
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicle: record?.vehicle?._id || record?.vehicle || '',
    serviceType: record?.serviceType || 'oil_change',
    description: record?.description || '',
    cost: record?.cost || '',
    scheduledDate: record?.scheduledDate?.slice(0, 10) || '',
    status: record?.status || 'scheduled',
    vendor: record?.vendor || '',
    notes: record?.notes || '',
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data } = await vehiclesAPI.getAll({ limit: 100 });
        setVehicles(data.data.vehicles || data.data || []);
      } catch { /* empty */ }
    };
    fetchVehicles();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      if (payload.cost) payload.cost = Number(payload.cost);

      if (isEdit) {
        await maintenanceAPI.update(record._id, payload);
        toast.success('Maintenance record updated');
      } else {
        await maintenanceAPI.create(payload);
        toast.success('Maintenance record created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record');
    } finally { setLoading(false); }
  };

  const vehicleOptions = vehicles.map(v => ({ value: v._id, label: `${v.registrationNumber} — ${v.make} ${v.model}` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Maintenance' : 'Log Maintenance'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select name="vehicle" label="Vehicle" options={vehicleOptions} value={form.vehicle} onChange={handleChange} placeholder="Select vehicle" />
          <Select name="serviceType" label="Service Type" options={SERVICE_TYPES} value={form.serviceType} onChange={handleChange} />
          <Input name="cost" label="Cost (₹)" type="number" step="0.01" value={form.cost} onChange={handleChange} placeholder="5000" />
          <Input name="scheduledDate" label="Scheduled Date" type="date" value={form.scheduledDate} onChange={handleChange} />
          {isEdit && <Select name="status" label="Status" options={statusOptions} value={form.status} onChange={handleChange} />}
          <Input name="vendor" label="Vendor / Workshop" value={form.vendor} onChange={handleChange} placeholder="ABC Motors" />
        </div>
        <Textarea name="description" label="Description" value={form.description} onChange={handleChange} placeholder="Describe the maintenance work..." />
        <Textarea name="notes" label="Notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." />

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-700">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
