// src/components/VendorDirectory.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Edit2, Trash2, PlusCircle, Star, Phone, Mail, Award, BookOpen, ChevronDown } from 'lucide-react';

interface SupplierItem {
  id: string;
  name: string;
  contact: string;
  email: string;
  deliveryPerformance: string; // e.g., "98%" or "Sangat Baik"
  catalog: string; // e.g., "Kertas, Tinta, Printer"
  createdAt: string;
}

export default function VendorDirectory() {
  const cached = getGasCache('Procurement', 'getSuppliers');
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryPerformance, setDeliveryPerformance] = useState('95%');
  const [catalog, setCatalog] = useState('');

  const fetchSuppliers = async (active = true) => {
    if (!cached && active) setLoading(true);
    try {
      const res = await callGas('Procurement', 'getSuppliers');
      if (active) setSuppliers(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchSuppliers(active);
    return () => {
      active = false;
    };
  }, []);

  const handleAddClick = () => {
    setSelectedSupplier(null);
    setName('');
    setContact('');
    setEmail('');
    setDeliveryPerformance('95%');
    setCatalog('');
    setIsModalOpen(true);
  };

  const handleEditClick = (sup: SupplierItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSupplier(sup);
    setName(sup.name || '');
    setContact(sup.contact || '');
    setEmail(sup.email || '');
    setDeliveryPerformance(sup.deliveryPerformance || '95%');
    setCatalog(sup.catalog || '');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus vendor ini dari direktori?')) {
      try {
        await callGas('Procurement', 'deleteSupplier', { id });
        fetchSuppliers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      contact,
      email,
      deliveryPerformance,
      catalog,
      id: selectedSupplier?.id
    };

    try {
      if (selectedSupplier) {
        await callGas('Procurement', 'updateSupplier', payload);
      } else {
        await callGas('Procurement', 'createSupplier', payload);
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  // Deliver perf style helper
  const getPerfColor = (perf: string) => {
    const val = parseInt(perf) || 0;
    if (val >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (val >= 75) return 'text-amber-700 bg-amber-50 border-amber-100';
    return 'text-rose-700 bg-rose-50 border-rose-100';
  };

  const columns = [
    { 
      header: 'Nama Vendor / Supplier', 
      accessor: (row: SupplierItem) => (
        <div className="py-1">
          <p className="font-bold text-slate-800">{row.name}</p>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            ID: {row.id.substring(0, 6)}...
          </span>
        </div>
      ), 
      sortKey: 'name' as keyof SupplierItem 
    },
    { 
      header: 'Kontak Vendor', 
      accessor: (row: SupplierItem) => (
        <div className="space-y-0.5 text-xs">
          <p className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <Phone className="w-3 h-3 text-slate-400" /> {row.contact || '-'}
          </p>
          <p className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <Mail className="w-3 h-3 text-slate-400" /> {row.email || '-'}
          </p>
        </div>
      )
    },
    { 
      header: 'Performa Pengiriman', 
      accessor: (row: SupplierItem) => (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getPerfColor(row.deliveryPerformance)}`}>
            <Award className="w-3 h-3" /> {row.deliveryPerformance}
          </span>
          {/* Subtle micro progress bar */}
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
            <div 
              className="h-full bg-indigo-600 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(0, parseInt(row.deliveryPerformance) || 0))}%` }}
            />
          </div>
        </div>
      ),
      sortKey: 'deliveryPerformance' as keyof SupplierItem
    },
    { 
      header: 'Katalog Produk & Kategori', 
      accessor: (row: SupplierItem) => (
        <div className="max-w-[200px] truncate text-xs text-slate-600 font-semibold flex items-center gap-1.5" title={row.catalog}>
          <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>{row.catalog || '-'}</span>
        </div>
      )
    },
    { 
      header: 'Aksi', 
      accessor: (row: SupplierItem) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => handleEditClick(row, e)}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-250 transition-all cursor-pointer"
            title="Edit Vendor"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => handleDeleteClick(row.id, e)}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl border border-rose-150/40 transition-all cursor-pointer"
            title="Hapus Vendor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  // Stats calculate
  const totalVendors = suppliers.length;
  const bestPerformers = suppliers.filter(s => (parseInt(s.deliveryPerformance) || 0) >= 90).length;

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Supplier KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Terdaftar</span>
            <p className="text-xl font-bold text-indigo-600 font-display">{totalVendors} Vendor</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vendor Performa Tinggi (≥ 90%)</span>
            <p className="text-xl font-bold text-emerald-600 font-display">{bestPerformers} Mitra</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-emerald-600 stroke-[2] fill-emerald-500" />
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
            data={suppliers}
            searchKey="name"
            searchPlaceholder="Cari nama vendor / supplier..."
            onAddClick={handleAddClick}
            addLabel="Tambah Vendor"
          />
        )}
      </div>

      {/* Modal Add/Edit Supplier */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSupplier ? 'Ubah Profil Vendor' : 'Daftarkan Vendor Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Vendor / Perusahaan</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: PT Semesta Niaga Jaya"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">No. Telepon / WhatsApp</label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Kantor</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: info@semestaniaga.com"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Performa Pengiriman</label>
              <div className="relative">
                <select
                  value={deliveryPerformance}
                  onChange={(e) => setDeliveryPerformance(e.target.value)}
                  className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
                >
                  <option value="100%">100% (Sempurna)</option>
                  <option value="98%">98% (Sangat Baik)</option>
                  <option value="95%">95% (Baik)</option>
                  <option value="90%">90% (Cukup)</option>
                  <option value="85%">85% (Butuh Perbaikan)</option>
                  <option value="70%">70% (Kritis)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Katalog Utama / Produk</label>
              <input
                type="text"
                required
                value={catalog}
                onChange={(e) => setCatalog(e.target.value)}
                placeholder="Contoh: ATK, Elektronik, Kertas"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
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
              Simpan Vendor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
