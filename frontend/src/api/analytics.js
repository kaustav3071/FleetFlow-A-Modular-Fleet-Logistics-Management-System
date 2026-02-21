import api from './axios.js';

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCostBreakdown: () => api.get('/analytics/cost-breakdown'),
  getTripsPerVehicle: () => api.get('/analytics/trips-per-vehicle'),
  getMonthlyExpenses: (year) => api.get('/analytics/monthly-expenses', { params: { year } }),
  getFuelEfficiency: () => api.get('/analytics/fuel-efficiency'),
  getVehicleROI: () => api.get('/analytics/vehicle-roi'),
  exportReport: (type, format) => api.get('/analytics/export', {
    params: { type, format },
    responseType: format === 'pdf' ? 'blob' : 'text',
  }),
};
