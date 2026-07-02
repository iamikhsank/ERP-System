// src/App.tsx
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  ShoppingBag,
  Truck, 
  FileText, 
  Settings as SettingsIcon, 
  Menu, 
  Bell, 
  User as UserIcon,
  Check,
  Trash2,
  X,
  Inbox,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown
} from 'lucide-react';

import { callGas } from './api/gasClient';
import DashboardPage from './pages/Dashboard';
import InventoryPage from './pages/Inventory';
import FinancePage from './pages/Finance';
import HRPage from './pages/HR';
import ProcurementPage from './pages/Procurement';
import SalesPage from './pages/Sales';
import ReportingPage from './pages/Reporting';
import SettingsPage from './pages/Settings';

import Toast, { ToastMessage } from './components/Toast';

interface User {
  name: string;
  role: string;
  email: string;
}

interface ERPNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function App() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-pages tab states
  const [salesTab, setSalesTab] = useState<'orders' | 'crm' | 'performance'>('orders');
  const [financeTab, setFinanceTab] = useState<'ledger' | 'pandl' | 'reconcile'>('ledger');
  const [inventoryTab, setInventoryTab] = useState<'list' | 'ledger' | 'adjustment'>('list');
  const [procurementTab, setProcurementTab] = useState<'requisitions' | 'vendors'>('requisitions');
  const [hrTab, setHrTab] = useState<'directory' | 'payroll' | 'attendance'>('directory');

  // Expanded state for nested sidebar menus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Sales: true,
    Finance: true,
    Inventory: true,
    Procurement: true,
    HR: true,
  });

  // Notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<ERPNotification[]>([
    {
      id: '1',
      title: 'Koneksi Sukses',
      message: 'Sistem berhasil terhubung dengan database Google Sheets!',
      time: 'Baru saja',
      read: false,
      type: 'success'
    },
    {
      id: '2',
      title: 'Peringatan Stok',
      message: 'Persediaan barang Kertas HVS A4 tersisa 5 rim (di bawah limit minimum).',
      time: '10 mnt lalu',
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      title: 'Invoice Lunas',
      message: 'Penerimaan dana transaksi INV-2026-004 sebesar Rp 14.500.000 terverifikasi.',
      time: '1 jam lalu',
      read: true,
      type: 'success'
    },
    {
      id: '4',
      title: 'Persetujuan Pembelian',
      message: 'Permintaan pengadaan PO-2026-001 membutuhkan approval dari Manager Keuangan.',
      time: '2 jam lalu',
      read: true,
      type: 'info'
    }
  ]);

  // Add toast helper
  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      message
    };
    setToasts(prev => [...prev, newToast]);
  };

  // Add system console log helper
  const logSystem = (message: string, severity: 'error' | 'warning' | 'info' = 'info', techDetails?: string) => {
    const output = `[${severity.toUpperCase()}] ${message}${techDetails ? ` | Details: ${techDetails}` : ''}`;
    if (severity === 'error') {
      console.error(output);
    } else if (severity === 'warning') {
      console.warn(output);
    } else {
      console.log(output);
    }

    // Auto-populate notification list for real functionality
    const newNotif: ERPNotification = {
      id: `${Date.now()}-${Math.random()}`,
      title: severity === 'error' ? 'Masalah Sistem' : severity === 'warning' ? 'Peringatan' : 'Aktivitas Kerja',
      message,
      time: 'Baru saja',
      read: false,
      type: severity
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleRemoveToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await callGas('Auth', 'getCurrentUser');
        setUser(userData);
        logSystem('Pengguna berhasil diautentikasi.', 'info');
        showToast(`Selamat datang kembali, ${userData?.name || 'User'}!`, 'success');
      } catch (e: any) {
        logSystem('Gagal memuat profil pengguna.', 'error', e.stack || e.message);
        showToast('Gagal memuat profil pengguna dari Google Workspace.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const menuGroups = [
    {
      title: 'MAIN MENU',
      items: [
        { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { 
          id: 'Sales', 
          icon: ShoppingBag, 
          label: 'Penjualan (Sales)',
          subItems: [
            { id: 'orders', label: 'Pesanan Penjualan' },
            { id: 'crm', label: 'Hubungan Pelanggan (CRM)' },
            { id: 'performance', label: 'Kinerja Produk' }
          ]
        },
        { 
          id: 'Finance', 
          icon: DollarSign, 
          label: 'Keuangan (Finance)',
          subItems: [
            { id: 'ledger', label: 'Buku Besar' },
            { id: 'pandl', label: 'Analisis Laba/Rugi' },
            { id: 'reconcile', label: 'Rekonsiliasi Bank' }
          ]
        },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { 
          id: 'Inventory', 
          icon: Package, 
          label: 'Persediaan (Inventory)',
          subItems: [
            { id: 'list', label: 'Daftar Stok' },
            { id: 'ledger', label: 'Mutasi Stok' },
            { id: 'adjustment', label: 'Penyesuaian Stok' }
          ]
        },
        { 
          id: 'Procurement', 
          icon: ShoppingCart, 
          label: 'Pengadaan (Procurement)',
          subItems: [
            { id: 'requisitions', label: 'Permintaan PO' },
            { id: 'vendors', label: 'Direktori Vendor' }
          ]
        },
        { 
          id: 'HR', 
          icon: Users, 
          label: 'Kepegawaian (HR)',
          subItems: [
            { id: 'directory', label: 'Direktori Karyawan' },
            { id: 'payroll', label: 'Slip Gaji (Payroll)' },
            { id: 'attendance', label: 'Kehadiran & Cuti' }
          ]
        },
      ]
    },
    {
      title: 'PREFERENCES',
      items: [
        { id: 'Reporting', icon: FileText, label: 'Pelaporan (Reporting)' },
        { id: 'Settings', icon: SettingsIcon, label: 'Pengaturan (Settings)' },
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold tracking-wide text-gray-400">Menghubungkan ke Google Workspace Apps Script...</p>
      </div>
    );
  }

  const renderActivePage = () => {
    switch (activeMenu) {
      case 'Dashboard':
        return <DashboardPage />;
      case 'Inventory':
        return <InventoryPage activeTab={inventoryTab} setActiveTab={setInventoryTab} />;
      case 'Finance':
        return <FinancePage activeTab={financeTab} setActiveTab={setFinanceTab} />;
      case 'HR':
        return <HRPage activeTab={hrTab} setActiveTab={setHrTab} />;
      case 'Procurement':
        return <ProcurementPage activeTab={procurementTab} setActiveTab={setProcurementTab} />;
      case 'Sales':
        return <SalesPage activeTab={salesTab} setActiveTab={setSalesTab} />;
      case 'Reporting':
        return <ReportingPage />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans select-none antialiased">
      {/* Sidebar */}
      <aside className={`bg-white text-slate-800 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-[76px]'} flex flex-col h-full z-20 shadow-[8px_0_40px_rgba(0,0,0,0.015)] border-r border-slate-300`}>
        {/* Logo/Header */}
        {isSidebarOpen ? (
          <div className="h-18 flex items-center px-5 border-b border-slate-300 gap-3">
            <div className="flex items-center gap-3">
              {/* Black Rounded App Icon */}
              <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center text-white relative shadow-xs">
                <span className="font-display font-black text-lg italic tracking-tighter">A</span>
                <span className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
              </div>
              <div className="leading-tight animate-in fade-in duration-300">
                <h1 className="font-bold text-sm tracking-tight text-slate-900 font-display">Aivox</h1>
                <span className="text-[8px] text-indigo-600 font-extrabold tracking-widest uppercase block mt-0.5">APEX ERP</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-18 flex items-center justify-center border-b border-slate-300">
            <div
              className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center text-white relative shadow-xs"
              title="Aivox ERP"
            >
              <span className="font-display font-black text-lg italic tracking-tighter">A</span>
            </div>
          </div>
        )}
        
        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto px-3.5 space-y-4 custom-scrollbar">
          {menuGroups.map((group, groupIdx) => (
            <div key={group.title} className="space-y-1">
              {/* Category Header */}
              {isSidebarOpen ? (
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-3.5 mb-2 mt-2 font-display">
                  {group.title}
                </h3>
              ) : (
                groupIdx > 0 && <div className="h-px bg-slate-100 my-4 mx-2"></div>
              )}
              
              {/* Items */}
              <div className="space-y-1">
                {group.items.map(item => {
                  const isActive = activeMenu === item.id;
                  const isExpanded = expandedMenus[item.id];
                  const hasSub = !!item.subItems;

                  return (
                    <div key={item.id} className="space-y-0.5">
                      <button
                        onClick={() => {
                          if (hasSub) {
                            if (isActive) {
                              setExpandedMenus(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                            } else {
                              setActiveMenu(item.id);
                              setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
                            }
                          } else {
                            setActiveMenu(item.id);
                          }
                          logSystem(`Navigasi ke modul ${item.label}.`, 'info');
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 font-bold text-xs tracking-wide gap-3 relative group cursor-pointer ${
                          isActive 
                            ? 'bg-slate-950 text-white shadow-[0_4px_12px_rgba(15,23,42,0.12)]' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        title={!isSidebarOpen ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                          <span className={`transition-all whitespace-nowrap truncate ${!isSidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                            {item.label}
                          </span>
                        </div>
                        {hasSub && isSidebarOpen && (
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                            isExpanded ? 'rotate-180 text-white' : ''
                          }`} />
                        )}
                      </button>

                      {/* Sub-menu rendering with beautiful visual branching tree lines */}
                      {isSidebarOpen && hasSub && isExpanded && (
                        <div className="pl-6 relative mt-1 ml-2.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          {/* Batang vertikal pohon */}
                          <div className="absolute left-[9px] top-0 bottom-3 w-px bg-slate-200 pointer-events-none"></div>
                          
                          {item.subItems!.map((sub, idx) => {
                            let isSubActive = false;
                            if (item.id === 'Sales' && salesTab === sub.id && isActive) isSubActive = true;
                            if (item.id === 'Finance' && financeTab === sub.id && isActive) isSubActive = true;
                            if (item.id === 'Inventory' && inventoryTab === sub.id && isActive) isSubActive = true;
                            if (item.id === 'Procurement' && procurementTab === sub.id && isActive) isSubActive = true;
                            if (item.id === 'HR' && hrTab === sub.id && isActive) isSubActive = true;

                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setActiveMenu(item.id);
                                  if (item.id === 'Sales') setSalesTab(sub.id as any);
                                  if (item.id === 'Finance') setFinanceTab(sub.id as any);
                                  if (item.id === 'Inventory') setInventoryTab(sub.id as any);
                                  if (item.id === 'Procurement') setProcurementTab(sub.id as any);
                                  if (item.id === 'HR') setHrTab(sub.id as any);
                                  logSystem(`Navigasi ke sub-modul ${item.label} > ${sub.label}.`, 'info');
                                }}
                                className={`w-full flex items-center pl-4 pr-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 relative cursor-pointer ${
                                  isSubActive 
                                    ? 'text-indigo-600 bg-indigo-50/40 font-bold' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                {/* Lekukan visual melengkung ke sub-menu */}
                                <span className={`absolute left-[-16px] top-0 h-1/2 w-3.5 border-l border-b ${
                                  isSubActive ? 'border-indigo-400/60' : 'border-slate-200'
                                } rounded-bl-md pointer-events-none`} />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
        {/* User Info & Profile at Bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs uppercase font-display">
                {user?.name ? user.name.slice(0, 2) : 'AD'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs animate-pulse"></span>
            </div>
            
            {isSidebarOpen && (
              <div className="overflow-hidden leading-normal flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-slate-800 font-display">{user?.name || 'Administrator'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    {user?.role || 'admin'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">Enterprise</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-18 bg-white/80 backdrop-blur-md border-b border-slate-300 flex items-center justify-between px-8 z-10 shadow-xs">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all bg-white cursor-pointer hover:shadow-sm"
              title={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
            >
              {isSidebarOpen ? (
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <path d="M9 3v18" />
                  <path d="m15 15-3-3 3-3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <path d="M9 3v18" />
                  <path d="m13 9 3 3-3 3" />
                </svg>
              )}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Apex ERP Cloud</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest leading-none">SaaS Pro</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-tight mt-0.5">{activeMenu}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            {/* Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50/70 border border-emerald-100 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-widest">Workspace Live</span>
            </div>

            {/* Notification Bell with interactive dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100/80 relative transition-colors cursor-pointer"
                title="Notifikasi Sistem"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white shadow-xs animate-bounce"></span>
                )}
              </button>

              {isNotificationOpen && (
                <>
                  {/* Backdrop to close */}
                  <div className="fixed inset-0 z-30" onClick={() => setIsNotificationOpen(false)} />
                  
                  {/* Dropdown Card */}
                  <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl border border-slate-300 shadow-[0_12px_40px_rgba(0,0,0,0.06)] py-3 z-40 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-display">Notifikasi</h4>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-extrabold">
                            {notifications.filter(n => !n.read).length} Baru
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2.5">
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button 
                            onClick={() => {
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                              showToast('Semua notifikasi ditandai telah dibaca', 'info');
                            }}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
                          >
                            Baca Semua
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setNotifications([]);
                            showToast('Daftar notifikasi dibersihkan', 'info');
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-bold transition-colors cursor-pointer"
                        >
                          Hapus Semua
                        </button>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <Inbox className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                          <p className="text-[11px] font-bold text-slate-500">Tidak ada notifikasi baru</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">Semua aktivitas sistem akan tampil di sini.</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                            }}
                            className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 relative group ${!n.read ? 'bg-indigo-50/10' : ''}`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                              {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                              {n.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                              {n.type === 'info' && <Info className="w-4 h-4 text-indigo-500" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-slate-800 truncate font-display">{n.title}</p>
                                <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal mt-0.5 font-semibold break-words">{n.message}</p>
                            </div>

                            {!n.read && (
                              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full absolute right-3 top-4"></span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotifications(prev => prev.filter(item => item.id !== n.id));
                              }}
                              className="opacity-0 group-hover:opacity-100 absolute right-2 bottom-2 p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-md transition-all animate-in fade-in duration-150"
                              title="Hapus"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="flex-1 p-8 overflow-auto bg-slate-100/50 select-text">
          {renderActivePage()}
        </main>
      </div>

      {/* Toast Manager */}
      <Toast toasts={toasts} onClose={handleRemoveToast} />
    </div>
  );
}
