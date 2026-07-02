// src/components/DataTable.tsx
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, Package } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortKey?: keyof T;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  onAddClick?: () => void;
  addLabel?: string;
  onRowClick?: (row: T) => void;
  canAdd?: boolean;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data = [],
  searchPlaceholder = "Cari data...",
  searchKey,
  onAddClick,
  addLabel = "Tambah Baru",
  onRowClick,
  canAdd = true
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Handle Sort
  const requestSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter & Sort & Paginate data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm && searchKey) {
      result = result.filter(row => {
        const val = row[searchKey];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, searchKey, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
        {searchKey ? (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2.5 w-full text-xs border border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-medium placeholder-slate-400"
            />
          </div>
        ) : <div className="flex-1"></div>}

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {canAdd && onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Actual Table */}
      <div className="flex-1 overflow-auto min-h-[300px]">
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50/70 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortKey && requestSort(col.sortKey)}
                  className={`px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-150 ${
                    col.sortKey ? 'cursor-pointer hover:bg-slate-100/50 select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortKey && sortConfig?.key === col.sortKey && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-500" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-all duration-150 ${onRowClick ? 'cursor-pointer hover:bg-slate-50/60' : ''}`}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className="px-6 py-4.5 text-slate-600 font-medium">
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-slate-400 font-semibold">
                  <Package className="w-10 h-10 text-slate-200 mx-auto mb-3 stroke-[1.5]" />
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-white text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none border border-slate-300 rounded-lg px-3 py-1.5 pr-8 bg-slate-50/40 hover:bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-colors font-bold text-slate-700 cursor-pointer"
              >
                {[5, 10, 25, 50].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span>baris</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">Halaman {currentPage} dari {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
