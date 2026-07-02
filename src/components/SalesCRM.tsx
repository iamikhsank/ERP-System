// src/components/SalesCRM.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { User, Phone, Mail, Award, Landmark, Plus, Edit3, Trash2 } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  loyaltyPoints: number;
  receivable: number;
  createdAt: string;
}

interface SalesOrder {
  id: string;
  orderNo: string;
  customer: string;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Cancelled';
  createdAt: string;
}

interface SalesCRMProps {
  orders: SalesOrder[];
}

export default function SalesCRM({ orders }: SalesCRMProps) {
  const cached = getGasCache('Sales', 'getCustomers');
  const [customers, setCustomers] = useState<Customer[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [receivable, setReceivable] = useState(0);

  const fetchCustomers = async (active = true) => {
    if (!cached && active) setLoading(true);
    try {
      const res = await callGas('Sales', 'getCustomers');
      if (active) setCustomers(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchCustomers(active);
    return () => {
      active = false;
    };
  }, []);

  const handleAddClick = () => {
    setSelectedCustomer(null);
    setName('');
    setContact('');
    setEmail('');
    setLoyaltyPoints(0);
    setReceivable(0);
    setIsModalOpen(true);
  };

  const handleEditClick = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(cust);
    setName(cust.name || '');
    setContact(cust.contact || '');
    setEmail(cust.email || '');
    setLoyaltyPoints(Number(cust.loyaltyPoints || 0));
    setReceivable(Number(cust.receivable || 0));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Hapus data pelanggan "${name}" dari database?`)) {
      setLoading(true);
      try {
        await callGas('Sales', 'deleteCustomer', { id });
        fetchCustomers();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      id: selectedCustomer?.id,
      name,
      contact,
      email,
      loyaltyPoints,
      receivable,
    };

    try {
      if (selectedCustomer) {
        await callGas('Sales', 'updateCustomer', payload);
      } else {
        await callGas('Sales', 'createCustomer', payload);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Calculate actual outstanding receivable from Sales Orders dynamically if any
  const getDynamicReceivable = (customerName: string, staticReceivable: number) => {
    const activeUnpaidSales = orders
      .filter(o => o.customer === customerName && o.status === 'Sent')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return activeUnpaidSales > 0 ? activeUnpaidSales : staticReceivable;
  };

  // Helper: Calculate loyalty points dynamically based on Paid orders (1 point per Rp 1.000.000 paid)
  const getDynamicLoyalty = (customerName: string, staticPoints: number) => {
    const totalPaid = orders
      .filter(o => o.customer === customerName && o.status === 'Paid')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const calculatedPoints = Math.floor(totalPaid / 1000000);
    return calculatedPoints > 0 ? calculatedPoints : staticPoints;
  };

  const columns = [
    { 
      header: 'Nama Pelanggan', 
      accessor: (row: Customer) => (
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
            {row.name ? row.name.charAt(0) : 'C'}
          </div>
          <div>
            <p className="font-bold text-slate-800">{row.name}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pelanggan Terdaftar</p>
          </div>
        </div>
      ), 
      sortKey: 'name' as keyof Customer 
    },
    { 
      header: 'Kontak HP', 
      accessor: (row: Customer) => (
        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.contact || '-'}</span>
        </div>
      ), 
      sortKey: 'contact' as keyof Customer 
    },
    { 
      header: 'Email', 
      accessor: (row: Customer) => (
        <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.email || '-'}</span>
        </div>
      ), 
      sortKey: 'email' as keyof Customer 
    },
    { 
      header: 'Poin Loyalitas', 
      accessor: (row: Customer) => {
        const points = getDynamicLoyalty(row.name, Number(row.loyaltyPoints || 0));
        return (
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-500" />
            <span className="font-extrabold text-slate-800 font-display text-xs">{points} Poin</span>
          </div>
        );
      },
      sortKey: 'loyaltyPoints' as keyof Customer 
    },
    { 
      header: 'Sisa Piutang Dagang', 
      accessor: (row: Customer) => {
        const recVal = getDynamicReceivable(row.name, Number(row.receivable || 0));
        return (
          <div className="flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-amber-500" />
            <span className={`font-extrabold font-display text-xs ${recVal > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              Rp {recVal.toLocaleString('id-ID')}
            </span>
          </div>
        );
      },
      sortKey: 'receivable' as keyof Customer 
    },
    { 
      header: 'Tindakan', 
      accessor: (row: Customer) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => handleEditClick(row, e)}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
            title="Edit Pelanggan"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => handleDelete(row.id, row.name, e)}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 rounded-lg border border-rose-100 hover:border-rose-200 transition-all cursor-pointer"
            title="Hapus Pelanggan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) 
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Visual KPI Widgets for CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Pelanggan Terdaftar</span>
            <p className="text-xl font-bold text-indigo-600 font-display">{customers.length} Entitas</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center">
            <User className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Piutang Dagang Aktif</span>
            <p className="text-xl font-bold text-amber-600 font-display">
              Rp {customers
                .reduce((sum, c) => sum + getDynamicReceivable(c.name, Number(c.receivable || 0)), 0)
                .toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex items-center justify-center">
            <Landmark className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rata-rata Loyalitas</span>
            <p className="text-xl font-bold text-emerald-600 font-display">
              {(customers.length > 0 
                ? (customers.reduce((sum, c) => sum + getDynamicLoyalty(c.name, Number(c.loyaltyPoints || 0)), 0) / customers.length) 
                : 0).toFixed(1)} Poin
            </p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
            <Award className="w-5 h-5 stroke-[2]" />
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
            data={customers}
            searchKey="name"
            searchPlaceholder="Cari berdasarkan nama pelanggan..."
            onAddClick={handleAddClick}
            addLabel="Tambah Pelanggan Baru"
          />
        )}
      </div>

      {/* modal create/update customer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? 'Ubah Informasi Pelanggan' : 'Daftarkan Pelanggan Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Perusahaan / Pelanggan</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: PT. Sumber Global Makmur"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">No. Telepon / HP</label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Alamat Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: kontak@perusahaan.com"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Poin Loyalitas Manual (Pilihan)</label>
              <input
                type="number"
                min="0"
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sisa Piutang Awal (IDR)</label>
              <input
                type="number"
                min="0"
                value={receivable}
                onChange={(e) => setReceivable(Number(e.target.value))}
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
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider"
            >
              {selectedCustomer ? 'Perbarui Pelanggan' : 'Daftarkan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
