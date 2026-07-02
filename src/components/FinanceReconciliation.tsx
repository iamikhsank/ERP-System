// src/components/FinanceReconciliation.tsx
import React, { useState } from 'react';
import { callGas } from '../api/gasClient';
import { CheckCircle2, AlertTriangle, RefreshCw, PlusCircle, ArrowUpRight, ArrowDownLeft, ShieldCheck, Zap } from 'lucide-react';

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

interface BankStatement {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CR' | 'DB'; // CR: Credit (Income), DB: Debit (Expense)
  refNo: string;
  reconciled: boolean;
}

interface FinanceReconciliationProps {
  records: FinanceRecord[];
  onRefresh: () => Promise<void>;
}

export default function FinanceReconciliation({ records, onRefresh }: FinanceReconciliationProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Selection states for manual reconciliation
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  // Mock static bank statements that represent real bank transactions
  // This helps demonstrate a real bank integration matching our actual default/user data
  const [bankStatements, setBankStatements] = useState<BankStatement[]>([
    { id: 'bst1', date: '2026-07-02', description: 'MUTASI MASUK PENJUALAN PRODUK', amount: 15000000, type: 'CR', refNo: 'TXN-94827', reconciled: false },
    { id: 'bst2', date: '2026-07-01', description: 'BIAYA SEWA TEMPAT OPERASIONAL', amount: 3500000, type: 'DB', refNo: 'TXN-82736', reconciled: false },
    { id: 'bst3', date: '2026-06-30', description: 'PEMBELIAN ALAT TULIS KANTOR', amount: 250000, type: 'DB', refNo: 'TXN-71829', reconciled: false },
    { id: 'bst4', date: '2026-06-29', description: 'MUTASI KELUAR GAJI KARYAWAN', amount: 4500000, type: 'DB', refNo: 'TXN-65432', reconciled: false },
    { id: 'bst5', date: '2026-06-28', description: 'BIAYA ADMINISTRASI BULANAN BANK', amount: 25000, type: 'DB', refNo: 'TXN-12093', reconciled: false }, // Belum tercatat di buku besar
    { id: 'bst6', date: '2026-06-27', description: 'MUTASI MASUK JASA KONSULTASI', amount: 4800000, type: 'CR', refNo: 'TXN-33445', reconciled: false }
  ]);

  // Sync internal bankStatement reconciliation statuses with existing reconciled ledger records
  const reconciledRefs = records
    .filter(r => r.reconciled === 'Ya' || r.reconciled === true)
    .map(r => r.bankRef);

  const updatedBankStatements = bankStatements.map(stmt => ({
    ...stmt,
    reconciled: reconciledRefs.includes(stmt.refNo)
  }));

  // Filter unresolved items
  const unresolvedLedger = records.filter(r => r.reconciled !== 'Ya' && r.reconciled !== true);
  const unresolvedBank = updatedBankStatements.filter(b => !b.reconciled);

  // Totals
  const totalLedgerBalance = records
    .map(r => (r.type === 'Income' ? 1 : -1) * Number(r.amount))
    .reduce((sum, val) => sum + val, 0);

  // Bank balance starts at 20,000,000 + CR items - DB items
  const initialBankBalance = 15000000;
  const currentBankBalance = initialBankBalance + updatedBankStatements
    .map(b => (b.type === 'CR' ? 1 : -1) * b.amount)
    .reduce((sum, val) => sum + val, 0);

  const outOfSyncDiff = Math.abs(totalLedgerBalance - currentBankBalance);

  // Auto Reconciliation Action
  const handleAutoReconcile = async () => {
    setLoading(true);
    setSuccessMsg(null);
    let matchedCount = 0;

    try {
      // Loop through all unresolved ledger records to find matches in unresolved bank statements
      for (const rec of unresolvedLedger) {
        const amount = Number(rec.amount);
        const recType = rec.type === 'Income' ? 'CR' : 'DB';

        // Find bank statement with the exact same amount and type, and haven't reconciled yet
        const match = unresolvedBank.find(stmt => 
          stmt.amount === amount && 
          stmt.type === recType && 
          !reconciledRefs.includes(stmt.refNo)
        );

        if (match) {
          // Perform the actual update on Google Sheets via GAS!
          await callGas('Finance', 'update', {
            ...rec,
            reconciled: 'Ya',
            bankRef: match.refNo
          });
          matchedCount++;
        }
      }

      await onRefresh();
      if (matchedCount > 0) {
        setSuccessMsg(`Berhasil mencocokkan ${matchedCount} transaksi secara otomatis!`);
      } else {
        setSuccessMsg('Pindai selesai. Tidak ada transaksi baru yang cocok secara otomatis.');
      }
    } catch (e) {
      console.error(e);
      setSuccessMsg('Terjadi kesalahan saat melakukan rekonsiliasi otomatis.');
    } finally {
      setLoading(false);
      // Deselect
      setSelectedLedgerId(null);
      setSelectedBankId(null);
    }
  };

  // Manual Reconciliation Action
  const handleManualReconcile = async () => {
    if (!selectedLedgerId || !selectedBankId) return;
    setLoading(true);
    setSuccessMsg(null);

    const ledgerRec = unresolvedLedger.find(r => r.id === selectedLedgerId);
    const bankStmt = unresolvedBank.find(b => b.id === selectedBankId);

    if (!ledgerRec || !bankStmt) return;

    try {
      // Save permanently to Google Sheets!
      await callGas('Finance', 'update', {
        ...ledgerRec,
        reconciled: 'Ya',
        bankRef: bankStmt.refNo
      });

      await onRefresh();
      setSuccessMsg(`Transaksi berhasil dicocokkan secara manual dengan referensi ${bankStmt.refNo}`);
    } catch (e) {
      console.error(e);
      setSuccessMsg('Gagal melakukan rekonsiliasi manual.');
    } finally {
      setLoading(false);
      setSelectedLedgerId(null);
      setSelectedBankId(null);
    }
  };

  // Record direct bank mismatch (e.g., bank fee that isn't logged in our ledger)
  const handleQuickLogTransaction = async (stmt: BankStatement) => {
    setLoading(true);
    setSuccessMsg(null);

    const isIncome = stmt.type === 'CR';
    const payload = {
      type: isIncome ? 'Income' : 'Expense',
      amount: stmt.amount,
      date: stmt.date,
      description: stmt.description,
      category: isIncome ? 'Others' : 'Utilities',
      reconciled: 'Ya',
      bankRef: stmt.refNo
    };

    try {
      // Create new transaction and auto reconcile it
      await callGas('Finance', 'create', payload);
      await onRefresh();
      setSuccessMsg(`Berhasil mencatat transaksi baru "${stmt.description}" ke Buku Besar dan langsung direkonsiliasi.`);
    } catch (e) {
      console.error(e);
      setSuccessMsg('Gagal mencatat transaksi baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Reconciliation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saldo Buku Besar</span>
            <p className="text-xl font-bold text-indigo-600 font-display">Rp {totalLedgerBalance.toLocaleString('id-ID')}</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saldo Rekening Bank</span>
            <p className="text-xl font-bold text-slate-900 font-display">Rp {currentBankBalance.toLocaleString('id-ID')}</p>
          </div>
          <div className="w-11 h-11 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selisih Belum Rekonsiliasi</span>
            <p className={`text-xl font-bold font-display ${outOfSyncDiff === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              Rp {outOfSyncDiff.toLocaleString('id-ID')}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${outOfSyncDiff === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            {outOfSyncDiff === 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
          </div>
        </div>
      </div>

      {/* Control Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">Asisten Pencocokan Transaksi</h4>
            <p className="text-[11px] text-slate-400 font-bold">Gunakan asisten otomatis untuk menyamakan catatan kas internal dengan mutasi rekening bank secara real-time.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {selectedLedgerId && selectedBankId && (
            <button
              onClick={handleManualReconcile}
              disabled={loading}
              className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(79,70,229,0.15)]"
            >
              Cocokkan Manual
            </button>
          )}

          <button
            onClick={handleAutoReconcile}
            disabled={loading || unresolvedLedger.length === 0}
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Rekonsiliasi Otomatis
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Reconciliation Workspace: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Internal General Ledger */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-display">Catatan Kas Buku Besar</h3>
              <p className="text-[10px] text-slate-400 font-bold">{unresolvedLedger.length} Transaksi belum direkonsiliasi</p>
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold">INTERNAL</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {unresolvedLedger.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Seluruh Buku Kas Telah Klop!</p>
              </div>
            ) : (
              unresolvedLedger.map((rec) => {
                const isSelected = selectedLedgerId === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedLedgerId(isSelected ? null : rec.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">{rec.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{rec.category}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {new Date(rec.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold font-display ${rec.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {rec.type === 'Income' ? '+' : '-'} Rp {Number(rec.amount).toLocaleString('id-ID')}
                      </span>
                      {rec.type === 'Income' ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownLeft className="w-4 h-4 text-rose-500" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Bank Statements (Mutasi Bank) */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-display">Laporan Rekening Koran Bank</h3>
              <p className="text-[10px] text-slate-400 font-bold">{unresolvedBank.length} Baris mutasi belum disinkronkan</p>
            </div>
            <span className="text-[10px] bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-bold">EKSTERNAL BANK</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {unresolvedBank.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mutasi Bank Sinkron Sempurna!</p>
              </div>
            ) : (
              unresolvedBank.map((stmt) => {
                const isSelected = selectedBankId === stmt.id;
                // Check if we have an internal record matching this exact amount to guide the user
                const hasPotentialMatch = unresolvedLedger.some(r => 
                  Number(r.amount) === stmt.amount && 
                  ((r.type === 'Income' && stmt.type === 'CR') || (r.type === 'Expense' && stmt.type === 'DB'))
                );

                return (
                  <div
                    key={stmt.id}
                    onClick={() => setSelectedBankId(isSelected ? null : stmt.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? 'bg-indigo-50/50 border-r-4 border-indigo-600' : 'hover:bg-slate-50 border-r-4 border-transparent'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">{stmt.description}</p>
                        {hasPotentialMatch && (
                          <span className="text-[8px] font-black bg-indigo-50 text-indigo-700 border border-indigo-150 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Match Tersedia</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-extrabold text-slate-400">{stmt.refNo}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {new Date(stmt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`text-xs font-bold font-display ${stmt.type === 'CR' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {stmt.type === 'CR' ? '+' : '-'} Rp {stmt.amount.toLocaleString('id-ID')}
                        </span>
                        <p className="text-[9px] text-slate-400 font-semibold">{stmt.type === 'CR' ? 'CREDIT' : 'DEBIT'}</p>
                      </div>

                      {/* If there's no match, let user log the bank fee/interest instantly */}
                      {!hasPotentialMatch ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickLogTransaction(stmt);
                          }}
                          disabled={loading}
                          className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
                          title="Catat Baru ke Buku Besar"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="w-7"></div>
                      )}
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
