import { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Truck, Building, RefreshCw, MapPin, Clock } from 'lucide-react';

export default function SupplyChainPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [supRes, shipRes, statsRes] = await Promise.all([
        fetch(`${API}/suppliers`, { credentials: 'include' }),
        fetch(`${API}/shipments`, { credentials: 'include' }),
        fetch(`${API}/supply-chain/stats`, { credentials: 'include' }),
      ]);
      if (supRes.ok) setSuppliers(await supRes.json());
      if (shipRes.ok) setShipments(await shipRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="animate-fade-in" data-testid="supply-chain-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1" style={{ fontFamily: 'IBM Plex Sans' }}>LOGISTICS</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed' }}>SUPPLY CHAIN</h1>
        </div>
        <Button data-testid="refresh-supply-chain" onClick={load} variant="outline" className="rounded-none border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] h-9">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Suppliers</p>
            <p className="text-3xl font-black text-[#0055FF]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.total_suppliers}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">In Transit</p>
            <p className="text-3xl font-black text-[#D97706]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.in_transit}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Delivered</p>
            <p className="text-3xl font-black text-[#16A34A]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.delivered}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Avg Lead Time</p>
            <p className="text-3xl font-black text-[#0284C7]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.avg_lead_time}d</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="shipments" className="w-full">
        <TabsList className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-none mb-4">
          <TabsTrigger value="shipments" className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white text-[#64748B]">
            <Truck className="w-4 h-4 mr-2" /> Shipments
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white text-[#64748B]">
            <Building className="w-4 h-4 mr-2" /> Suppliers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipments">
          {/* Shipment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="shipments-grid">
            {shipments.map(s => (
              <div key={s.shipment_id} className="border border-[#E2E8F0] bg-[#F8FAFC] p-4 hover:border-[#CBD5E1] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-[#0284C7]">{s.shipment_id}</span>
                  <span className={`text-xs px-2 py-0.5 ${s.status === 'delivered' ? 'bg-[#16A34A]/10 text-[#16A34A]' : s.status === 'in_transit' ? 'bg-[#D97706]/10 text-[#D97706]' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                    {s.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3 h-3 text-[#94A3B8]" />
                  <span className="text-sm text-[#64748B]">{s.origin}</span>
                  <span className="text-[#94A3B8]">→</span>
                  <span className="text-sm">{s.destination}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3 text-[#94A3B8]" />
                  <span className="text-xs text-[#94A3B8]">ETA: {s.eta ? new Date(s.eta).toLocaleDateString() : '—'}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
                  {s.items.map((it, idx) => (
                    <span key={idx} className="text-xs text-[#64748B] mr-3">{it.sku} x{it.quantity}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="border border-[#E2E8F0] bg-[#F8FAFC]" data-testid="suppliers-table">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Supplier</TableHead>
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Location</TableHead>
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Rating</TableHead>
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Lead Time</TableHead>
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Items</TableHead>
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((s, i) => (
                    <TableRow key={s.supplier_id} className={`border-[#E2E8F0] ${i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F1F5F9]'}`}>
                      <TableCell className="text-sm font-medium">{s.name}</TableCell>
                      <TableCell className="text-sm text-[#64748B]">{s.location}</TableCell>
                      <TableCell>
                        <span className="text-sm font-mono" style={{ color: s.rating >= 4.5 ? '#16A34A' : s.rating >= 4 ? '#D97706' : '#0055FF' }}>
                          {s.rating.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-[#64748B]">{s.lead_time_days}d</TableCell>
                      <TableCell className="text-xs text-[#94A3B8]">{s.items_supplied.join(', ')}</TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A]">{s.status.toUpperCase()}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
