// Status color mappings
export const VEHICLE_STATUS = {
  available: { label: 'Available', color: 'emerald' },
  on_trip: { label: 'On Trip', color: 'blue' },
  in_shop: { label: 'In Shop', color: 'amber' },
  retired: { label: 'Retired', color: 'slate' },
};

export const DRIVER_STATUS = {
  on_duty: { label: 'On Duty', color: 'emerald' },
  off_duty: { label: 'Off Duty', color: 'slate' },
  on_trip: { label: 'On Trip', color: 'blue' },
  suspended: { label: 'Suspended', color: 'red' },
};

export const TRIP_STATUS = {
  draft: { label: 'Draft', color: 'slate' },
  dispatched: { label: 'Dispatched', color: 'blue' },
  completed: { label: 'Completed', color: 'emerald' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

export const MAINTENANCE_STATUS = {
  in_progress: { label: 'In Progress', color: 'amber' },
  completed: { label: 'Completed', color: 'emerald' },
};

export const EXPENSE_TYPE_CONFIG = {
  fuel: { label: 'Fuel', color: 'amber' },
  maintenance: { label: 'Maintenance', color: 'blue' },
  toll: { label: 'Toll', color: 'purple' },
  insurance: { label: 'Insurance', color: 'cyan' },
  other: { label: 'Other', color: 'slate' },
};

export const EXPENSE_TYPES = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'toll', label: 'Toll' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
];

export const VEHICLE_TYPES = [
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
  { value: 'bike', label: 'Bike' },
];

export const SERVICE_TYPES = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'tire_replacement', label: 'Tire Replacement' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'engine_repair', label: 'Engine Repair' },
  { value: 'transmission', label: 'Transmission' },
  { value: 'battery', label: 'Battery' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'body_repair', label: 'Body Repair' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'other', label: 'Other' },
];

export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'electric', label: 'Electric' },
  { value: 'cng', label: 'CNG' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const USER_ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'safety_officer', label: 'Safety Officer' },
  { value: 'analyst', label: 'Analyst' },
];
