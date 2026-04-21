import { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Cog, AlertTriangle, Truck, Bot, Building2, TrendingUp, Activity } from 'lucide-react';

const KPICard = ({ label, value, icon: Icon, color = '#0055FF', sub }) => (
  <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4 hover:border-[#CBD5E1] transition-colors duration-150" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]" style={{ fontFamily: 'IBM Plex Sans' }}>{label}</span>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <p className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Barlow Condensed', color }}>{value}</p>
    {sub && <p className="text-xs text-[#94A3B8] mt-1" style={{ fontFamily: 'IBM Plex Sans' }}>{sub}</p>}
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch(`${API}/dashboard/stats`, { credentials: 'include' }),
          fetch(`${API}/work-orders`, { credentials: 'include' }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (ordersRes.ok) setOrders(await ordersRes.json());
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#0055FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  const statusData = [
    { name: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#16A34A' },
    { name: 'In Progress', value: orders.filter(o => o.status === 'in_progress').length, color: '#0284C7' },
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#D97706' },
    { name: 'On Hold', value: orders.filter(o => o.status === 'on_hold').length, color: '#FF2200' },
  ];

  const productionData = orders
    .filter(o => o.completed_qty > 0)
    .slice(0, 10)
    .map((o, i) => ({ name: o.order_id, produced: o.completed_qty, target: o.quantity, defects: o.defect_qty }));

  return (
    <div className="animate-fade-in" data-testid="dashboard-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1" style={{ fontFamily: 'IBM Plex Sans' }}>OVERVIEW</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed' }}>
            COMMAND CENTER
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]" style={{ fontFamily: 'JetBrains Mono' }}>
          <Activity className="w-4 h-4 text-[#16A34A]" />
          <span>LIVE</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <KPICard label="OEE" value={`${stats.oee}%`} icon={TrendingUp} color="#00FF66" sub="Overall Equipment Effectiveness" />
        <KPICard label="Active Orders" value={stats.active_orders} icon={Cog} color="#00F0FF" sub={`of ${stats.total_orders} total`} />
        <KPICard label="Units Produced" value={stats.total_produced.toLocaleString()} icon={Package} color="#0055FF" />
        <KPICard label="Low Stock" value={stats.low_stock_alerts} icon={AlertTriangle} color="#FF2200" sub="Items below minimum" />
        <KPICard label="In Transit" value={stats.shipments_in_transit} icon={Truck} color="#FFCC00" sub="Active shipments" />
        <KPICard label="Devices Online" value={`${stats.online_devices}/${stats.total_devices}`} icon={Bot} color="#00F0FF" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Production Performance */}
        <div className="lg:col-span-2 border border-[#E2E8F0] bg-[#F8FAFC] p-4" data-testid="production-chart">
          <h3 className="text-sm font-semibold tracking-tight mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
            PRODUCTION PERFORMANCE
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip contentStyle={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 0, fontFamily: 'IBM Plex Sans', fontSize: 12 }} />
              <Bar dataKey="produced" fill="#0055FF" />
              <Bar dataKey="target" fill="#E2E8F0" />
              <Bar dataKey="defects" fill="#FF2200" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4" data-testid="order-status-chart">
          <h3 className="text-sm font-semibold tracking-tight mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
            ORDER STATUS
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 0, fontFamily: 'IBM Plex Sans', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2" style={{ background: s.color }} />
                <span className="text-[10px] text-[#64748B]" style={{ fontFamily: 'IBM Plex Sans' }}>{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plants Overview */}
      <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4" data-testid="plants-overview">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-[#0055FF]" />
          <h3 className="text-sm font-semibold tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>ACTIVE PLANTS</h3>
          <span className="text-xs text-[#94A3B8] ml-auto" style={{ fontFamily: 'JetBrains Mono' }}>{stats.plants_count} PLANTS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {orders.slice(0, 4).map((o, i) => (
            <div key={o.order_id} className="flex items-center justify-between border border-[#E2E8F0] bg-[#FFFFFF] p-3">
              <div>
                <p className="text-sm font-medium" style={{ fontFamily: 'IBM Plex Sans' }}>{o.product_name}</p>
                <p className="text-xs text-[#94A3B8]" style={{ fontFamily: 'JetBrains Mono' }}>{o.order_id}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 ${
                  o.status === 'completed' ? 'bg-[#16A34A]/10 text-[#16A34A]' :
                  o.status === 'in_progress' ? 'bg-[#0284C7]/10 text-[#0284C7]' :
                  o.status === 'pending' ? 'bg-[#D97706]/10 text-[#D97706]' :
                  'bg-[#FF2200]/10 text-[#FF2200]'
                }`} style={{ fontFamily: 'IBM Plex Sans' }}>{o.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
