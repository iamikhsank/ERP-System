// src/components/StockLedger.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, Sliders, History } from 'lucide-react';

interface MutationItem {
  id: string;
  sku: string;
  name: string;
  type: 'Initial' | 'In' | 'Out' | 'Adjustment';
  quantity: number;
  prevQty: number;
  newQty: number;
  description: string;
  createdAt: string;
}

export default function StockLedger() {
  const cached = getGasCache('Inventory', 'getMutations');
  const [mutations, setMutations] = useState<MutationItem[]>(cached || []);
  const [loading, setLoading] = useState(!cached);

  const fetchMutations = async (active = true) => {
    if (!cached && active) setLoading(true);
    try {
      const res = await callGas('Inventory', 'getMutations');
      if (active) setMutations(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchMutations(active);
    return () => {
      active = false;
    };
  }, []);

  // Helper stats
  const totalIn = mutations
    .filter(m => m.type === 'In' || (m.type === 'Adjustment' && Number(m.quantity) > 0))
    .reduce((sum, m) => sum + Math.abs(Number(m.quantity || 0)), 0);

  const totalOut = mutations
    .filter(m => m.type === 'Out' || (m.type === 'Adjustment' && Number(m.quantity) < 0))
    .reduce((sum, m) => sum + Math.abs(Number(m.quantity || 0)), 0);

  const columns = [
    { 
      header: 'Waktu Mutasi', 
      accessor: (row: MutationItem) => (
        <span className="font-mono text-[11px] font-bold text-slate-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
        </span>
      ), 
      sortKey: 'createdAt' as keyof MutationItem 
    },
    { 
      header: 'SKU', 
      accessor: (row: MutationItem) => <span className="font-mono font-bold text-indigo-600">{row.sku}</span>,
      sortKey: 'sku' as keyof MutationItem 
    },
    { header: 'Nama Produk', accessor: 'name' as keyof MutationItem, sortKey: 'name' as keyof MutationItem },
    { 
      header: 'Tipe', 
      accessor: (row: MutationItem) => {
        const type = row.type;
        if (type === 'In' || (type === 'Adjustment' && Number(row.quantity) > 0)) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-bold">
              <ArrowDownLeft className="w-3 h-3 text-emerald-500" /> MASUK
            </span>
          );
        } else if (type === 'Out' || (type === 'Adjustment' && Number(row.quantity) < 0)) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-full font-bold">
              <ArrowUpRight className="w-3 h-3 text-rose-500" /> KELUAR
            </span>
          );
        } else if (type === 'Initial') {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full font-bold">
              AWAL
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full font-bold">
              <Sliders className="w-3 h-3 text-amber-500" /> ADJUST
            </span>
          );
        }
      },
      sortKey: 'type' as keyof MutationItem
    },
    { 
      header: 'Kuantitas', 
      accessor: (row: MutationItem) => (
        <span className="font-bold font-display text-xs text-slate-800">
          {Math.abs(Number(row.quantity))} unit
        </span>
      ),
      sortKey: 'quantity' as keyof MutationItem
    },
    { 
      header: 'Rentang Stok', 
      accessor: (row: MutationItem) => (
        <span className="text-slate-400 font-bold text-xs">
          {row.prevQty} → <span className="text-slate-700">{row.newQty}</span>
        </span>
      )
    },
    { header: 'Deskripsi Keterangan', accessor: 'description' as keyof MutationItem }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Visual KPI Widgets for Stock Ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Mutasi Log</span>
            <p className="text-xl font-bold text-indigo-600 font-display">{mutations.length} Baris</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Barang Masuk (Inbound)</span>
            <p className="text-xl font-bold text-emerald-600 font-display">+{totalIn} Unit</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Barang Keluar (Outbound)</span>
            <p className="text-xl font-bold text-rose-600 font-display">-{totalOut} Unit</p>
          </div>
          <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-rose-600 stroke-[2]" />
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
          <div className="bg-white rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-display">Log Mutasi Produk Kronologis</h3>
                <p className="text-[10px] text-slate-400 font-bold">Catatan historis dari proses Pembelian, Penjualan, & Opname Fisik</p>
              </div>
              <button 
                onClick={() => fetchMutations()}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
                title="Refresh Log"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <DataTable
              columns={columns}
              data={mutations}
              searchKey="name"
              searchPlaceholder="Cari berdasarkan nama produk..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
