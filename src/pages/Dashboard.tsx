// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
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
  // Check if cache has data to prevent full-page blank loading screen
  const cached = getGasCache('Dashboard', 'getMetrics');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(cached || null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        const res = await callGas('Dashboard', 'getMetrics');
        if (!active) return;

        // Standardize structure
        setMetrics({
          totalRevenue: res && res.totalRevenue !== undefined ? res.totalRevenue : 0,
          totalOrders: res && res.totalOrders !== undefined ? res.totalOrders : 0,
          activeUsers: res && res.activeUsers !== undefined ? res.activeUsers : 0,
          lowStockItems: res && res.lowStockItems !== undefined ? res.lowStockItems : 0,
          cashflow: res && res.cashflow ? res.cashflow : [],
          recentActivities: res && res.recentActivities ? res.recentActivities : []
        });
      } catch (e) {
        console.error('Error fetching dashboard metrics', e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      // Clean up / Abort pending state update immediately on unmount
      active = false;
    };
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
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      trendColor: 'text-emerald-600 bg-emerald-50',
      trend: 'up'
    },
    {
      title: 'Pesanan Penjualan',
      value: `${(metrics?.totalOrders || 0).toLocaleString('id-ID')} SO`,
      desc: '32 transaksi aktif hari ini',
      icon: ShoppingCart,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      trendColor: 'text-blue-600 bg-blue-50',
      trend: 'up'
    },
    {
      title: 'Karyawan Aktif',
      value: `${metrics?.activeUsers || 0} Orang`,
      desc: '100% kehadiran hari ini',
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      trendColor: 'text-slate-500 bg-slate-100/80',
      trend: 'neutral'
    },
    {
      title: 'Alert Stok Rendah',
      value: `${metrics?.lowStockItems || 0} Barang`,
      desc: 'Butuh reorder segera',
      icon: Package,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      trendColor: 'text-amber-600 bg-amber-50',
      trend: 'down'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{kpi.title}</span>
              <p className="text-2xl font-bold tracking-tight text-slate-900 font-display">{kpi.value}</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${kpi.trendColor}`}>
                  {kpi.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                  {kpi.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend === 'up' ? 'UP' : kpi.trend === 'down' ? 'LOW' : 'STABLE'}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {kpi.desc}
                </span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs ${kpi.iconBg}`}>
              <kpi.icon className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart (SVG-based for complete compatibility & zero loading delay) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">Tren Arus Kas (Semester 1)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Laporan visual dinamika kas masuk dan keluar operasional</p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm shadow-xs"></span>
                  <span className="text-slate-600">Pemasukan</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm shadow-xs"></span>
                  <span className="text-slate-600">Pengeluaran</span>
                </div>
              </div>
            </div>
            
            {/* Beautiful SVG Chart */}
            <div className="relative h-64 w-full pt-4">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 pb-10 select-none">
                <div className="border-b border-slate-100/80 w-full pb-1 flex justify-between"><span>Rp 80jt</span></div>
                <div className="border-b border-slate-100/80 w-full pb-1 flex justify-between"><span>Rp 60jt</span></div>
                <div className="border-b border-slate-100/80 w-full pb-1 flex justify-between"><span>Rp 40jt</span></div>
                <div className="border-b border-slate-100/80 w-full pb-1 flex justify-between"><span>Rp 20jt</span></div>
                <div className="w-full pb-1">Rp 0</div>
              </div>

              {/* Chart bars & lines */}
              <div className="absolute inset-x-12 bottom-10 top-2 flex items-end justify-between h-48">
                {metrics?.cashflow.map((item, idx) => {
                  const maxVal = 80000000;
                  const incHeight = (item.income / maxVal) * 100;
                  const expHeight = (item.expense / maxVal) * 100;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end flex-1 max-w-[60px]">
                      <div className="flex items-end gap-2 h-full w-full justify-center">
                        {/* Income Bar */}
                        <div 
                          style={{ height: `${incHeight}%` }} 
                          className="w-3.5 bg-indigo-600 hover:bg-indigo-700 transition-all rounded-t-md shadow-sm relative group cursor-pointer"
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded-lg shadow-md whitespace-nowrap z-20">
                            Rp {(item.income / 1000000).toFixed(1)}jt
                          </div>
                        </div>
                        {/* Expense Bar */}
                        <div 
                          style={{ height: `${expHeight}%` }} 
                          className="w-3.5 bg-rose-500 hover:bg-rose-600 transition-all rounded-t-md shadow-sm relative group cursor-pointer"
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded-lg shadow-md whitespace-nowrap z-20">
                            Rp {(item.expense / 1000000).toFixed(1)}jt
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold mt-2 select-none">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display mb-6">Aktivitas Sistem Terbaru</h3>
            <div className="space-y-5">
              {metrics?.recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs leading-relaxed items-start">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 border-2 border-white shadow-xs ${
                    act.severity === 'success' ? 'bg-emerald-500' : act.severity === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                  }`} />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-700 font-semibold">{act.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded-md">{act.type}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{act.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-5 border-t border-slate-100 text-center">
            <button className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all cursor-pointer">
              Lihat Seluruh Riwayat Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
