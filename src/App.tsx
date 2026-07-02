// src/App.tsx
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Truck, 
  FileText, 
  Settings as SettingsIcon, 
  Menu, 
  Bell, 
  User as UserIcon 
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
import ErrorConsole, { ErrorLog } from './components/ErrorConsole';

interface User {
  name: string;
  role: string;
  email: string;
}

export default function App() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Notifications & Console logs state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [logs, setLogs] = useState<ErrorLog[]>([]);

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
    const newLog: ErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      severity,
      message,
      technicalDetails: techDetails
    };
    setLogs(prev => [newLog, ...prev]);
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

  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Inventory', icon: Package, label: 'Persediaan (Inventory)' },
    { id: 'Finance', icon: DollarSign, label: 'Keuangan (Finance)' },
    { id: 'HR', icon: Users, label: 'Kepegawaian (HR)' },
    { id: 'Procurement', icon: ShoppingCart, label: 'Pengadaan (Procurement)' },
    { id: 'Sales', icon: Truck, label: 'Penjualan (Sales)' },
    { id: 'Reporting', icon: FileText, label: 'Pelaporan (Reporting)' },
    { id: 'Settings', icon: SettingsIcon, label: 'Pengaturan (Settings)' },
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
        return <InventoryPage />;
      case 'Finance':
        return <FinancePage />;
      case 'HR':
        return <HRPage />;
      case 'Procurement':
        return <ProcurementPage />;
      case 'Sales':
        return <SalesPage />;
      case 'Reporting':
        return <ReportingPage />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans select-none">
      {/* Sidebar */}
      <aside className={`bg-gray-900 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col z-20 shadow-lg`}>
        <div className="h-16 flex items-center px-5 border-b border-gray-800 gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/30">
            E
          </div>
          {isSidebarOpen && (
            <div className="leading-tight animate-in fade-in duration-300">
              <h1 className="font-extrabold text-sm tracking-wide text-gray-100 uppercase">Enterprise ERP</h1>
              <span className="text-[10px] text-gray-400 font-bold tracking-wider">WORKSPACE GAS</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-3">
          {menuItems.map(item => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  logSystem(`Navigasi ke modul ${item.label}.`, 'info');
                }}
                className={`w-full flex items-center px-3.5 py-3 rounded-xl transition-all font-medium text-xs uppercase tracking-wide gap-3 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className={`transition-all whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-800 bg-gray-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 p-1.5 bg-gray-800 rounded-xl flex items-center justify-center text-gray-300 shadow-inner border border-gray-700/50">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className={`overflow-hidden leading-snug ${!isSidebarOpen && 'hidden'}`}>
              <p className="text-xs font-bold truncate text-gray-200">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">{user?.role || 'admin'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-150 flex items-center justify-between px-6 z-10 shadow-sm shadow-black/[0.01]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors bg-white cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">Sistem ERP Enterprise</span>
              <h2 className="text-base font-bold text-gray-800 leading-tight">{activeMenu}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-150 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Koneksi Aktif</span>
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full shadow shadow-rose-500/30"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="flex-1 p-6 overflow-auto bg-gray-50 select-text">
          {renderActivePage()}
        </main>
      </div>

      {/* Toast Manager */}
      <Toast toasts={toasts} onClose={handleRemoveToast} />

      {/* Production-Grade Error System Console UI */}
      <ErrorConsole 
        logs={logs} 
        onClear={() => setLogs([])} 
        userRole={user?.role || 'admin'} 
      />
    </div>
  );
}
