import { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Warehouse as WarehouseIcon, MapPin, RefreshCw, ClipboardList } from 'lucide-react';

export default function WarehousePage() {
  const [locations, setLocations] = useState([]);
  const [pickingOrders, setPickingOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [locRes, pickRes, statsRes] = await Promise.all([
        fetch(`${API}/warehouse/locations`, { credentials: 'include' }),
        fetch(`${API}/warehouse/picking-orders`, { credentials: 'include' }),
        fetch(`${API}/warehouse/stats`, { credentials: 'include' }),
      ]);
      if (locRes.ok) setLocations(await locRes.json());
      if (pickRes.ok) setPickingOrders(await pickRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const zones = [...new Set(locations.map(l => l.zone))].sort();

  return (
    <div className="animate-fade-in" data-testid="warehouse-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1" style={{ fontFamily: 'IBM Plex Sans' }}>WMS</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed' }}>WAREHOUSE MANAGEMENT</h1>
        </div>
        <Button data-testid="refresh-warehouse" onClick={load} variant="outline" className="rounded-none border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] h-9">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Locations</p>
            <p className="text-3xl font-black text-[#0055FF]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.total_locations}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Utilization</p>
            <p className="text-3xl font-black text-[#0284C7]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.utilization}%</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Pending Picks</p>
            <p className="text-3xl font-black text-[#D97706]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.pending_picks}</p>
          </div>
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Capacity</p>
            <p className="text-3xl font-black text-[#64748B]" style={{ fontFamily: 'Barlow Condensed' }}>{stats.total_capacity.toLocaleString()}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-none mb-4">
          <TabsTrigger value="map" className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white text-[#64748B]">
            <MapPin className="w-4 h-4 mr-2" /> Storage Map
          </TabsTrigger>
          <TabsTrigger value="picking" className="rounded-none data-[state=active]:bg-[#0055FF] data-[state=active]:text-white text-[#64748B]">
            <ClipboardList className="w-4 h-4 mr-2" /> Picking Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zones.map(zone => (
              <div key={zone} className="border border-[#E2E8F0] bg-[#F8FAFC] p-4" data-testid={`zone-${zone}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black" style={{ fontFamily: 'Barlow Condensed' }}>ZONE {zone}</h3>
                  <span className="text-xs text-[#94A3B8]" style={{ fontFamily: 'JetBrains Mono' }}>
                    {locations.filter(l => l.zone === zone).length} LOCS
                  </span>
                </div>
                <div className="space-y-1.5">
                  {locations.filter(l => l.zone === zone).slice(0, 12).map(loc => {
                    const util = loc.capacity > 0 ? (loc.current_load / loc.capacity) * 100 : 0;
                    return (
                      <div key={loc.location_id} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#94A3B8] w-20">{loc.location_id}</span>
                        <div className="flex-1 h-3 bg-[#FFFFFF] border border-[#E2E8F0]">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${util}%`,
                              background: util > 90 ? '#FF2200' : util > 70 ? '#D97706' : '#16A34A'
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#94A3B8] w-10 text-right">{Math.round(util)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="picking">
          <div className="border border-[#E2E8F0] bg-[#F8FAFC]" data-testid="picking-orders-table">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Pick ID</TableHead>
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Items</TableHead>
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Assigned To</TableHead>
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Priority</TableHead>
                    <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickingOrders.map((po, i) => (
                    <TableRow key={po.pick_id} className={`border-[#E2E8F0] ${i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F1F5F9]'}`}>
                      <TableCell className="font-mono text-xs text-[#0284C7]">{po.pick_id}</TableCell>
                      <TableCell className="text-sm">{po.items.map(it => `${it.name} x${it.quantity}`).join(', ')}</TableCell>
                      <TableCell className="text-sm text-[#64748B]">{po.assigned_to || '—'}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 ${po.priority === 'urgent' ? 'bg-[#FF2200]/10 text-[#FF2200]' : po.priority === 'high' ? 'bg-[#0055FF]/10 text-[#0055FF]' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                          {po.priority.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 ${po.status === 'completed' ? 'bg-[#16A34A]/10 text-[#16A34A]' : po.status === 'in_progress' ? 'bg-[#0284C7]/10 text-[#0284C7]' : 'bg-[#D97706]/10 text-[#D97706]'}`}>
                          {po.status.replace('_', ' ').toUpperCase()}
                        </span>
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
