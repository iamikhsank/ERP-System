// src/pages/HR.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Edit2, Trash2, Users, Briefcase, Award } from 'lucide-react';

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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status === 'Active' ? 'Aktif' : 'Non-Aktif'}
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
      {/* Visual KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Karyawan</span>
            <p className="text-xl font-bold text-gray-900">{employees.length} Orang</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Karyawan Aktif</span>
            <p className="text-xl font-bold text-green-600">
              {employees.filter(e => e.status === 'Active').length} Karyawan
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Pengeluaran Gaji</span>
            <p className="text-xl font-bold text-blue-600">
              Rp {employees.reduce((sum, e) => sum + Number(e.salary || 0), 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Award className="w-5 h-5" />
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              required
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Karyawan</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: budi@perusahaan.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Jabatan / Posisi</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Staff IT">Staff IT</option>
                <option value="Manager Operasional">Manager Operasional</option>
                <option value="HR Generalist">HR Generalist</option>
                <option value="Staff Finance">Staff Finance</option>
                <option value="Sales Executive">Sales Executive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Gaji Bulanan (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Status Keaktifan</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Aktif</option>
              <option value="Inactive">Non-Aktif</option>
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
