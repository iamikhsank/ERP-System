// src/pages/HR.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Edit2, Trash2, Users, Briefcase, Award, ChevronDown } from 'lucide-react';

interface Employee {
  id: string;
  employeeName: string;
  position: string;
  status: 'Active' | 'Inactive';
  email: string;
  salary: number;
}

export default function HRPage() {
  const cached = getGasCache('HR', 'get');
  const [employees, setEmployees] = useState<Employee[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form states
  const [employeeName, setEmployeeName] = useState('');
  const [position, setPosition] = useState('Staff IT');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState(5000000);

  const fetchEmployees = async (active = true) => {
    if (!cached && active) setLoading(true);
    try {
      const res = await callGas('HR', 'get');
      if (active) setEmployees(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchEmployees(active);
    return () => {
      active = false;
    };
  }, []);

  const handleAddClick = () => {
    setSelectedEmployee(null);
    setEmployeeName('');
    setPosition('Staff IT');
    setStatus('Active');
    setEmail('');
    setSalary(5000000);
    setIsModalOpen(true);
  };

  const handleEditClick = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmployee(emp);
    setEmployeeName(emp.employeeName);
    setPosition(emp.position);
    setStatus(emp.status);
    setEmail(emp.email || '');
    setSalary(emp.salary || 5000000);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus karyawan ini?')) {
      try {
        await callGas('HR', 'delete', { id });
        fetchEmployees();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      employeeName,
      position,
      status,
      email,
      salary,
      id: selectedEmployee?.id
    };

    try {
      if (selectedEmployee) {
        await callGas('HR', 'update', payload);
      } else {
        await callGas('HR', 'create', payload);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: 'Nama Karyawan', accessor: 'employeeName' as keyof Employee, sortKey: 'employeeName' as keyof Employee },
    { header: 'Jabatan', accessor: 'position' as keyof Employee, sortKey: 'position' as keyof Employee },
    { header: 'Email', accessor: 'email' as keyof Employee },
    { 
      header: 'Gaji Bulanan', 
      accessor: (row: Employee) => `Rp ${Number(row.salary || 0).toLocaleString('id-ID')}`,
      sortKey: 'salary' as keyof Employee 
    },
    { 
      header: 'Status', 
      accessor: (row: Employee) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
          row.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {row.status === 'Active' ? 'AKTIF' : 'NON-AKTIF'}
        </span>
      ),
      sortKey: 'status' as keyof Employee 
    },
    { 
      header: 'Aksi', 
      accessor: (row: Employee) => (
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
      {/* Visual KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Karyawan</span>
            <p className="text-xl font-bold text-slate-900 font-display">{employees.length} Orang</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center">
            <Users className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Karyawan Aktif</span>
            <p className="text-xl font-bold text-emerald-600 font-display">
              {employees.filter(e => e.status === 'Active').length} Karyawan
            </p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
            <Briefcase className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Pengeluaran Gaji</span>
            <p className="text-xl font-bold text-blue-600 font-display">
              Rp {employees.reduce((sum, e) => sum + Number(e.salary || 0), 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center">
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
            data={employees}
            searchKey="employeeName"
            searchPlaceholder="Cari nama karyawan..."
            onAddClick={handleAddClick}
            addLabel="Tambah Karyawan"
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEmployee ? 'Ubah Informasi Karyawan' : 'Daftarkan Karyawan Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              required
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Karyawan</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: budi@perusahaan.com"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jabatan / Posisi</label>
              <div className="relative">
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
                >
                  <option value="Staff IT">Staff IT</option>
                  <option value="Manager Operasional">Manager Operasional</option>
                  <option value="HR Generalist">HR Generalist</option>
                  <option value="Staff Finance">Staff Finance</option>
                  <option value="Sales Executive">Sales Executive</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Gaji Bulanan (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status Keaktifan</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
              >
                <option value="Active">Aktif</option>
                <option value="Inactive">Non-Aktif</option>
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
