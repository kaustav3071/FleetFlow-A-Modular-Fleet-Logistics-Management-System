import { useState } from 'react';
import { Upload } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import { driversAPI } from '../../api/drivers.js';
import { useToast } from '../../components/ui/Toast.jsx';

const statusOptions = [
  { value: 'on_duty', label: 'On Duty' },
  { value: 'off_duty', label: 'Off Duty' },
  { value: 'on_trip', label: 'On Trip' },
  { value: 'suspended', label: 'Suspended' },
];

const licenseCategoryOptions = [
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
  { value: 'bike', label: 'Bike' },
];

export default function DriverFormModal({ isOpen, onClose, driver, onSuccess }) {
  const isEdit = !!driver;
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [avatar, setAvatar] = useState(null);
  const [form, setForm] = useState({
    name: driver?.name || '',
    email: driver?.email || '',
    password: '',
    phone: driver?.phone || '',
    licenseNumber: driver?.licenseNumber || '',
    licenseCategory: driver?.licenseCategory || [],
    licenseExpiry: driver?.licenseExpiry?.slice(0, 10) || '',
    status: driver?.status || 'on_duty',
    notes: driver?.notes || '',
  });

  const handleChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === 'select-multiple') {
      const values = Array.from(selectedOptions, option => option.value);
      setForm({ ...form, [name]: values });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleCategoryToggle = (cat) => {
    setForm(prev => ({
      ...prev,
      licenseCategory: prev.licenseCategory.includes(cat)
        ? prev.licenseCategory.filter(c => c !== cat)
        : [...prev.licenseCategory, cat],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) formData.append(key, val);
      });
      if (avatar) formData.append('avatar', avatar);

      if (isEdit) {
        await driversAPI.update(driver._id, formData);
        toast.success('Driver updated');
      } else {
        const { data } = await driversAPI.create(formData);
        const creds = data.data?.credentials;
        if (creds) {
          toast.success(
            `Driver created!\n\nLogin Email: ${creds.email}\nPassword: ${creds.password}\n\nShare these credentials with the driver.`,
            { duration: 15000 }
          );
        } else {
          toast.success('Driver created');
        }
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save driver');
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Driver' : 'Add Driver'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="name" label="Full Name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
          <Input name="email" label={isEdit ? "Email" : "Email (used for login)"} type="email" value={form.email} onChange={handleChange} required={!isEdit} placeholder="john@example.com" />
          {!isEdit && (
            <Input name="password" label="Password (min 6 chars)" type="password" value={form.password} onChange={handleChange} placeholder="Leave empty for default: driver@123" minLength={form.password ? 6 : undefined} />
          )}
          <Input name="phone" label="Phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          <Input name="licenseNumber" label="License Number" value={form.licenseNumber} onChange={handleChange} required placeholder="DL-1234567890" />
          <Input name="licenseExpiry" label="License Expiry" type="date" value={form.licenseExpiry} onChange={handleChange} required />
          {isEdit && <Select name="status" label="Status" options={statusOptions} value={form.status} onChange={handleChange} />}
        </div>

        {/* License Category - Required */}
        <div className="space-y-1.5">
          <label className="label">License Category <span className="text-red-400">*</span></label>
          <div className="flex flex-wrap gap-2">
            {licenseCategoryOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleCategoryToggle(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.licenseCategory.includes(opt.value)
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-surface-100 border-surface-200 text-surface-600 hover:border-brand-500/50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {form.licenseCategory.length === 0 && <p className="text-xs text-surface-500">Select at least one category</p>}
        </div>

        <Input name="notes" label="Notes" value={form.notes} onChange={handleChange} placeholder="Additional notes" />

        <div className="space-y-1.5">
          <label className="label">Avatar</label>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 hover:border-brand-500/50 transition-colors cursor-pointer bg-surface-50">
            <Upload className="w-5 h-5 text-surface-500" />
            <span className="text-sm text-surface-500">{avatar ? avatar.name : 'Click to upload photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatar(e.target.files[0])} />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Update' : 'Create'} Driver</Button>
        </div>
      </form>
    </Modal>
  );
}
