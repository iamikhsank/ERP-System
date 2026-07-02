// src/pages/Inventory.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Edit2, Trash2, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  warehouse: string;
  minStock: number;
  createdAt: string;
}

export default function InventoryPage() {
  const cached = getGasCache('Inventory', 'get');
  const [items, setItems] = useState<InventoryItem[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [warehouse, setWarehouse] = useState('Gudang Utama');
  const [minStock, setMinStock] = useState(5);

  const fetchInventory = async (active = true) => {
    if (!cached && active) setLoading(true);
    try {
      const res = await callGas('Inventory', 'get');
      if (active) setItems(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchInventory(active);
    return () => {
      active = false;
    };
  }, []);

  const handleAddClick = () => {
    setSelectedItem(null);
    setSku('');
    setName('');
    setQuantity(0);
    setWarehouse('Gudang Utama');
    setMinStock(5);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(item);
    setSku(item.sku);
    setName(item.name);
    setQuantity(item.quantity);
    setWarehouse(item.warehouse);
    setMinStock(item.minStock || 5);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
      try {
        await callGas('Inventory', 'delete', { id });
        fetchInventory();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      sku,
      name,
      quantity,
      warehouse,
      minStock,
      id: selectedItem?.id
    };

    try {
      if (selectedItem) {
        await callGas('Inventory', 'update', payload);
      } else {
        await callGas('Inventory', 'create', payload);
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: 'SKU', accessor: 'sku' as keyof InventoryItem, sortKey: 'sku' as keyof InventoryItem },
    { header: 'Nama Barang', accessor: 'name' as keyof InventoryItem, sortKey: 'name' as keyof InventoryItem },
    { 
      header: 'Stok', 
      accessor: (row: InventoryItem) => (
        <span className="flex items-center gap-1.5 font-bold">
          <span className="text-slate-900 font-display font-bold text-sm">{row.quantity}</span>
          {row.quantity <= (row.minStock || 5) ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-bold">
              <AlertTriangle className="w-3 h-3 text-rose-500" /> MINIM
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> AMAN
            </span>
          )}
        </span>
      ), 
      sortKey: 'quantity' as keyof InventoryItem 
    },
    { header: 'Gudang', accessor: 'warehouse' as keyof InventoryItem, sortKey: 'warehouse' as keyof InventoryItem },
    { 
      header: 'Aksi', 
      accessor: (row: InventoryItem) => (
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
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex-1">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-200/80 rounded-2xl w-1/4"></div>
            <div className="h-72 bg-slate-200/80 rounded-2xl"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            searchKey="name"
            searchPlaceholder="Cari berdasarkan nama barang..."
            onAddClick={handleAddClick}
            addLabel="Tambah Barang"
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedItem ? 'Ubah Detail Barang' : 'Tambah Barang Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">SKU</label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Contoh: SKU-XYZ-123"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Barang</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Laptop ThinkPad T14"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jumlah (Stok)</label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stok Minimum (Alert)</label>
              <input
                type="number"
                min="1"
                required
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lokasi Gudang</label>
            <div className="relative">
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
              >
                <option value="Gudang Utama">Gudang Utama</option>
                <option value="Gudang Barat">Gudang Barat</option>
                <option value="Transit Cabang">Transit Cabang</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
