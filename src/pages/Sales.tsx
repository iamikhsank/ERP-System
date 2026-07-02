// src/pages/Sales.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Truck, CheckCircle, Clock, AlertCircle, ShoppingBag, ChevronDown } from 'lucide-react';

interface SalesOrder {
  id: string;
  orderNo: string;
  customer: string;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Cancelled';
  createdAt: string;
}

export default function SalesPage() {
  const cached = getGasCache('Sales', 'get');
  const [orders, setOrders] = useState<SalesOrder[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [customer, setCustomer] = useState('');
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'Draft' | 'Sent' | 'Paid' | 'Cancelled'>('Draft');

  const fetchSales = async (active = true) => {
    if (!cached && active) setLoading(true);
    try {
      const res = await callGas('Sales', 'get');
      if (active) setOrders(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchSales(active);
    return () => {
      active = false;
    };
  }, []);

  const handleAddClick = () => {
    setCustomer('');
    setTotal(0);
    setStatus('Draft');
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Paid' | 'Cancelled', e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Ubah status pesanan ke ${newStatus === 'Paid' ? 'LUNAS (Paid)' : 'BATAL (Cancelled)'}?`)) {
      try {
        await callGas('Sales', 'updateStatus', { id, status: newStatus });
        fetchSales();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customer,
      total,
      status,
    };

    try {
      await callGas('Sales', 'create', payload);
      setIsModalOpen(false);
      fetchSales();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: 'No Pesanan', accessor: 'orderNo' as keyof SalesOrder, sortKey: 'orderNo' as keyof SalesOrder },
    { header: 'Pelanggan / Customer', accessor: 'customer' as keyof SalesOrder, sortKey: 'customer' as keyof SalesOrder },
    { 
      header: 'Total Penjualan', 
      accessor: (row: SalesOrder) => `Rp ${Number(row.total || 0).toLocaleString('id-ID')}`,
      sortKey: 'total' as keyof SalesOrder 
    },
    { 
      header: 'Status Pembayaran', 
      accessor: (row: SalesOrder) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          row.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          row.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
          row.status === 'Sent' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {row.status === 'Paid' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> :
           row.status === 'Cancelled' ? <AlertCircle className="w-3 h-3 text-rose-500" /> : <Clock className="w-3 h-3 text-slate-400" />}
          {row.status === 'Paid' ? 'LUNAS (PAID)' :
           row.status === 'Cancelled' ? 'DIBATALKAN' :
           row.status === 'Sent' ? 'DIKIRIM (SENT)' : 'DRAFT'}
        </span>
      ),
      sortKey: 'status' as keyof SalesOrder 
    },
    { 
      header: 'Tanggal Dibuat', 
      accessor: (row: SalesOrder) => row.createdAt ? new Date(row.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      sortKey: 'createdAt' as keyof SalesOrder 
    },
    { 
      header: 'Tindakan', 
      accessor: (row: SalesOrder) => {
        if (row.status === 'Paid' || row.status === 'Cancelled') {
          return <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider text-[10px]">SELESAI</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => handleUpdateStatus(row.id, 'Paid', e)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-xs hover:shadow-md cursor-pointer uppercase tracking-wider"
            >
              Set Lunas
            </button>
            <button 
              onClick={(e) => handleUpdateStatus(row.id, 'Cancelled', e)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider border border-slate-200"
            >
              Batalkan
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Visual KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Omset Penjualan</span>
            <p className="text-xl font-bold text-emerald-600 font-display">
              Rp {orders.filter(o => o.status === 'Paid').reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pesanan Diproses</span>
            <p className="text-xl font-bold text-blue-600 font-display">
              {orders.filter(o => o.status === 'Sent' || o.status === 'Draft').length} Order
            </p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center">
            <Truck className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Piutang Pelanggan</span>
            <p className="text-xl font-bold text-amber-600 font-display">
              Rp {orders.filter(o => o.status === 'Sent').reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 stroke-[2]" />
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
            data={orders}
            searchKey="customer"
            searchPlaceholder="Cari berdasarkan nama customer..."
            onAddClick={handleAddClick}
            addLabel="Tambah Sales Order"
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Sales Order Baru"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Pelanggan / Customer</label>
            <input
              type="text"
              required
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Contoh: PT. Sinar Mentari Utama"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Nilai Penjualan (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status Awal</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Dikirim / Ditagihkan (Sent)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider"
            >
              Simpan Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
