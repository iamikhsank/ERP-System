// src/pages/Procurement.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { CheckCircle2, XCircle, Clock, ShoppingCart, PlusCircle, AlertCircle } from 'lucide-react';

interface ProcurementRequest {
  id: string;
  requestNo: string;
  item: string;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  estimatedCost: number;
  createdAt: string;
}

export default function ProcurementPage() {
  const cached = getGasCache('Procurement', 'get');
  const [requests, setRequests] = useState<ProcurementRequest[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);

  // Form states
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(100000);

  const fetchProcurement = async (active = true) => {
    if (!cached && active) setLoading(true);
    try {
      const res = await callGas('Procurement', 'get');
      if (active) setRequests(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchProcurement(active);
    return () => {
      active = false;
    };
  }, []);

  const handleAddClick = () => {
    setSelectedRequest(null);
    setItem('');
    setQuantity(1);
    setEstimatedCost(100000);
    setIsModalOpen(true);
  };

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Setujui permintaan pengadaan ini?')) {
      try {
        await callGas('Procurement', 'approve', { id });
        fetchProcurement();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tolak permintaan pengadaan ini?')) {
      try {
        await callGas('Procurement', 'reject', { id });
        fetchProcurement();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      item,
      quantity,
      estimatedCost,
      status: 'Pending',
    };

    try {
      await callGas('Procurement', 'create', payload);
      setIsModalOpen(false);
      fetchProcurement();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: 'No Pengadaan', accessor: 'requestNo' as keyof ProcurementRequest, sortKey: 'requestNo' as keyof ProcurementRequest },
    { header: 'Nama Barang', accessor: 'item' as keyof ProcurementRequest, sortKey: 'item' as keyof ProcurementRequest },
    { header: 'Jumlah', accessor: 'quantity' as keyof ProcurementRequest, sortKey: 'quantity' as keyof ProcurementRequest },
    { 
      header: 'Perkiraan Biaya', 
      accessor: (row: ProcurementRequest) => `Rp ${Number(row.estimatedCost || 0).toLocaleString('id-ID')}`,
      sortKey: 'estimatedCost' as keyof ProcurementRequest 
    },
    { 
      header: 'Status', 
      accessor: (row: ProcurementRequest) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          row.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
          {row.status === 'Approved' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> :
           row.status === 'Rejected' ? <XCircle className="w-3 h-3 text-rose-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
          {row.status === 'Approved' ? 'DISETUJUI' :
           row.status === 'Rejected' ? 'DITOLAK' : 'PENDING'}
        </span>
      ),
      sortKey: 'status' as keyof ProcurementRequest 
    },
    { 
      header: 'Aksi Persetujuan', 
      accessor: (row: ProcurementRequest) => {
        if (row.status !== 'Pending') {
          return <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider text-[10px]">SELESAI</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => handleApprove(row.id, e)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-xs hover:shadow-md cursor-pointer uppercase tracking-wider"
            >
              Setujui
            </button>
            <button 
              onClick={(e) => handleReject(row.id, e)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-xs hover:shadow-md cursor-pointer uppercase tracking-wider"
            >
              Tolak
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Visual Status Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pengadaan Pending</span>
            <p className="text-xl font-bold text-amber-600 font-display">
              {requests.filter(r => r.status === 'Pending').length} Pengajuan
            </p>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Pengadaan Disetujui</span>
            <p className="text-xl font-bold text-emerald-600 font-display">
              {requests.filter(r => r.status === 'Approved').length} Selesai
            </p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Pengeluaran Pengadaan</span>
            <p className="text-xl font-bold text-blue-600 font-display">
              Rp {requests.filter(r => r.status === 'Approved').reduce((sum, r) => sum + Number(r.estimatedCost * r.quantity || 0), 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-200/80 rounded-2xl w-1/4"></div>
            <div className="h-72 bg-slate-200/80 rounded-2xl"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={requests}
            searchKey="item"
            searchPlaceholder="Cari nama barang pengadaan..."
            onAddClick={handleAddClick}
            addLabel="Ajukan Pengadaan"
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Form Pengajuan Pengadaan"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Barang / Deskripsi Pengadaan</label>
            <input
              type="text"
              required
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Contoh: Kursi Ergonomis Kantor"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jumlah (Kuantitas)</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Perkiraan Biaya Satuan (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex gap-3">
            <AlertCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-indigo-800 font-medium leading-relaxed">
              Total estimasi keseluruhan: <span className="font-bold text-indigo-950 text-sm">Rp {(quantity * estimatedCost).toLocaleString('id-ID')}</span>. Pengajuan ini akan memerlukan persetujuan dari Manager atau Administrator sebelum dapat ditindaklanjuti.
            </div>
          </div>

          <div className="pt-5 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 stroke-[2]" />
              Kirim Pengajuan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
