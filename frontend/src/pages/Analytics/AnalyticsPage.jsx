import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Fuel, DollarSign, Truck } from 'lucide-react';
import { analyticsAPI } from '../../api/analytics.js';
import Card from '../../components/ui/Card.jsx';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import AreaChartComponent from '../../components/charts/AreaChart.jsx';
import BarChartComponent from '../../components/charts/BarChart.jsx';
import DonutChart from '../../components/charts/DonutChart.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { useToast } from '../../components/ui/Toast.jsx';

export default function AnalyticsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [costBreakdown, setCostBreakdown] = useState([]);
  const [tripsPerVehicle, setTripsPerVehicle] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [fuelEfficiency, setFuelEfficiency] = useState([]);
  const [vehicleROI, setVehicleROI] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [costRes, tripsRes, monthlyRes, fuelRes, roiRes] = await Promise.all([
          analyticsAPI.getCostBreakdown().catch(() => ({ data: { data: [] } })),
          analyticsAPI.getTripsPerVehicle().catch(() => ({ data: { data: [] } })),
          analyticsAPI.getMonthlyExpenses().catch(() => ({ data: { data: [] } })),
          analyticsAPI.getFuelEfficiency().catch(() => ({ data: { data: [] } })),
          analyticsAPI.getVehicleROI().catch(() => ({ data: { data: [] } })),
        ]);
        setCostBreakdown(costRes.data.data?.breakdown || []);
        setTripsPerVehicle(tripsRes.data.data?.tripsPerVehicle || []);
        setMonthlyExpenses(monthlyRes.data.data?.monthlyExpenses || []);
        setFuelEfficiency(fuelRes.data.data?.fuelEfficiency || []);
        setVehicleROI(roiRes.data.data?.vehicleROI || []);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  const costDonutData = Array.isArray(costBreakdown) ? costBreakdown.map(c => ({
    name: c.type || c._id || 'Unknown',
    value: c.totalCost || 0,
  })) : [];

  const tripsBarData = Array.isArray(tripsPerVehicle) ? tripsPerVehicle.slice(0, 10).map(t => ({
    name: t.name || t.licensePlate || 'Unknown',
    trips: t.totalTrips || 0,
  })) : [];

  const monthlyChartData = Array.isArray(monthlyExpenses) ? monthlyExpenses.map(m => ({
    name: `${m.month}/${m.year}`,
    amount: m.totalCost || 0,
  })) : [];

  const fuelData = Array.isArray(fuelEfficiency) ? fuelEfficiency.slice(0, 10).map(f => ({
    name: f.name || f.licensePlate || 'Unknown',
    efficiency: f.kmPerLiter !== 'N/A' ? parseFloat(f.kmPerLiter) : 0,
  })) : [];

  const roiData = Array.isArray(vehicleROI) ? vehicleROI.slice(0, 10).map(r => ({
    name: r.name || r.licensePlate || 'Unknown',
    value: r.totalExpenses || 0,
  })) : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="text-sm text-surface-500 mt-1">Deep insights into fleet operations & costs</p>
      </div>

      {/* Row 1: Cost Breakdown + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          {costDonutData.length > 0 ? (
            <DonutChart
              data={costDonutData}
              title="Cost Breakdown"
              centerLabel="Total"
              height={220}
            />
          ) : (
            <Card className="p-5 h-full flex items-center justify-center">
              <p className="text-surface-500 text-sm">No cost data</p>
            </Card>
          )}
        </div>
        <div className="lg:col-span-2">
          {monthlyChartData.length > 0 ? (
            <AreaChartComponent
              data={monthlyChartData}
              dataKey="amount"
              title="Monthly Expense Trend"
              color="#14B8A6"
              height={320}
            />
          ) : (
            <Card className="p-5 h-full flex items-center justify-center">
              <p className="text-surface-500 text-sm">No monthly data</p>
            </Card>
          )}
        </div>
      </div>

      {/* Row 2: Trips per Vehicle + Fuel Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tripsBarData.length > 0 ? (
          <BarChartComponent
            data={tripsBarData}
            dataKey="trips"
            title="Trips per Vehicle"
            color="#3B82F6"
            colorful
            height={300}
          />
        ) : (
          <Card className="p-5 flex items-center justify-center h-[360px]">
            <p className="text-surface-500 text-sm">No trip data</p>
          </Card>
        )}

        {fuelData.length > 0 ? (
          <BarChartComponent
            data={fuelData}
            dataKey="efficiency"
            title="Fuel Efficiency (₹/km)"
            color="#10B981"
            height={300}
          />
        ) : (
          <Card className="p-5 flex items-center justify-center h-[360px]">
            <p className="text-surface-500 text-sm">No fuel data</p>
          </Card>
        )}
      </div>

      {/* Row 3: Vehicle ROI */}
      {roiData.length > 0 && (
        <BarChartComponent
          data={roiData}
          dataKey="value"
          title="Vehicle Total Cost (ROI Indicator)"
          color="#F97316"
          colorful
          height={320}
        />
      )}
    </motion.div>
  );
}
