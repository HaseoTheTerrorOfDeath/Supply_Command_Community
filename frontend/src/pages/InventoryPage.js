import { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Package, Plus, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [filterPlant, setFilterPlant] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: 'raw_material', quantity: '', unit: 'pcs', min_stock: '', max_stock: '', plant_id: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPlant !== 'all') params.append('plant_id', filterPlant);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      const [itemsRes, statsRes, plantsRes] = await Promise.all([
        fetch(`${API}/inventory?${params}`, { credentials: 'include' }),
        fetch(`${API}/inventory/stats?${params}`, { credentials: 'include' }),
        fetch(`${API}/plants`, { credentials: 'include' }),
      ]);
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (plantsRes.ok) setPlants(await plantsRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterPlant, filterCategory]);

  const createItem = async () => {
    try {
      const res = await fetch(`${API}/inventory`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: parseFloat(form.quantity), min_stock: parseFloat(form.min_stock || '0'), max_stock: parseFloat(form.max_stock || '10000') }),
      });
      if (res.ok) { toast.success('Item added'); setDialogOpen(false); load(); }
    } catch (e) { toast.error('Failed to add item'); }
  };

  const filtered = items.filter(i => !searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in" data-testid="inventory-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1" style={{ fontFamily: 'IBM Plex Sans' }}>STOCK MANAGEMENT</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed' }}>INVENTORY</h1>
        </div>
        <div className="flex gap-2">
          <Button data-testid="refresh-inventory" onClick={load} variant="outline" className="rounded-none border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] h-9">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-inventory-btn" className="rounded-none bg-[#0055FF] hover:bg-[#3377FF] text-white h-9">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>ADD INVENTORY ITEM</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                <Input data-testid="inv-name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Item name" className="rounded-none bg-[#FFFFFF] border-[#E2E8F0]" />
                <Input data-testid="inv-sku" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="SKU" className="rounded-none bg-[#FFFFFF] border-[#E2E8F0]" />
                <div className="grid grid-cols-2 gap-3">
                  <Input data-testid="inv-qty" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="Quantity" className="rounded-none bg-[#FFFFFF] border-[#E2E8F0]" />
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger className="rounded-none bg-[#FFFFFF] border-[#E2E8F0]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none">
                      <SelectItem value="raw_material">Raw Material</SelectItem>
                      <SelectItem value="component">Component</SelectItem>
                      <SelectItem value="finished_good">Finished Good</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="consumable">Consumable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={form.plant_id} onValueChange={v => setForm({...form, plant_id: v})}>
                  <SelectTrigger className="rounded-none bg-[#FFFFFF] border-[#E2E8F0]"><SelectValue placeholder="Select plant" /></SelectTrigger>
                  <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none">
                    {plants.map(p => <SelectItem key={p.plant_id} value={p.plant_id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button data-testid="inv-submit" onClick={createItem} className="w-full rounded-none bg-[#0055FF] hover:bg-[#3377FF] text-white font-semibold">ADD ITEM</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Total Items</p>
            <p className="text-3xl font-black text-[#0055FF]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.total_items}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Total Units</p>
            <p className="text-3xl font-black text-[#0284C7]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.total_units.toLocaleString()}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Low Stock Alerts</p>
            <p className="text-3xl font-black text-[#FF2200]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.low_stock_alerts}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Categories</p>
            <p className="text-3xl font-black text-[#D97706]" style={{ fontFamily: 'Barlow Condensed' }}>{Object.keys(stats.by_category).length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input data-testid="inventory-search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search items..." className="pl-10 rounded-none bg-[#FFFFFF] border-[#E2E8F0] h-9" />
        </div>
        <Select value={filterPlant} onValueChange={setFilterPlant}>
          <SelectTrigger data-testid="filter-plant" className="w-48 rounded-none bg-[#FFFFFF] border-[#E2E8F0] h-9"><SelectValue placeholder="All Plants" /></SelectTrigger>
          <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none">
            <SelectItem value="all">All Plants</SelectItem>
            {plants.map(p => <SelectItem key={p.plant_id} value={p.plant_id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger data-testid="filter-category" className="w-48 rounded-none bg-[#FFFFFF] border-[#E2E8F0] h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="raw_material">Raw Material</SelectItem>
            <SelectItem value="component">Component</SelectItem>
            <SelectItem value="finished_good">Finished Good</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-[#E2E8F0] bg-[#F8FAFC]" data-testid="inventory-table">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">SKU</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Name</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Category</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8] text-right">Quantity</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Unit</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Batch</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => {
                const isLow = item.quantity <= item.min_stock;
                return (
                  <TableRow key={item.item_id} className={`border-[#E2E8F0] ${i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F1F5F9]'}`}>
                    <TableCell className="font-mono text-xs text-[#0284C7]">{item.sku}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {item.name}
                        {isLow && <AlertTriangle className="w-3 h-3 text-[#FF2200]" />}
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 bg-[#E2E8F0] text-[#64748B]">{item.category.replace('_', ' ').toUpperCase()}</span></TableCell>
                    <TableCell className={`text-sm text-right font-mono ${isLow ? 'text-[#FF2200]' : ''}`}>{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-[#94A3B8]">{item.unit}</TableCell>
                    <TableCell className="text-xs text-[#94A3B8] font-mono">{item.batch_number || item.serial_number || '—'}</TableCell>
                    <TableCell><span className={`text-xs px-2 py-0.5 ${isLow ? 'bg-[#FF2200]/10 text-[#FF2200]' : 'bg-[#16A34A]/10 text-[#16A34A]'}`}>{isLow ? 'LOW STOCK' : 'OK'}</span></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
