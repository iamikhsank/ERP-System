// src/components/StockAdjustment.tsx
import React, { useState } from 'react';
import { callGas } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Sliders, Check, Info, AlertTriangle, ArrowRight } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  warehouse: string;
  minStock: number;
  createdAt: string;
}

interface StockAdjustmentProps {
  items: InventoryItem[];
  onRefresh: () => void;
}

export default function StockAdjustment({ items, onRefresh }: StockAdjustmentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [actualQty, setActualQty] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAdjustClick = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(item);
    setActualQty(Number(item.quantity || 0));
    setReason('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setLoading(true);
    try {
      await callGas('Inventory', 'adjust', {
        id: selectedItem.id,
        actualQty,
        reason: reason || 'Penyesuaian Opname Fisik'
      });
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const diff = selectedItem ? actualQty - Number(selectedItem.quantity || 0) : 0;

  const columns = [
    { 
      header: 'SKU', 
      accessor: (row: InventoryItem) => <span className="font-mono font-bold text-slate-800">{row.sku}</span>,
      sortKey: 'sku' as keyof InventoryItem 
    },
    { header: 'Nama Produk', accessor: 'name' as keyof InventoryItem, sortKey: 'name' as keyof InventoryItem },
    { header: 'Gudang', accessor: 'warehouse' as keyof InventoryItem, sortKey: 'warehouse' as keyof InventoryItem },
    { 
      header: 'Stok Sistem', 
      accessor: (row: InventoryItem) => (
        <span className="font-bold text-slate-800 font-display text-xs">{row.quantity} unit</span>
      ), 
      sortKey: 'quantity' as keyof InventoryItem 
    },
    { 
      header: 'Tindakan Opname', 
      accessor: (row: InventoryItem) => (
        <button
          onClick={(e) => handleAdjustClick(row, e)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <Sliders className="w-3.5 h-3.5" />
          OPNAME FISIK
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Alert Banner / Guide */}
      <div className="bg-amber-50/60 border border-amber-200 p-4.5 rounded-2xl flex items-start gap-3.5">
        <div className="p-2 bg-amber-100/80 rounded-xl text-amber-700">
          <Info className="w-5 h-5 stroke-[2]" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider font-display">Instruksi Stock Opname (Penyesuaian Fisik)</h4>
          <p className="text-[11px] text-amber-700/90 font-semibold leading-relaxed">
            Halaman ini digunakan untuk melakukan audit stok berkala. Masukkan kuantitas riil yang ditemukan di dalam rak gudang fisik.
            Sistem akan secara otomatis mencatat selisih (*surplus* atau *deficit*) di dalam Buku Log Mutasi serta mengoreksi angka sisa stok.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] p-5">
        <DataTable
          columns={columns}
          data={items}
          searchKey="name"
          searchPlaceholder="Cari nama produk untuk audit opname..."
        />
      </div>

      {/* modal adjustment physical take */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Formulir Stock Opname"
      >
        {selectedItem && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Nama Barang</span>
                <span className="text-slate-800 font-bold">{selectedItem.name}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">SKU</span>
                <span className="text-slate-800 font-bold font-mono text-indigo-600">{selectedItem.sku}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stok Sistem Saat Ini</label>
                <div className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-bold">
                  {selectedItem.quantity} unit
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stok Fisik Sebenarnya</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={actualQty}
                  onChange={(e) => setActualQty(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
                />
              </div>
            </div>

            {/* Live calculation preview */}
            <div className="p-4 rounded-xl border flex items-center justify-between text-xs font-semibold bg-white border-slate-200">
              <span className="text-slate-500 font-bold">Hasil Perhitungan Selisih:</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-slate-400 font-mono">{selectedItem.quantity} unit</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-800 font-mono">{actualQty} unit</span>
                
                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  diff > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  diff < 0 ? 'bg-rose-50 text-rose-700 border-rose-100' :
                  'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {diff > 0 ? `+${diff} SURPLUS` : diff < 0 ? `${diff} DEFISIT` : '0 NETRAL'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Alasan Perubahan / Penyesuaian</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Barang menyusut di rak penyimpanan, rusak saat inspeksi bulanan, atau koreksi input sebelumnya..."
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
                disabled={loading}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider"
              >
                Simpan Opname
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
