// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { callGas } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Settings, Shield, Plus, Edit2, Trash2, Building2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  name: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');
  const [companyName, setCompanyName] = useState('Perusahaan ERP Indonesia');
  const [address, setAddress] = useState('Jl. Jenderal Sudirman No. 12, Jakarta');
  const [currency, setCurrency] = useState('IDR (Rp)');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-2026-');
  const [poPrefix, setPoPrefix] = useState('PO-2026-');

  // Users management states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'staff' | 'viewer'>('viewer');

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await callGas('Auth', 'getUsers');
      setUsers(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Pengaturan profil perusahaan berhasil disimpan!');
  };

  const handleAddUserClick = () => {
    setSelectedUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('viewer');
    setIsModalOpen(true);
  };

  const handleEditUserClick = (u: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setIsModalOpen(true);
  };

  const handleDeleteUserClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus pengguna ini?')) {
      try {
        await callGas('Auth', 'deleteUser', { id });
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (err) {
        console.error('Gagal menghapus pengguna:', err);
        alert('Gagal menghapus pengguna.');
      }
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Edit mode
        const updatedUser = { id: selectedUser.id, name: userName, email: userEmail, role: userRole };
        await callGas('Auth', 'updateUser', updatedUser);
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, name: userName, email: userEmail, role: userRole } : u));
      } else {
        // Create mode
        const newUserPayload = { name: userName, email: userEmail, role: userRole };
        const res = await callGas('Auth', 'createUser', newUserPayload);
        if (res && res.id) {
          setUsers(prev => [...prev, { id: res.id, ...newUserPayload }]);
        } else {
          fetchUsers();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Gagal menyimpan pengguna:', err);
      alert('Gagal menyimpan pengguna ke Google Sheets.');
    }
  };

  const columns = [
    { header: 'Nama Pengguna', accessor: 'name' as keyof User, sortKey: 'name' as keyof User },
    { header: 'Email', accessor: 'email' as keyof User, sortKey: 'email' as keyof User },
    { 
      header: 'Peran (Role)', 
      accessor: (row: User) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          row.role === 'manager' ? 'bg-blue-100 text-blue-800' :
          row.role === 'staff' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.role.toUpperCase()}
        </span>
      ),
      sortKey: 'role' as keyof User 
    },
    { 
      header: 'Aksi', 
      accessor: (row: User) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => handleEditUserClick(row, e)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => handleDeleteUserClick(row.id, e)}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Profil Perusahaan
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Manajemen User & Hak Akses
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Detail Organisasi</h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nama Perusahaan</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Alamat Lengkap</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Mata Uang Acuan</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="IDR (Rp)">Rupiah (IDR - Rp)</option>
                  <option value="USD ($)">US Dollar (USD - $)</option>
                  <option value="SGD ($)">Singapore Dollar (SGD - $)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Format Penomoran Dokumen (Auto numbering)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Awalan Invoice Penjualan (Prefix)</label>
                  <input
                    type="text"
                    required
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Awalan PO Pengadaan (Prefix)</label>
                  <input
                    type="text"
                    required
                    value={poPrefix}
                    onChange={(e) => setPoPrefix(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {loadingUsers ? (
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              searchKey="name"
              searchPlaceholder="Cari pengguna berdasarkan nama..."
              onAddClick={handleAddUserClick}
              addLabel="Tambah Pengguna"
            />
          )}

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={selectedUser ? 'Ubah Informasi Pengguna' : 'Daftarkan Pengguna Baru'}
          >
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Contoh: Muhammad Ikhsan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email (Akun Google Workspace)</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Contoh: user@domain.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Peran / Hak Akses (Role-Based Access)</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Administrator (Akses Penuh)</option>
                  <option value="manager">Manager (Akses Approval & Laporan)</option>
                  <option value="staff">Staff (Akses Entri Data)</option>
                  <option value="viewer">Viewer (Akses Baca Saja / Read-Only)</option>
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
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}
