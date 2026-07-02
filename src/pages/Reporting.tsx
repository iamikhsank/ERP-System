// src/pages/Reporting.tsx
import React, { useState } from 'react';
import { FileText, Download, Printer, Filter, Calendar, Award } from 'lucide-react';

export default function ReportingPage() {
  const [module, setModule] = useState('All');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (format: 'PDF' | 'Excel') => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Berhasil mengekspor Laporan (${module}) berformat ${format} dari rentang tanggal ${startDate} hingga ${endDate}.`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Pilih Modul</label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="All">Semua Modul (Konsolidasi)</option>
              <option value="Inventory">Manajemen Inventory</option>
              <option value="Finance">Laporan Keuangan</option>
              <option value="HR">Sumber Daya Manusia (HR)</option>
              <option value="Procurement">Alur Pengadaan (Procurement)</option>
              <option value="Sales">Pesanan Penjualan (Sales)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tanggal Selesai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="flex items-end gap-2 self-end md:self-auto pt-4 md:pt-0">
          <button
            onClick={() => handleExport('PDF')}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-lg transition-colors bg-white disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>
          <button
            onClick={() => handleExport('Excel')}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Pratinjau Laporan ({module})</h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">{startDate} s.d. {endDate}</span>
        </div>
        
        <div className="p-8 text-center space-y-4 max-w-lg mx-auto py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900">Siap Cetak atau Unduh Laporan</h4>
            <p className="text-xs text-gray-500">
              Dokumen rekapitulasi data dari database spreadsheet Google Sheets telah dikonsolidasi dengan benar. Klik opsi di kanan atas untuk mencetak atau mengunduh lembar laporan penuh.
            </p>
          </div>
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-bold">
              <Award className="w-4 h-4" />
              Sistem Database Siap Pakai
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
