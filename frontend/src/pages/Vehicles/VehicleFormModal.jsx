import { useState } from 'react';
import { Upload } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import { vehiclesAPI } from '../../api/vehicles.js';
import { VEHICLE_TYPES, FUEL_TYPES } from '../../utils/constants.js';
import { useToast } from '../../components/ui/Toast.jsx';

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'on_trip', label: 'On Trip' },
  { value: 'in_shop', label: 'In Shop' },
  { value: 'retired', label: 'Retired' },
];

export default function VehicleFormModal({ isOpen, onClose, vehicle, onSuccess }) {
  const isEdit = !!vehicle;
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({
    name: vehicle?.name || '',
    licensePlate: vehicle?.licensePlate || '',
    model: vehicle?.model || '',
    type: vehicle?.type || 'truck',
    fuelType: vehicle?.fuelType || 'diesel',
    maxLoadCapacity: vehicle?.maxLoadCapacity || '',
    capacityUnit: vehicle?.capacityUnit || 'kg',
    currentOdometer: vehicle?.currentOdometer || 0,
    status: vehicle?.status || 'available',
    region: vehicle?.region || '',
    notes: vehicle?.notes || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) formData.append(key, val);
      });
      if (image) formData.append('image', image);

      if (isEdit) {
        await vehiclesAPI.update(vehicle._id, formData);
        toast.success('Vehicle updated');
      } else {
        await vehiclesAPI.create(formData);
        toast.success('Vehicle created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="name" label="Vehicle Name" value={form.name} onChange={handleChange} required placeholder="Tata Prima 4928" />
          <Input name="licensePlate" label="License Plate" value={form.licensePlate} onChange={handleChange} required placeholder="MH-01-AB-1234" />
          <Input name="model" label="Model" value={form.model} onChange={handleChange} placeholder="Prima" />
          <Select name="type" label="Vehicle Type" options={VEHICLE_TYPES} value={form.type} onChange={handleChange} />
          <Select name="fuelType" label="Fuel Type" options={FUEL_TYPES} value={form.fuelType} onChange={handleChange} />
          <div className="flex gap-2">
            <Input name="maxLoadCapacity" label="Max Load Capacity" type="number" step="0.1" value={form.maxLoadCapacity} onChange={handleChange} required placeholder="1000" className="flex-1" />
            <Select name="capacityUnit" label="Unit" options={[{ value: 'kg', label: 'kg' }, { value: 'tons', label: 'tons' }]} value={form.capacityUnit} onChange={handleChange} className="w-24" />
          </div>
          <Input name="currentOdometer" label="Odometer (km)" type="number" value={form.currentOdometer} onChange={handleChange} />
          <Input name="region" label="Region" value={form.region} onChange={handleChange} placeholder="North India" />
          {isEdit && (
            <Select name="status" label="Status" options={statusOptions} value={form.status} onChange={handleChange} />
          )}
        </div>
        <Textarea name="notes" label="Notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." />

        {/* Image Upload */}
        <div className="space-y-1.5">
          <label className="label">Vehicle Image</label>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 hover:border-brand-500/50 transition-colors cursor-pointer bg-surface-50">
            <Upload className="w-5 h-5 text-surface-500" />
            <span className="text-sm text-surface-500">
              {image ? image.name : 'Click to upload image'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files[0])} />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Update' : 'Create'} Vehicle</Button>
        </div>
      </form>
    </Modal>
  );
}
