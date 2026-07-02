// src/pages/Sales.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Truck, CheckCircle, Clock, AlertCircle, ShoppingBag } from 'lucide-react';

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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          row.status === 'Paid' ? 'bg-green-50 text-green-700' :
          row.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
          row.status === 'Sent' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {row.status === 'Paid' ? <CheckCircle className="w-3.5 h-3.5" /> :
           row.status === 'Cancelled' ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {row.status === 'Paid' ? 'Lunas (Paid)' :
           row.status === 'Cancelled' ? 'Dibatalkan' :
           row.status === 'Sent' ? 'Dikirim (Sent)' : 'Draft'}
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
          return <span className="text-xs text-gray-400 font-medium">Selesai</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => handleUpdateStatus(row.id, 'Paid', e)}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors"
            >
              Set Lunas
            </button>
            <button 
              onClick={(e) => handleUpdateStatus(row.id, 'Cancelled', e)}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition-colors"
            >
              Batalkan
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Visual KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Omset Penjualan</span>
            <p className="text-xl font-bold text-gray-900">
              Rp {orders.filter(o => o.status === 'Paid').reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pesanan Diproses</span>
            <p className="text-xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'Sent' || o.status === 'Draft').length} Order
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Piutang Pelanggan</span>
            <p className="text-xl font-bold text-amber-600">
              Rp {orders.filter(o => o.status === 'Sent').reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nama Pelanggan / Customer</label>
            <input
              type="text"
              required
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Contoh: PT. Sinar Mentari Utama"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Total Nilai Penjualan (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Status Awal</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Dikirim / Ditagihkan (Sent)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
            >
              Simpan Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
