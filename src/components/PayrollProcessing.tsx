// src/components/PayrollProcessing.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { RefreshCw, Calculator, Printer, Check, DollarSign, Users, Award, AlertTriangle, ChevronDown } from 'lucide-react';

interface Employee {
  id: string;
  employeeName: string;
  position: string;
  department: string;
  status: 'Active' | 'Inactive';
  email: string;
  salary: number;
}

interface PayrollItem {
  id: string;
  employeeName: string;
  month: string;
  basicSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  status: 'Draft' | 'Paid';
  createdAt: string;
}

interface PayrollProps {
  employees: Employee[];
}

export default function PayrollProcessing({ employees }: PayrollProps) {
  const cached = getGasCache('HR', 'getPayrolls');
  const [payrolls, setPayrolls] = useState<PayrollItem[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollItem | null>(null);

  // New Payroll Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [month, setMonth] = useState('Juli 2026');
  const [basicSalary, setBasicSalary] = useState(0);
  const [allowance, setAllowance] = useState(0); // Tunjangan Jabatan
  const [deduction, setDeduction] = useState(0); // Potongan Kehadiran

  const fetchPayrolls = async (active = true) => {
    if (!cached && active) setLoading(true);
    try {
      const res = await callGas('HR', 'getPayrolls');
      if (active) setPayrolls(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchPayrolls(active);
    return () => {
      active = false;
    };
  }, []);

  // When selected employee changes, auto populate basic salary
  useEffect(() => {
    const found = employees.find(e => e.id === selectedEmployeeId);
    if (found) {
      setBasicSalary(Number(found.salary || 0));
    } else {
      setBasicSalary(0);
    }
  }, [selectedEmployeeId, employees]);

  const handleCreatePayrollClick = () => {
    setSelectedEmployeeId(employees[0]?.id || '');
    setMonth('Juli 2026');
    setAllowance(500000); // Default allowance
    setDeduction(0);
    setIsModalOpen(true);
  };

  const handlePay = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin membayar gaji ini? Status slip gaji akan diubah menjadi PAID dan pengeluaran kas riil otomatis dicatat di pembukuan Buku Besar Keuangan.')) {
      try {
        await callGas('HR', 'payPayroll', { id });
        fetchPayrolls();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePrintSlip = (item: PayrollItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayroll(item);
    setIsPrintModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(emp => emp.id === selectedEmployeeId);
    if (!emp) return;

    try {
      await callGas('HR', 'createPayroll', {
        employeeName: emp.employeeName,
        month,
        basicSalary,
        allowance,
        deduction
      });
      setIsModalOpen(false);
      fetchPayrolls();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { 
      header: 'Karyawan', 
      accessor: (row: PayrollItem) => (
        <div className="py-1">
          <p className="font-bold text-slate-800">{row.employeeName}</p>
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{row.month}</p>
        </div>
      ), 
      sortKey: 'employeeName' as keyof PayrollItem 
    },
    { 
      header: 'Gaji Pokok', 
      accessor: (row: PayrollItem) => (
        <span className="font-semibold text-slate-600 font-display text-xs">
          Rp {Number(row.basicSalary || 0).toLocaleString('id-ID')}
        </span>
      ), 
      sortKey: 'basicSalary' as keyof PayrollItem 
    },
    { 
      header: 'Tunjangan', 
      accessor: (row: PayrollItem) => (
        <span className="font-semibold text-emerald-600 font-display text-xs">
          +Rp {Number(row.allowance || 0).toLocaleString('id-ID')}
        </span>
      ), 
      sortKey: 'allowance' as keyof PayrollItem 
    },
    { 
      header: 'Potongan', 
      accessor: (row: PayrollItem) => (
        <span className="font-semibold text-rose-600 font-display text-xs">
          -Rp {Number(row.deduction || 0).toLocaleString('id-ID')}
        </span>
      ), 
      sortKey: 'deduction' as keyof PayrollItem 
    },
    { 
      header: 'Gaji Bersih (Net)', 
      accessor: (row: PayrollItem) => (
        <span className="font-extrabold text-slate-800 font-display text-xs">
          Rp {Number(row.netSalary || 0).toLocaleString('id-ID')}
        </span>
      ), 
      sortKey: 'netSalary' as keyof PayrollItem 
    },
    { 
      header: 'Status', 
      accessor: (row: PayrollItem) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
          row.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
        }`}>
          {row.status === 'Paid' ? 'LUNAS (PAID)' : 'DRAFT'}
        </span>
      ), 
      sortKey: 'status' as keyof PayrollItem 
    },
    { 
      header: 'Aksi', 
      accessor: (row: PayrollItem) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => handlePrintSlip(row, e)}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
            title="Cetak Slip Gaji"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            SLIP
          </button>
          {row.status === 'Draft' && (
            <button 
              onClick={(e) => handlePay(row.id, e)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider shadow-xs hover:shadow-md"
              title="Bayar Gaji"
            >
              <Check className="w-3.5 h-3.5 text-white" />
              BAYAR
            </button>
          )}
        </div>
      )
    }
  ];

  // Stats calculate
  const totalPaid = payrolls.filter(p => p.status === 'Paid').reduce((sum, p) => sum + Number(p.netSalary || 0), 0);
  const pendingPay = payrolls.filter(p => p.status === 'Draft').reduce((sum, p) => sum + Number(p.netSalary || 0), 0);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Payroll Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Gaji Dibayarkan (Paid)</span>
            <p className="text-xl font-bold text-emerald-600 font-display">
              Rp {totalPaid.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gaji Tertunda (Draft Payroll)</span>
            <p className="text-xl font-bold text-amber-600 font-display">
              Rp {pendingPay.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex items-center justify-center">
            <Calculator className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-200/80 rounded-2xl w-1/4"></div>
            <div className="h-72 bg-slate-200/80 rounded-2xl"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={payrolls}
            searchKey="employeeName"
            searchPlaceholder="Cari nama staf di slip gaji..."
            onAddClick={handleCreatePayrollClick}
            addLabel="Proses Gaji (Payroll)"
          />
        )}
      </div>

      {/* Modal create payroll calculation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kalkulator Proses Gaji Bulanan"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pilih Karyawan Staf</label>
            <div className="relative">
              <select
                required
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeName} ({emp.position} - Rp {Number(emp.salary || 0).toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bulan Periode</label>
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
                >
                  <option value="Januari 2026">Januari 2026</option>
                  <option value="Februari 2026">Februari 2026</option>
                  <option value="Maret 2026">Maret 2026</option>
                  <option value="April 2026">April 2026</option>
                  <option value="Mei 2026">Mei 2026</option>
                  <option value="Juni 2026">Juni 2026</option>
                  <option value="Juli 2026">Juli 2026</option>
                  <option value="Agustus 2026">Agustus 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="Oktober 2026">Oktober 2026</option>
                  <option value="November 2026">November 2026</option>
                  <option value="Desember 2026">Desember 2026</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Gaji Pokok Sistem (IDR)</label>
              <div className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-bold">
                Rp {basicSalary.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tunjangan Jabatan / Bonus (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={allowance}
                onChange={(e) => setAllowance(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Potongan Absensi / Denda (IDR)</label>
              <input
                type="number"
                min="0"
                required
                value={deduction}
                onChange={(e) => setDeduction(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          {/* Payroll net calculation preview */}
          <div className="p-4 rounded-xl border flex items-center justify-between text-xs font-semibold bg-indigo-50/50 border-indigo-100">
            <span className="text-indigo-800 font-bold">Perhitungan Total Gaji Bersih (Net):</span>
            <span className="text-indigo-950 font-black text-sm">
              Rp {(basicSalary + allowance - deduction).toLocaleString('id-ID')}
            </span>
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider"
            >
              Simpan Slip
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Modal Pay Slip View */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Pratinjau Slip Gaji Karyawan"
      >
        {selectedPayroll && (
          <div className="space-y-6">
            <div id="print-area" className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5 font-mono text-[11px] text-slate-800">
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">SLIP GAJI BULANAN</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">SISTEM ERP ENTERPRISE INTEGRATED</p>
                <p className="text-[9px] text-slate-400 mt-1">Periode: {selectedPayroll.month}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-dashed border-slate-300">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">NAMA KARYAWAN</span>
                  <span className="font-bold text-slate-900">{selectedPayroll.employeeName}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">SLIP ID / TANGGAL</span>
                  <span className="font-bold text-slate-700">{selectedPayroll.id.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Gaji Pokok Bulanan:</span>
                  <span className="font-bold text-slate-800">Rp {Number(selectedPayroll.basicSalary).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Tunjangan Jabatan / Bonus:</span>
                  <span className="font-bold text-emerald-600">+Rp {Number(selectedPayroll.allowance).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Potongan Absensi / Denda:</span>
                  <span className="font-bold text-rose-600">-Rp {Number(selectedPayroll.deduction).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex justify-between bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-black">
                <span className="text-slate-900 uppercase tracking-wider">GAJI BERSIH (NET TO PAY):</span>
                <span className="text-slate-950">Rp {Number(selectedPayroll.netSalary).toLocaleString('id-ID')}</span>
              </div>

              <div className="pt-4 flex justify-between text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                <div>
                  <p className="mb-8">PENERIMA,</p>
                  <p className="text-slate-700 border-t border-dashed border-slate-300 pt-1 px-4">{selectedPayroll.employeeName}</p>
                </div>
                <div>
                  <p className="mb-8">FINANCE DEPT,</p>
                  <p className="text-slate-700 border-t border-dashed border-slate-300 pt-1 px-4">SISTEM ERP</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-bold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer uppercase tracking-wider"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer uppercase tracking-wider flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Cetak Slip
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
