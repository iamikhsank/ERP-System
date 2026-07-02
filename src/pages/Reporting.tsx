// src/pages/Reporting.tsx
import React, { useState } from 'react';
import { FileText, Download, Printer, Filter, Calendar, Award, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function ReportingPage() {
  const [module, setModule] = useState('All');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const handleExport = (format: 'PDF' | 'Excel') => {
    setIsExporting(true);
    setExportSuccess(null);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(`Berhasil mengekspor Laporan (${module}) berformat ${format} dari rentang tanggal ${startDate} hingga ${endDate}.`);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pilih Modul</label>
            <div className="relative">
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
              >
                <option value="All">Semua Modul (Konsolidasi)</option>
                <option value="Inventory">Manajemen Inventory</option>
                <option value="Finance">Laporan Keuangan</option>
                <option value="HR">Sumber Daya Manusia (HR)</option>
                <option value="Procurement">Alur Pengadaan (Procurement)</option>
                <option value="Sales">Pesanan Penjualan (Sales)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Selesai</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>
        </div>
        <div className="flex items-end gap-3 self-end lg:self-auto pt-4 lg:pt-0">
          <button
            onClick={() => handleExport('PDF')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer bg-white disabled:opacity-50 uppercase tracking-wider"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>
          <button
            onClick={() => handleExport('Excel')}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Pratinjau Laporan ({module})</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 border border-slate-150 px-2 py-0.5 rounded-lg">{startDate} s.d. {endDate}</span>
        </div>
        
        <div className="p-12 text-center space-y-5 max-w-lg mx-auto py-20">
          {isExporting ? (
            <div className="space-y-4 py-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Menghasilkan berkas laporan ekspor...</p>
            </div>
          ) : exportSuccess ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Proses Ekspor Berhasil!</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {exportSuccess}
                </p>
              </div>
              <button 
                onClick={() => setExportSuccess(null)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest cursor-pointer"
              >
                Kembali ke Pratinjau
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-slate-50 text-slate-400 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">Siap Cetak atau Unduh Laporan</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Dokumen rekapitulasi data dari database spreadsheet Google Sheets telah dikonsolidasi dengan benar. Klik opsi di kanan atas untuk mencetak atau mengunduh lembar laporan penuh.
                </p>
              </div>
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4 text-indigo-500" />
                  Sistem Database Siap Pakai
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
