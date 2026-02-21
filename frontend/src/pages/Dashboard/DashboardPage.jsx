import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, Users, Route, Wrench, Receipt, TrendingUp,
  AlertTriangle, Fuel, PackageCheck, Clock
} from 'lucide-react';
import { analyticsAPI } from '../../api/analytics.js';
import { tripsAPI } from '../../api/trips.js';
import StatCard from '../../components/ui/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import AreaChartComponent from '../../components/charts/AreaChart.jsx';
import DonutChart from '../../components/charts/DonutChart.jsx';
import BarChartComponent from '../../components/charts/BarChart.jsx';
import { formatCurrency, formatDate, formatKm } from '../../utils/formatters.js';
import { TRIP_STATUS, VEHICLE_STATUS } from '../../utils/constants.js';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, monthlyRes, costRes, tripsRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getMonthlyExpenses().catch(() => ({ data: { data: { monthlyExpenses: [] } } })),
          analyticsAPI.getCostBreakdown().catch(() => ({ data: { data: { breakdown: [] } } })),
          tripsAPI.getAll({ limit: 5, sort: '-createdAt' }).catch(() => ({ data: { data: { trips: [] } } })),
        ]);
        setDashboard(dashRes.data.data);
        setMonthlyExpenses(monthlyRes.data.data?.monthlyExpenses || monthlyRes.data.data || []);
        setCostBreakdown(costRes.data.data?.breakdown || costRes.data.data || []);
        const tripsData = tripsRes.data.data;
        setRecentTrips(Array.isArray(tripsData) ? tripsData : tripsData?.trips || dashRes.data.data?.recentTrips || []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;
  if (!dashboard) return null;

  const stats = [
    { title: 'Total Vehicles', value: dashboard.fleet?.total || 0, icon: Truck, color: 'brand' },
    { title: 'Active Drivers', value: (dashboard.drivers?.onDuty || 0) + (dashboard.drivers?.onTrip || 0), icon: Users, color: 'emerald' },
    { title: 'In-Transit Trips', value: dashboard.trips?.active || 0, icon: Route, color: 'blue' },
    { title: 'Pending Cargo', value: dashboard.trips?.pendingCargo || 0, icon: PackageCheck, color: 'purple' },
    { title: 'Maintenance Alerts', value: (dashboard.maintenanceAlerts?.vehiclesInShop || 0) + (dashboard.maintenanceAlerts?.activeMaintenanceLogs || 0), icon: Wrench, color: 'red' },
    { title: 'Fleet Utilization', value: `${dashboard.fleet?.utilization || 0}%`, icon: TrendingUp, color: 'orange' },
    { title: 'Avg Fuel Cost/Km', value: `₹${(dashboard.avgFuelCostPerKm || 0).toFixed(1)}`, icon: Fuel, color: 'cyan' },
    { title: 'Completed Trips', value: dashboard.trips?.completed || 0, icon: Clock, color: 'emerald' },
  ];

  const vehicleStatusData = [];
  const fleetData = dashboard.fleet || {};
  if (fleetData.available > 0) vehicleStatusData.push({ name: 'Available', value: fleetData.available });
  if (fleetData.onTrip > 0) vehicleStatusData.push({ name: 'On Trip', value: fleetData.onTrip });
  if (fleetData.inShop > 0) vehicleStatusData.push({ name: 'In Shop', value: fleetData.inShop });
  if (fleetData.retired > 0) vehicleStatusData.push({ name: 'Retired', value: fleetData.retired });
  if (vehicleStatusData.length === 0 && fleetData.total > 0) {
    vehicleStatusData.push({ name: 'Available', value: fleetData.total });
  }

  const costDonutData = Array.isArray(costBreakdown)
    ? costBreakdown.map(c => ({
        name: c.type || c._id || c.category || 'Unknown',
        value: c.totalCost || c.total || c.amount || 0,
      }))
    : [];

  const monthlyChartData = Array.isArray(monthlyExpenses)
    ? monthlyExpenses.map(m => ({
        name: m.month ? `${m.month}/${m.year}` : m._id ? `${m._id.month}/${m._id.year}` : '',
        amount: m.totalCost || m.total || m.amount || 0,
      }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-surface-500 mt-1">Fleet operations overview</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {monthlyChartData.length > 0 ? (
            <AreaChartComponent
              data={monthlyChartData}
              dataKey="amount"
              xKey="name"
              title="Monthly Expenses Trend"
              color="#F59E0B"
              height={320}
            />
          ) : (
            <Card className="p-5 flex items-center justify-center h-[380px]">
              <p className="text-surface-500 text-sm">No expense trend data yet</p>
            </Card>
          )}
        </div>
        <div>
          {vehicleStatusData.length > 0 ? (
            <DonutChart
              data={vehicleStatusData}
              title="Vehicle Status"
              centerLabel="Vehicles"
              height={220}
            />
          ) : (
            <Card className="p-5 flex items-center justify-center h-[380px]">
              <p className="text-surface-500 text-sm">No vehicle data yet</p>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        {costDonutData.length > 0 ? (
          <BarChartComponent
            data={costDonutData}
            dataKey="value"
            xKey="name"
            title="Cost Breakdown by Category"
            colorful
            height={280}
          />
        ) : (
          <Card className="p-5">
            <h3 className="section-title mb-4">Cost Breakdown</h3>
            <p className="text-surface-500 text-sm text-center py-8">No cost data yet</p>
          </Card>
        )}

        {/* Recent Trips */}
        <Card className="p-5">
          <h3 className="section-title mb-4">Recent Trips</h3>
          <div className="space-y-3">
            {recentTrips.length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-8">No trips yet</p>
            ) : (
              recentTrips.map((trip) => {
                const statusConfig = TRIP_STATUS[trip.status] || {};
                return (
                  <div key={trip._id} className="flex items-center justify-between py-2.5 border-b border-surface-700/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-700/50 flex items-center justify-center">
                        <Route className="w-4 h-4 text-brand-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-200">
                          {trip.origin} → {trip.destination}
                        </p>
                        <p className="text-xs text-surface-500">{formatDate(trip.createdAt)}</p>
                      </div>
                    </div>
                    <Badge color={statusConfig.color || 'gray'} dot>
                      {statusConfig.label || trip.status}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
