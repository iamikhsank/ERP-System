// src/components/FinanceAnalysis.tsx
import React, { useState } from 'react';

interface FinanceRecord {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string;
  description: string;
  category: string;
  reconciled?: boolean | string;
  bankRef?: string;
}

interface FinanceAnalysisProps {
  records: FinanceRecord[];
}

export default function FinanceAnalysis({ records }: FinanceAnalysisProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'Income' | 'Expense'>('Expense');

  // Filter & Grouping
  const filteredRecords = records.filter(r => r.type === chartType);
  const totalAmount = filteredRecords.reduce((sum, r) => sum + Number(r.amount), 0);

  // Group by Category
  const categoryGroups = filteredRecords.reduce((groups, rec) => {
    const cat = rec.category || 'Lain-lain';
    groups[cat] = (groups[cat] || 0) + Number(rec.amount);
    return groups;
  }, {} as Record<string, number>);

  // Convert to sorted array
  const categoriesData = Object.entries(categoryGroups)
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalAmount > 0 ? (value / totalAmount) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);

  // Color Palette (Premium Slates, Indigos, Emeralds, Rose, Amber)
  const colors: Record<string, string> = {
    // Income Categories
    'Sales': 'stroke-indigo-600 fill-indigo-600 bg-indigo-600',
    'Services': 'stroke-emerald-600 fill-emerald-600 bg-emerald-600',
    'Investment': 'stroke-blue-600 fill-blue-600 bg-blue-600',
    'Others': 'stroke-slate-500 fill-slate-500 bg-slate-500',
    // Expense Categories
    'Office Supplies': 'stroke-amber-500 fill-amber-500 bg-amber-500',
    'Salary': 'stroke-indigo-600 fill-indigo-600 bg-indigo-600',
    'Rent': 'stroke-rose-600 fill-rose-600 bg-rose-600',
    'Marketing': 'stroke-fuchsia-600 fill-fuchsia-600 bg-fuchsia-600',
    'Procurement': 'stroke-sky-600 fill-sky-600 bg-sky-600',
    'Utilities': 'stroke-teal-600 fill-teal-600 bg-teal-600',
  };

  const getColorClass = (name: string, type: 'stroke' | 'fill' | 'bg') => {
    const fallback = type === 'bg' ? 'bg-slate-400' : type === 'fill' ? 'fill-slate-400' : 'stroke-slate-400';
    const classes = colors[name] || '';
    const match = classes.split(' ').find(c => c.startsWith(`${type}-`));
    return match || fallback;
  };

  // SVG Donut Calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  // General P&L stats
  const totalIncome = records.filter(r => r.type === 'Income').reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpense = records.filter(r => r.type === 'Expense').reduce((sum, r) => sum + Number(r.amount), 0);
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {/* Left side: Selector, Summary KPI & Donut Chart */}
      <div className="bg-white p-7 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex flex-col justify-between">
        <div className="space-y-6 w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-display">Bagan Analisis Alokasi</h3>
            
            <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
              <button
                onClick={() => { setChartType('Expense'); setActiveSegment(null); }}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  chartType === 'Expense' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Beban
              </button>
              <button
                onClick={() => { setChartType('Income'); setActiveSegment(null); }}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  chartType === 'Income' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pendapatan
              </button>
            </div>
          </div>

          {/* KPI Mini-stats in analysis */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Margin Laba Bersih</span>
              <p className={`text-base font-bold font-display mt-0.5 ${profitMargin >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total {chartType === 'Income' ? 'Pemasukan' : 'Beban'}</span>
              <p className={`text-base font-bold font-display mt-0.5 ${chartType === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                Rp {totalAmount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* SVG Donut */}
          <div className="relative flex items-center justify-center py-6">
            <svg width="200" height="200" className="transform -rotate-90">
              {/* Gray placeholder for empty data */}
              {categoriesData.length === 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="transparent"
                  className="stroke-slate-100"
                  strokeWidth="18"
                />
              )}
              {categoriesData.map((seg, idx) => {
                const strokeDashOffset = circumference - (seg.percentage / 100) * circumference;
                const strokeDashArray = `${circumference} ${circumference}`;
                const rotation = (accumulatedPercent / 100) * 360;
                accumulatedPercent += seg.percentage;

                const isHovered = activeSegment === seg.name;

                return (
                  <circle
                    key={idx}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    className={`transition-all duration-300 ${getColorClass(seg.name, 'stroke')} cursor-pointer`}
                    strokeWidth={isHovered ? '24' : '18'}
                    strokeDasharray={strokeDashArray}
                    strokeDashoffset={strokeDashOffset}
                    transform={`rotate(${rotation} 100 100)`}
                    onMouseEnter={() => setActiveSegment(seg.name)}
                    onMouseLeave={() => setActiveSegment(null)}
                  />
                );
              })}
            </svg>

            {/* Content inside Donut hole */}
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              {activeSegment ? (
                <>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{activeSegment}</span>
                  <p className="text-sm font-extrabold text-slate-800 font-display mt-0.5">
                    {categoriesData.find(c => c.name === activeSegment)?.percentage.toFixed(1)}%
                  </p>
                </>
              ) : (
                <>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rincian</span>
                  <p className="text-sm font-extrabold text-slate-800 font-display mt-0.5">
                    {categoriesData.length} Kategori
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Detailed Breakdown Cards */}
      <div className="lg:col-span-2 bg-white p-7 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex flex-col justify-between">
        <div className="space-y-6 w-full">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-display">Rincian Kontribusi Alokasi Dana</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">Daftar kontribusi keuangan per kategori struktural diurutkan dari alokasi terbesar.</p>
          </div>

          <div className="space-y-5.5 max-h-[310px] overflow-y-auto pr-1">
            {categoriesData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Belum ada data transaksi dicatat untuk tipe ini.</p>
              </div>
            ) : (
              categoriesData.map((cat, idx) => {
                const isHovered = activeSegment === cat.name;
                return (
                  <div 
                    key={idx} 
                    className={`space-y-1.5 transition-all p-2 rounded-xl border ${
                      isHovered ? 'bg-slate-50 border-slate-300 scale-[1.01]' : 'border-transparent'
                    }`}
                    onMouseEnter={() => setActiveSegment(cat.name)}
                    onMouseLeave={() => setActiveSegment(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-md shrink-0 ${getColorClass(cat.name, 'bg')}`}></span>
                        <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-800 font-display">Rp {cat.value.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-2">({cat.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>

                    {/* Premium Custom Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${getColorClass(cat.name, 'bg')}`}
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
