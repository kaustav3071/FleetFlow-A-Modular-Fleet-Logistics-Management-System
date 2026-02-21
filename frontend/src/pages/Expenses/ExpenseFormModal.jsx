import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import { expensesAPI } from '../../api/expenses.js';
import { vehiclesAPI } from '../../api/vehicles.js';
import { EXPENSE_TYPES } from '../../utils/constants.js';
import toast from 'react-hot-toast';

export default function ExpenseFormModal({ isOpen, onClose, expense, onSuccess }) {
  const isEdit = !!expense;
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicle: expense?.vehicle?._id || expense?.vehicle || '',
    type: expense?.type || 'fuel',
    amount: expense?.amount || '',
    date: expense?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    description: expense?.description || '',
    vendor: expense?.vendor || '',
    odometerReading: expense?.odometerReading || '',
    fuelQuantity: expense?.fuelQuantity || '',
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
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) formData.append(key, val);
      });
      if (receipt) formData.append('receipt', receipt);

      if (isEdit) {
        await expensesAPI.update(expense._id, formData);
        toast.success('Expense updated');
      } else {
        await expensesAPI.create(formData);
        toast.success('Expense created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally { setLoading(false); }
  };

  const vehicleOptions = vehicles.map(v => ({ value: v._id, label: `${v.registrationNumber} — ${v.make} ${v.model}` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select name="vehicle" label="Vehicle" options={vehicleOptions} value={form.vehicle} onChange={handleChange} placeholder="Select vehicle" />
          <Select name="type" label="Expense Type" options={EXPENSE_TYPES} value={form.type} onChange={handleChange} />
          <Input name="amount" label="Amount (₹)" type="number" step="0.01" value={form.amount} onChange={handleChange} required placeholder="5000" />
          <Input name="date" label="Date" type="date" value={form.date} onChange={handleChange} required />
          <Input name="vendor" label="Vendor" value={form.vendor} onChange={handleChange} placeholder="Fuel Station / Shop" />
          <Input name="odometerReading" label="Odometer (km)" type="number" value={form.odometerReading} onChange={handleChange} />
          {form.type === 'fuel' && (
            <Input name="fuelQuantity" label="Fuel Quantity (liters)" type="number" step="0.1" value={form.fuelQuantity} onChange={handleChange} placeholder="50" />
          )}
        </div>
        <Textarea name="description" label="Description" value={form.description} onChange={handleChange} placeholder="Describe the expense..." />

        <div className="space-y-1.5">
          <label className="label">Receipt</label>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-600 hover:border-brand-500/50 transition-colors cursor-pointer bg-surface-800/30">
            <Upload className="w-5 h-5 text-surface-500" />
            <span className="text-sm text-surface-400">{receipt ? receipt.name : 'Upload receipt image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setReceipt(e.target.files[0])} />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-700">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Update' : 'Create'} Expense</Button>
        </div>
      </form>
    </Modal>
  );
}
