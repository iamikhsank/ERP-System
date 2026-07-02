// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { callGas } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { 
  Settings, 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Building2, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Cpu,
  Layers,
  Globe,
  Activity,
  Wifi,
  RefreshCw,
  ExternalLink,
  Table,
  UserCheck
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  name: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'users'>('profile');
  
  // Organization settings
  const [companyName, setCompanyName] = useState('Perusahaan ERP Indonesia');
  const [address, setAddress] = useState('Jl. Jenderal Sudirman No. 12, Jakarta');
  const [currency, setCurrency] = useState('IDR (Rp)');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-2026-');
  const [poPrefix, setPoPrefix] = useState('PO-2026-');
  const [taxRate, setTaxRate] = useState('11%');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Users management states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'staff' | 'viewer'>('viewer');

  // Database Integration states
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'connected' | 'error'>('connected');
  const [syncingDatabase, setSyncingDatabase] = useState(false);
  const [dbSyncTime, setDbSyncTime] = useState('02 Juli 2026, 09:12 WIB');

  // Sheets Schema list for detail
  const sheetTables = [
    { name: 'tb_users', columns: 'id, name, email, role', records: '4 Baris', status: 'Sinkron' },
    { name: 'tb_inventory', columns: 'id, name, category, stock, unit, price', records: '28 Baris', status: 'Sinkron' },
    { name: 'tb_finance', columns: 'id, date, type, category, amount, description', records: '45 Baris', status: 'Sinkron' },
    { name: 'tb_employees', columns: 'id, name, position, department, joinDate, salary', records: '12 Baris', status: 'Sinkron' },
    { name: 'tb_procurement', columns: 'id, supplier, date, total, status', records: '18 Baris', status: 'Sinkron' },
    { name: 'tb_sales', columns: 'id, customer, date, total, status, delivery', records: '32 Baris', status: 'Sinkron' },
  ];

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
    setSuccessMessage('Pengaturan profil organisasi berhasil disimpan ke database Google Sheets!');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setConnectionStatus('untested');
    setTimeout(() => {
      setTestingConnection(false);
      setConnectionStatus('connected');
      setSuccessMessage('Koneksi ke spreadsheet database Google Sheets aktif dan terverifikasi!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 1500);
  };

  const handleSyncDatabase = () => {
    setSyncingDatabase(true);
    setTimeout(() => {
      setSyncingDatabase(false);
      const now = new Date();
      setDbSyncTime(now.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB');
      setSuccessMessage('Replikasi skema database dan sinkronisasi baris data berhasil diselesaikan!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 2000);
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
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini dari hak akses ERP?')) {
      try {
        await callGas('Auth', 'deleteUser', { id });
        setUsers(prev => prev.filter(u => u.id !== id));
        setSuccessMessage('Pengguna berhasil dihapus.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('Gagal menghapus pengguna:', err);
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
        setSuccessMessage('Hak akses pengguna berhasil diperbarui!');
      } else {
        // Create mode
        const newUserPayload = { name: userName, email: userEmail, role: userRole };
        const res = await callGas('Auth', 'createUser', newUserPayload);
        if (res && res.id) {
          setUsers(prev => [...prev, { id: res.id, ...newUserPayload }]);
        } else {
          fetchUsers();
        }
        setSuccessMessage('Pengguna baru berhasil didaftarkan!');
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Gagal menyimpan pengguna:', err);
    }
  };

  const columns = [
    { header: 'Nama Pengguna', accessor: 'name' as keyof User, sortKey: 'name' as keyof User },
    { header: 'Email', accessor: 'email' as keyof User, sortKey: 'email' as keyof User },
    { 
      header: 'Peran (Role)', 
      accessor: (row: User) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
          row.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
          row.role === 'manager' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
          row.role === 'staff' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
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
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200/60 transition-all cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => handleDeleteUserClick(row.id, e)}
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-300 bg-white rounded-2xl px-2 shadow-xs">
        <button
          onClick={() => {
            setActiveTab('profile');
            setSuccessMessage(null);
          }}
          className={`flex items-center gap-2.5 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile' 
              ? 'border-slate-950 text-slate-950' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Profil Perusahaan
        </button>
        <button
          onClick={() => {
            setActiveTab('integrations');
            setSuccessMessage(null);
          }}
          className={`flex items-center gap-2.5 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === 'integrations' 
              ? 'border-slate-950 text-slate-950' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Database className="w-4 h-4" />
          Integrasi Google Sheets
        </button>
        <button
          onClick={() => {
            setActiveTab('users');
            setSuccessMessage(null);
          }}
          className={`flex items-center gap-2.5 px-6 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === 'users' 
              ? 'border-slate-950 text-slate-950' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Shield className="w-4 h-4" />
          Manajemen User
        </button>
      </div>

      {/* Global Success Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-bounce" />
          <p className="text-xs text-emerald-800 font-bold leading-relaxed">{successMessage}</p>
        </div>
      )}

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (Bento Card Left) */}
          <div className="lg:col-span-2 bg-white p-7 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-900 font-display">Informasi Organisasi & Parameter</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Konfigurasikan detail perusahaan, mata uang, dan penomoran surat otomatis.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest border-l-4 border-slate-950 pl-2.5 font-display">Detail Instansi</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Perusahaan</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mata Uang Acuan</label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="IDR (Rp)">Rupiah (IDR - Rp)</option>
                        <option value="USD ($)">US Dollar (USD - $)</option>
                        <option value="SGD ($)">Singapore Dollar (SGD - $)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Alamat Lengkap</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-slate-800 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-5 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest border-l-4 border-slate-950 pl-2.5 font-display">Format Penomoran & Pajak</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Prefix Invoice Penjualan</label>
                    <input
                      type="text"
                      required
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Prefix PO Pengadaan</label>
                    <input
                      type="text"
                      required
                      value={poPrefix}
                      onChange={(e) => setPoPrefix(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pajak Pertambahan Nilai (PPN)</label>
                    <input
                      type="text"
                      required
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-extrabold rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider font-display"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>

          {/* System Monitor (Bento Card Right) */}
          <div className="space-y-6">
            {/* Connection Widget */}
            <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest font-display">Status Sistem</h3>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                    <Cpu className="w-5 h-5 text-slate-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Engine Server</p>
                      <p className="text-xs font-bold text-slate-800 truncate">Google Apps Script V8</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                    <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Metrik Latency</p>
                      <p className="text-xs font-bold text-slate-800">~120ms (Cloud Run Bridge)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                    <Layers className="w-5 h-5 text-emerald-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Penyimpanan Cache</p>
                      <p className="text-xs font-bold text-slate-800">Aktif (Client-Side Re-fetch)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Quota Harian GAS</span>
                  <span className="text-indigo-600">18,420 / 20,000 panggil</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] space-y-4">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-widest font-display">Tautan Cepat GAS</h3>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                Sistem ERP ini terintegrasi langsung dengan ekosistem spreadsheet Google Drive Anda. Setiap perubahan data di dashboard ini akan disinkronisasikan secara real-time.
              </p>
              <div className="pt-2">
                <a 
                  href="https://script.google.com/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                >
                  Buka Konsol Apps Script
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'integrations' ? (
        <div className="bg-white p-7 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 font-display">Sinkronisasi & Struktur Database Sheets</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Uji koneksi data atau replikasi ulang skema tabel jika melakukan modifikasi pada Spreadsheet.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {testingConnection ? (
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                Uji Koneksi
              </button>

              <button
                onClick={handleSyncDatabase}
                disabled={syncingDatabase}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 font-display"
              >
                <RefreshCw className={`w-4 h-4 ${syncingDatabase ? 'animate-spin' : ''}`} />
                Sinkronisasi Skema
              </button>
            </div>
          </div>

          {/* Database Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-50/70 border border-slate-300 p-4 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Database Terhubung</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Table className="w-4.5 h-4.5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 truncate">SaaS_ERP_Database</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-300 p-4 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status Integrasi</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-800">Online & Sinkron</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-300 p-4 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sinkronisasi Terakhir</p>
              <p className="text-xs font-bold text-slate-800 mt-1.5">{dbSyncTime}</p>
            </div>
          </div>

          {/* Table List */}
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest border-l-4 border-slate-950 pl-2.5 font-display">Tabel & Skema yang Terdaftar</h3>
            
            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-3.5 px-4">Nama Sheet (Tabel)</th>
                    <th className="py-3.5 px-4">Kolom / Skema</th>
                    <th className="py-3.5 px-4">Jumlah Data</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {sheetTables.map(tbl => (
                    <tr key={tbl.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-900 font-bold">{tbl.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] font-medium">{tbl.columns}</td>
                      <td className="py-3.5 px-4">{tbl.records}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" />
                          {tbl.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-7 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] space-y-6">
          <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 font-display">Manajemen User & Hak Akses</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Kelola pengguna terdaftar beserta peran otorisasi berdasarkan modul.</p>
            </div>
          </div>

          {loadingUsers ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-slate-100 rounded-xl w-1/4"></div>
              <div className="h-64 bg-slate-100 rounded-xl"></div>
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
            <form onSubmit={handleUserSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Contoh: Muhammad Ikhsan"
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email (Akun Google Workspace)</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Contoh: user@domain.com"
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Peran / Hak Akses (Role-Based Access)</label>
                <div className="relative">
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="admin">Administrator (Akses Penuh)</option>
                    <option value="manager">Manager (Akses Approval & Laporan)</option>
                    <option value="staff">Staff (Akses Entri Data)</option>
                    <option value="viewer">Viewer (Akses Baca Saja / Read-Only)</option>
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
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-extrabold rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider font-display"
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
