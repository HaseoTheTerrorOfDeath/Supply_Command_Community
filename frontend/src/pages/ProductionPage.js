import { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Cog, Plus, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function ProductionPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_name: '', quantity: '', priority: 'medium', plant_id: '' });
  const [plants, setPlants] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes, plantsRes] = await Promise.all([
        fetch(`${API}/work-orders`, { credentials: 'include' }),
        fetch(`${API}/production/stats`, { credentials: 'include' }),
        fetch(`${API}/plants`, { credentials: 'include' }),
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (plantsRes.ok) setPlants(await plantsRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createOrder = async () => {
    try {
      const res = await fetch(`${API}/work-orders`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: parseInt(form.quantity) }),
      });
      if (res.ok) {
        toast.success('Work order created');
        setDialogOpen(false);
        setForm({ product_name: '', quantity: '', priority: 'medium', plant_id: '' });
        load();
      }
    } catch (e) { toast.error('Failed to create order'); }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API}/work-orders/${orderId}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success('Status updated');
      load();
    } catch (e) { toast.error('Failed to update'); }
  };

  const statusColor = (s) => {
    const map = { completed: '#16A34A', in_progress: '#0284C7', pending: '#D97706', on_hold: '#FF2200' };
    return map[s] || '#64748B';
  };

  const priorityColor = (p) => {
    const map = { critical: '#FF2200', high: '#0055FF', medium: '#D97706', low: '#16A34A' };
    return map[p] || '#64748B';
  };

  const chartData = orders.filter(o => o.completed_qty > 0).slice(0, 8).map(o => ({
    id: o.order_id, produced: o.completed_qty, target: o.quantity
  }));

  return (
    <div className="animate-fade-in" data-testid="production-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1" style={{ fontFamily: 'IBM Plex Sans' }}>MES / ERP</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed' }}>
            PRODUCTION CONTROL
          </h1>
        </div>
        <div className="flex gap-2">
          <Button data-testid="refresh-production" onClick={load} variant="outline" className="rounded-none border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] h-9">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-work-order-btn" className="rounded-none bg-[#0055FF] hover:bg-[#3377FF] text-white h-9">
                <Plus className="w-4 h-4 mr-2" /> New Work Order
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>CREATE WORK ORDER</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1 block">Product Name</label>
                  <Input data-testid="wo-product-name" value={form.product_name} onChange={e => setForm({...form, product_name: e.target.value})} className="rounded-none bg-[#FFFFFF] border-[#E2E8F0] focus:ring-[#0055FF]" placeholder="Assembly Module X200" />
                </div>
                <div>
                  <label className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1 block">Quantity</label>
                  <Input data-testid="wo-quantity" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="rounded-none bg-[#FFFFFF] border-[#E2E8F0] focus:ring-[#0055FF]" placeholder="100" />
                </div>
                <div>
                  <label className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1 block">Priority</label>
                  <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                    <SelectTrigger data-testid="wo-priority" className="rounded-none bg-[#FFFFFF] border-[#E2E8F0]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1 block">Plant</label>
                  <Select value={form.plant_id} onValueChange={v => setForm({...form, plant_id: v})}>
                    <SelectTrigger data-testid="wo-plant" className="rounded-none bg-[#FFFFFF] border-[#E2E8F0]"><SelectValue placeholder="Select plant" /></SelectTrigger>
                    <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none">
                      {plants.map(p => <SelectItem key={p.plant_id} value={p.plant_id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button data-testid="wo-submit" onClick={createOrder} className="w-full rounded-none bg-[#0055FF] hover:bg-[#3377FF] text-white font-semibold">
                  CREATE ORDER
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">OEE</p>
            <p className="text-3xl font-black text-[#16A34A]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.oee}%</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Yield Rate</p>
            <p className="text-3xl font-black text-[#0284C7]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.yield_rate}%</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Total Produced</p>
            <p className="text-3xl font-black text-[#0055FF]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.total_produced.toLocaleString()}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Total Defects</p>
            <p className="text-3xl font-black text-[#FF2200]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.total_defects}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4 mb-6">
          <h3 className="text-sm font-semibold tracking-tight mb-3" style={{ fontFamily: 'Barlow Condensed' }}>PRODUCTION VS TARGET</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="id" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 0 }} />
              <Bar dataKey="target" fill="#E2E8F0" />
              <Bar dataKey="produced" fill="#0055FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Orders Table */}
      <div className="border border-[#E2E8F0] bg-[#F8FAFC]" data-testid="work-orders-table">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>WORK ORDERS</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Order ID</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Product</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8] text-right">Qty</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8] text-right">Completed</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Priority</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Status</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o, i) => (
                <TableRow key={o.order_id} className={`border-[#E2E8F0] ${i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F1F5F9]'}`}>
                  <TableCell className="font-mono text-xs text-[#0284C7]">{o.order_id}</TableCell>
                  <TableCell className="text-sm">{o.product_name}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{o.quantity}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{o.completed_qty}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5" style={{ color: priorityColor(o.priority), background: `${priorityColor(o.priority)}15` }}>
                      {o.priority.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5" style={{ color: statusColor(o.status), background: `${statusColor(o.status)}15` }}>
                      {o.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={v => updateStatus(o.order_id, v)}>
                      <SelectTrigger className="h-7 rounded-none bg-[#FFFFFF] border-[#E2E8F0] text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
