import { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, RefreshCw, FileText, ArrowRight } from 'lucide-react';

export default function TraceabilityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchItem, setSearchItem] = useState('');
  const [filterPlant, setFilterPlant] = useState('all');
  const [plants, setPlants] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchItem) params.append('item_id', searchItem);
      if (filterPlant !== 'all') params.append('plant_id', filterPlant);
      const [logsRes, plantsRes] = await Promise.all([
        fetch(`${API}/traceability?${params}`, { credentials: 'include' }),
        fetch(`${API}/plants`, { credentials: 'include' }),
      ]);
      if (logsRes.ok) setLogs(await logsRes.json());
      if (plantsRes.ok) setPlants(await plantsRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterPlant]);

  const eventColors = {
    received: '#16A34A', inspected: '#0284C7', stored: '#64748B', consumed: '#0055FF',
    produced: '#D97706', shipped: '#0284C7', quality_check: '#16A34A',
    work_order_created: '#0055FF', status_change: '#D97706'
  };

  return (
    <div className="animate-fade-in" data-testid="traceability-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] mb-1" style={{ fontFamily: 'IBM Plex Sans' }}>COMPLIANCE</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed' }}>TRACEABILITY</h1>
        </div>
        <Button data-testid="refresh-traceability" onClick={load} variant="outline" className="rounded-none border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] h-9">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input data-testid="trace-search" value={searchItem} onChange={e => setSearchItem(e.target.value)} placeholder="Search by Item ID..." className="pl-10 rounded-none bg-[#FFFFFF] border-[#E2E8F0] h-9" onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <Select value={filterPlant} onValueChange={setFilterPlant}>
          <SelectTrigger data-testid="trace-filter-plant" className="w-48 rounded-none bg-[#FFFFFF] border-[#E2E8F0] h-9"><SelectValue placeholder="All Plants" /></SelectTrigger>
          <SelectContent className="bg-[#F8FAFC] border-[#E2E8F0] rounded-none">
            <SelectItem value="all">All Plants</SelectItem>
            {plants.map(p => <SelectItem key={p.plant_id} value={p.plant_id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button data-testid="trace-search-btn" onClick={load} className="rounded-none bg-[#0055FF] hover:bg-[#3377FF] text-white h-9">
          <Search className="w-4 h-4 mr-2" /> Search
        </Button>
      </div>

      {/* Compliance indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#16A34A]" />
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">ISO 9001</p>
            <p className="text-sm text-[#16A34A]">COMPLIANT</p>
          </div>
        </div>
        <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#16A34A]" />
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">ANVISA</p>
            <p className="text-sm text-[#16A34A]">COMPLIANT</p>
          </div>
        </div>
        <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#D97706]" />
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">FDA 21 CFR</p>
            <p className="text-sm text-[#D97706]">REVIEW PENDING</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-[#E2E8F0] bg-[#F8FAFC]" data-testid="traceability-table">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>MOVEMENT HISTORY</h3>
          <span className="text-xs text-[#94A3B8]">{logs.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Timestamp</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Item ID</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Event</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Description</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Location</TableHead>
                <TableHead className="text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Batch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={log.log_id} className={`border-[#E2E8F0] ${i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F1F5F9]'}`}>
                  <TableCell className="text-xs font-mono text-[#94A3B8]">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#0284C7]">{log.item_id}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5" style={{ color: eventColors[log.event_type] || '#64748B', background: `${eventColors[log.event_type] || '#64748B'}15` }}>
                      {log.event_type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#64748B] max-w-xs truncate">{log.description}</TableCell>
                  <TableCell className="text-xs text-[#94A3B8]">
                    {log.location_from && log.location_to ? (
                      <span className="flex items-center gap-1">
                        {log.location_from} <ArrowRight className="w-3 h-3" /> {log.location_to}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-[#94A3B8]">{log.batch_number || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
