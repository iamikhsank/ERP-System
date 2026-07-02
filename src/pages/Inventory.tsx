// src/pages/Inventory.tsx
import React, { useState, useEffect } from 'react';
import { callGas } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Edit2, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [warehouse, setWarehouse] = useState('Gudang Utama');
  const [minStock, setMinStock] = useState(5);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await callGas('Inventory', 'get');
      setItems(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
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
          {row.quantity}
          {row.quantity <= (row.minStock || 5) ? (
            <span className="flex items-center gap-1 text-xs text-rose-600 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> Minim
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Aman
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
      <div className="flex-1">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">SKU</label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Contoh: SKU-XYZ-123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nama Barang</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Laptop ThinkPad T14"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Jumlah (Stok)</label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Stok Minimum (Alert)</label>
              <input
                type="number"
                min="1"
                required
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Lokasi Gudang</label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Gudang Utama">Gudang Utama</option>
              <option value="Gudang Barat">Gudang Barat</option>
              <option value="Transit Cabang">Transit Cabang</option>
            </select>
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
