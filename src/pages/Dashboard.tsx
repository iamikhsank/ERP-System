// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { callGas } from '../api/gasClient';
import { DollarSign, Package, Users, ShoppingCart, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  lowStockItems: number;
  cashflow: { month: string; income: number; expense: number }[];
  recentActivities: { id: string; time: string; type: string; message: string; severity: 'info' | 'warning' | 'success' }[];
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await callGas('Dashboard', 'getMetrics');
        // Standardize structure
        setMetrics({
          totalRevenue: res?.totalRevenue || 157500000,
          totalOrders: res?.totalOrders || 342,
          activeUsers: res?.activeUsers || 28,
          lowStockItems: res?.lowStockItems || 5,
          cashflow: res?.cashflow || [
            { month: 'Jan', income: 45000000, expense: 30000000 },
            { month: 'Feb', income: 52000000, expense: 34000000 },
            { month: 'Mar', income: 49000000, expense: 41000000 },
            { month: 'Apr', income: 63000000, expense: 39000000 },
            { month: 'Mei', income: 58000000, expense: 45000000 },
            { month: 'Jun', income: 71000000, expense: 48000000 },
          ],
          recentActivities: res?.recentActivities || [
            { id: '1', time: '10:15 WIB', type: 'Sales', message: 'Invoice #INV-2026-003 diterbitkan untuk Customer PT. Maju Jaya', severity: 'success' },
            { id: '2', time: '09:30 WIB', type: 'Inventory', message: 'Pemberitahuan: Stok Laptop Lenovo menipis di Gudang Utama (sisa 2 unit)', severity: 'warning' },
            { id: '3', time: '08:45 WIB', type: 'Procurement', message: 'Purchase Order #PO-2026-002 disetujui oleh Direktur', severity: 'success' },
            { id: '4', time: 'Kemarin', type: 'HR', message: 'Pencatatan kehadiran bulanan berhasil diproses untuk payroll', severity: 'info' },
          ]
        });
      } catch (e) {
        console.error('Error fetching dashboard metrics', e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-xl"></div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Pendapatan',
      value: `Rp ${(metrics?.totalRevenue || 0).toLocaleString('id-ID')}`,
      desc: '+12.5% dibanding bulan lalu',
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      trend: 'up'
    },
    {
      title: 'Pesanan Penjualan',
      value: metrics?.totalOrders || 0,
      desc: '32 transaksi aktif hari ini',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      trend: 'up'
    },
    {
      title: 'Karyawan Aktif',
      value: `${metrics?.activeUsers || 0} Orang`,
      desc: '100% kehadiran hari ini',
      icon: Users,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      trend: 'neutral'
    },
    {
      title: 'Alert Stok Rendah',
      value: `${metrics?.lowStockItems || 0} Barang`,
      desc: 'Butuh reorder segera',
      icon: Package,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      trend: 'down'
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{kpi.title}</span>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <div className="flex items-center gap-1">
                {kpi.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />}
                {kpi.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                <span className={`text-[11px] font-medium ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                  {kpi.desc}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-xl text-white ${kpi.color} bg-opacity-95 shadow-sm`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart (SVG-based for complete compatibility & zero loading delay) */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Tren Arus Kas (Semester 1)</h3>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span>
                  <span className="text-gray-600">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></span>
                  <span className="text-gray-600">Pengeluaran</span>
                </div>
              </div>
            </div>
            
            {/* Beautiful SVG Chart */}
            <div className="relative h-56 w-full pt-4">
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-gray-400 pb-8 select-none">
                <div className="border-b border-gray-100 w-full pb-1">Rp 80jt</div>
                <div className="border-b border-gray-100 w-full pb-1">Rp 60jt</div>
                <div className="border-b border-gray-100 w-full pb-1">Rp 40jt</div>
                <div className="border-b border-gray-100 w-full pb-1">Rp 20jt</div>
                <div className="w-full pb-1">Rp 0</div>
              </div>

              {/* Chart bars & lines */}
              <div className="absolute inset-x-12 bottom-8 top-2 flex items-end justify-between h-40">
                {metrics?.cashflow.map((item, idx) => {
                  const maxVal = 80000000;
                  const incHeight = (item.income / maxVal) * 100;
                  const expHeight = (item.expense / maxVal) * 100;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end flex-1 max-w-[50px]">
                      <div className="flex items-end gap-1.5 h-full w-full justify-center">
                        {/* Income Bar */}
                        <div 
                          style={{ height: `${incHeight}%` }} 
                          className="w-3 bg-blue-500 hover:bg-blue-600 transition-all rounded-t-sm shadow-sm relative group cursor-pointer"
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-[9px] py-1 px-1.5 rounded shadow-lg whitespace-nowrap z-20">
                            Rp {(item.income / 1000000).toFixed(1)}jt
                          </div>
                        </div>
                        {/* Expense Bar */}
                        <div 
                          style={{ height: `${expHeight}%` }} 
                          className="w-3 bg-rose-500 hover:bg-rose-600 transition-all rounded-t-sm shadow-sm relative group cursor-pointer"
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-[9px] py-1 px-1.5 rounded shadow-lg whitespace-nowrap z-20">
                            Rp {(item.expense / 1000000).toFixed(1)}jt
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold mt-1 select-none">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Aktivitas Sistem Terbaru</h3>
            <div className="space-y-4">
              {metrics?.recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    act.severity === 'success' ? 'bg-green-500' : act.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-gray-800 font-medium">{act.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{act.type}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{act.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 text-center">
            <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Lihat Seluruh Riwayat Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
