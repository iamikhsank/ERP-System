// src/pages/Finance.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';

interface FinanceRecord {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string;
  description: string;
  category: string;
}

export default function FinancePage() {
  const cached = getGasCache('Finance', 'get');
  const [records, setRecords] = useState<FinanceRecord[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);

  // Form states
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sales');

  const fetchFinance = async (active = true) => {
    if (!cached && active) setLoading(true);
    try {
      const res = await callGas('Finance', 'get');
      if (active) setRecords(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchFinance(active);
    return () => {
      active = false;
    };
  }, []);

  // Summary stats
  const totalIncome = records.filter(r => r.type === 'Income').reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpense = records.filter(r => r.type === 'Expense').reduce((sum, r) => sum + Number(r.amount), 0);
  const netProfit = totalIncome - totalExpense;

  const handleAddClick = () => {
    setSelectedRecord(null);
    setType('Income');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setCategory('Sales');
    setIsModalOpen(true);
  };

  const handleEditClick = (rec: FinanceRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRecord(rec);
    setType(rec.type);
    setAmount(rec.amount);
    setDate(rec.date ? rec.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setDescription(rec.description);
    setCategory(rec.category || 'Sales');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus transaksi ini?')) {
      try {
        await callGas('Finance', 'delete', { id });
        fetchFinance();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type,
      amount,
      date,
      description,
      category,
      id: selectedRecord?.id
    };

    try {
      if (selectedRecord) {
        await callGas('Finance', 'update', payload);
      } else {
        await callGas('Finance', 'create', payload);
      }
      setIsModalOpen(false);
      fetchFinance();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { 
      header: 'Tipe', 
      accessor: (row: FinanceRecord) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          row.type === 'Income' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
        }`}>
          {row.type === 'Income' ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
          {row.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}
        </span>
      ),
      sortKey: 'type' as keyof FinanceRecord 
    },
    { header: 'Kategori', accessor: 'category' as keyof FinanceRecord, sortKey: 'category' as keyof FinanceRecord },
    { header: 'Deskripsi', accessor: 'description' as keyof FinanceRecord },
    { 
      header: 'Jumlah (Nominal)', 
      accessor: (row: FinanceRecord) => (
        <span className={`font-bold ${row.type === 'Income' ? 'text-green-600' : 'text-rose-600'}`}>
          Rp {Number(row.amount).toLocaleString('id-ID')}
        </span>
      ),
      sortKey: 'amount' as keyof FinanceRecord 
    },
    { 
      header: 'Tanggal', 
      accessor: (row: FinanceRecord) => row.date ? new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      sortKey: 'date' as keyof FinanceRecord 
    },
    { 
      header: 'Aksi', 
      accessor: (row: FinanceRecord) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => handleEditClick(row, e)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => handleDeleteClick(row.id, e)}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Mini Profit & Loss Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Pemasukan</span>
            <p className="text-xl font-bold text-green-600">Rp {totalIncome.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <ArrowUpCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Pengeluaran</span>
            <p className="text-xl font-bold text-rose-600">Rp {totalExpense.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Laba Bersih</span>
            <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              Rp {netProfit.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wallet className="w-5 h-5" />
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
            data={records}
            searchKey="description"
            searchPlaceholder="Cari deskripsi transaksi..."
            onAddClick={handleAddClick}
            addLabel="Tambah Transaksi"
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRecord ? 'Ubah Transaksi' : 'Tambah Transaksi Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tipe Arus Kas</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('Income')}
                className={`py-2 border rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'Income' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" /> Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType('Expense')}
                className={`py-2 border rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'Expense' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" /> Pengeluaran
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Jumlah (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
            >
              {type === 'Income' ? (
                <>
                  <option value="Sales">Penjualan Produk</option>
                  <option value="Services">Layanan Jasa</option>
                  <option value="Investment">Investasi</option>
                  <option value="Others">Lain-lain</option>
                </>
              ) : (
                <>
                  <option value="Office Supplies">Peralatan Kantor</option>
                  <option value="Salary">Gaji Karyawan</option>
                  <option value="Rent">Sewa Tempat</option>
                  <option value="Marketing">Pemasaran</option>
                  <option value="Procurement">Pengadaan Barang</option>
                  <option value="Utilities">Air & Listrik</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Deskripsi</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Berikan deskripsi singkat transaksi..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
