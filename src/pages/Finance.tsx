// src/pages/Finance.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FinanceAnalysis from '../components/FinanceAnalysis';
import FinanceReconciliation from '../components/FinanceReconciliation';
import { Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, ChevronDown, BookOpen, BarChart2, CheckSquare } from 'lucide-react';

interface FinanceRecord {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string;
  description: string;
  category: string;
  reconciled?: boolean | string;
  bankRef?: string;
}

interface FinancePageProps {
  activeTab?: 'ledger' | 'pandl' | 'reconcile';
  setActiveTab?: (tab: 'ledger' | 'pandl' | 'reconcile') => void;
}

export default function FinancePage({ activeTab: propActiveTab, setActiveTab: propSetActiveTab }: FinancePageProps = {}) {
  const cached = getGasCache('Finance', 'get');
  const [records, setRecords] = useState<FinanceRecord[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [localActiveTab, setLocalActiveTab] = useState<'ledger' | 'pandl' | 'reconcile'>('ledger');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          row.type === 'Income' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {row.type === 'Income' ? <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownCircle className="w-3.5 h-3.5 text-rose-500" />}
          {row.type === 'Income' ? 'PEMASUKAN' : 'PENGELUARAN'}
        </span>
      ),
      sortKey: 'type' as keyof FinanceRecord 
    },
    { header: 'Kategori', accessor: 'category' as keyof FinanceRecord, sortKey: 'category' as keyof FinanceRecord },
    { header: 'Deskripsi', accessor: 'description' as keyof FinanceRecord },
    { 
      header: 'Jumlah (Nominal)', 
      accessor: (row: FinanceRecord) => (
        <span className={`font-display font-bold ${row.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
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
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-100 transition-all cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => handleDeleteClick(row.id, e)}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl border border-rose-150/40 transition-all cursor-pointer"
            title="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Mini Profit & Loss Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Pemasukan</span>
            <p className="text-xl font-bold text-emerald-600 font-display">Rp {totalIncome.toLocaleString('id-ID')}</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Pengeluaran</span>
            <p className="text-xl font-bold text-rose-600 font-display">Rp {totalExpense.toLocaleString('id-ID')}</p>
          </div>
          <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center">
            <ArrowDownCircle className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Laba Bersih</span>
            <p className={`text-xl font-bold font-display ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              Rp {netProfit.toLocaleString('id-ID')}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
            netProfit >= 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            <Wallet className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Tab Navigation Switcher */}
      <div className="flex border-b border-slate-300 bg-white rounded-2xl px-2 shadow-xs">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 py-3.5 px-5 border-b-2 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-slate-950 text-slate-950 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Buku Besar Kas
        </button>
        <button
          onClick={() => setActiveTab('pandl')}
          className={`flex items-center gap-2 py-3.5 px-5 border-b-2 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'pandl'
              ? 'border-slate-950 text-slate-950 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Analisis Laba Rugi
        </button>
        <button
          onClick={() => setActiveTab('reconcile')}
          className={`flex items-center gap-2 py-3.5 px-5 border-b-2 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'reconcile'
              ? 'border-slate-950 text-slate-950 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Rekonsiliasi Kas & Bank
        </button>
      </div>

      <div className="flex-1">
        {activeTab === 'ledger' ? (
          loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-slate-200/80 rounded-2xl w-1/4"></div>
              <div className="h-72 bg-slate-200/80 rounded-2xl"></div>
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
          )
        ) : activeTab === 'pandl' ? (
          <FinanceAnalysis records={records} />
        ) : (
          <FinanceReconciliation records={records} onRefresh={fetchFinance} />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRecord ? 'Ubah Transaksi' : 'Tambah Transaksi Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipe Arus Kas</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('Income');
                  setCategory('Sales');
                }}
                className={`py-2.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  type === 'Income' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-inner' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" /> PEMASUKAN
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('Expense');
                  setCategory('Office Supplies');
                }}
                className={`py-2.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  type === 'Expense' 
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-inner' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" /> PENGELUARAN
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jumlah (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
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
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Deskripsi</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Berikan deskripsi singkat transaksi..."
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold resize-none"
            />
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
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
