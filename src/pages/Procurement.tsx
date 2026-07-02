// src/pages/Procurement.tsx
import React, { useState, useEffect } from 'react';
import { callGas } from '../api/gasClient';
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
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);

  // Form states
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(100000);

  const fetchProcurement = async () => {
    setLoading(true);
    try {
      const res = await callGas('Procurement', 'get');
      setRequests(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurement();
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          row.status === 'Approved' ? 'bg-green-50 text-green-700' :
          row.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {row.status === 'Approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
           row.status === 'Rejected' ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {row.status === 'Approved' ? 'Disetujui' :
           row.status === 'Rejected' ? 'Ditolak' : 'Tertunda (Pending)'}
        </span>
      ),
      sortKey: 'status' as keyof ProcurementRequest 
    },
    { 
      header: 'Aksi Persetujuan', 
      accessor: (row: ProcurementRequest) => {
        if (row.status !== 'Pending') {
          return <span className="text-xs text-gray-400 font-medium">Selesai</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => handleApprove(row.id, e)}
              className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors"
            >
              Setujui
            </button>
            <button 
              onClick={(e) => handleReject(row.id, e)}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
            >
              Tolak
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Visual Status Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pengadaan Pending</span>
            <p className="text-xl font-bold text-amber-600">
              {requests.filter(r => r.status === 'Pending').length} Pengajuan
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Pengadaan Disetujui</span>
            <p className="text-xl font-bold text-green-600">
              {requests.filter(r => r.status === 'Approved').length} Selesai
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Pengeluaran Pengadaan</span>
            <p className="text-xl font-bold text-blue-600">
              Rp {requests.filter(r => r.status === 'Approved').reduce((sum, r) => sum + Number(r.estimatedCost * r.quantity || 0), 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart className="w-5 h-5" />
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nama Barang / Deskripsi Pengadaan</label>
            <input
              type="text"
              required
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Contoh: Kursi Ergonomis Kantor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Jumlah (Kuantitas)</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Perkiraan Biaya Satuan (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-150 flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 font-medium">
              Total estimasi keseluruhan: <span className="font-bold">Rp {(quantity * estimatedCost).toLocaleString('id-ID')}</span>. Pengajuan ini akan memerlukan persetujuan dari Manager atau Administrator sebelum dapat ditindaklanjuti.
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Kirim Pengajuan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
