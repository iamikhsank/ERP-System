// src/components/AttendanceAndLeave.tsx
import React, { useState, useEffect } from 'react';
import { callGas, getGasCache } from '../api/gasClient';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { LogIn, Calendar, FileText, Check, X, ClipboardList, PlusCircle, Clock, ChevronDown } from 'lucide-react';

interface Employee {
  id: string;
  employeeName: string;
  position: string;
}

interface AttendanceItem {
  id: string;
  employeeName: string;
  date: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Cuti' | 'Alpa';
  checkIn: string;
  checkOut: string;
  notes: string;
  createdAt: string;
}

interface LeaveRequestItem {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

interface AttendanceAndLeaveProps {
  employees: Employee[];
}

export default function AttendanceAndLeave({ employees }: AttendanceAndLeaveProps) {
  const cachedAttendance = getGasCache('HR', 'getAttendance');
  const cachedLeaves = getGasCache('HR', 'getLeaves');

  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'leaves'>('attendance');
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>(cachedAttendance || []);
  const [leaveList, setLeaveList] = useState<LeaveRequestItem[]>(cachedLeaves || []);
  const [loading, setLoading] = useState(!cachedAttendance || !cachedLeaves);

  // Modals state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Attendance Form states
  const [attEmployee, setAttEmployee] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState<'Hadir' | 'Sakit' | 'Izin' | 'Cuti' | 'Alpa'>('Hadir');
  const [checkIn, setCheckIn] = useState('08:00');
  const [checkOut, setCheckOut] = useState('17:00');
  const [attNotes, setAttNotes] = useState('');

  // Leave Form states
  const [leaveEmployee, setLeaveEmployee] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');

  const fetchData = async (active = true) => {
    if ((!cachedAttendance || !cachedLeaves) && active) setLoading(true);
    try {
      const [attRes, leaveRes] = await Promise.all([
        callGas('HR', 'getAttendance'),
        callGas('HR', 'getLeaves')
      ]);
      if (active) {
        setAttendanceList(attRes || []);
        setLeaveList(leaveRes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchData(active);
    return () => {
      active = false;
    };
  }, []);

  const handleAddAttendanceClick = () => {
    setAttEmployee(employees[0]?.employeeName || '');
    setAttDate(new Date().toISOString().split('T')[0]);
    setAttStatus('Hadir');
    setCheckIn('08:00');
    setCheckOut('17:00');
    setAttNotes('');
    setIsAttendanceModalOpen(true);
  };

  const handleAddLeaveClick = () => {
    setLeaveEmployee(employees[0]?.employeeName || '');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setLeaveReason('');
    setIsLeaveModalOpen(true);
  };

  const handleApproveLeave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Setujui permohonan cuti ini?')) {
      try {
        await callGas('HR', 'approveLeave', { id });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRejectLeave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tolak permohonan cuti ini?')) {
      try {
        await callGas('HR', 'rejectLeave', { id });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await callGas('HR', 'createAttendance', {
        employeeName: attEmployee,
        date: attDate,
        status: attStatus,
        checkIn: attStatus === 'Hadir' ? checkIn : '',
        checkOut: attStatus === 'Hadir' ? checkOut : '',
        notes: attNotes
      });
      setIsAttendanceModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await callGas('HR', 'createLeave', {
        employeeName: leaveEmployee,
        startDate,
        endDate,
        reason: leaveReason
      });
      setIsLeaveModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const attendanceColumns = [
    { 
      header: 'Nama Karyawan', 
      accessor: (row: AttendanceItem) => <span className="font-bold text-slate-800">{row.employeeName}</span>,
      sortKey: 'employeeName' as keyof AttendanceItem
    },
    { 
      header: 'Tanggal', 
      accessor: (row: AttendanceItem) => <span className="font-semibold text-slate-600 font-display text-xs">{row.date}</span>,
      sortKey: 'date' as keyof AttendanceItem
    },
    { 
      header: 'Status', 
      accessor: (row: AttendanceItem) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          row.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
          row.status === 'Sakit' ? 'bg-blue-50 text-blue-700 border-blue-100' :
          row.status === 'Izin' ? 'bg-amber-50 text-amber-700 border-amber-100' :
          row.status === 'Cuti' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          {row.status.toUpperCase()}
        </span>
      ),
      sortKey: 'status' as keyof AttendanceItem
    },
    { 
      header: 'Jam Masuk', 
      accessor: (row: AttendanceItem) => <span className="font-mono text-xs font-semibold">{row.checkIn || '-'}</span>
    },
    { 
      header: 'Jam Pulang', 
      accessor: (row: AttendanceItem) => <span className="font-mono text-xs font-semibold">{row.checkOut || '-'}</span>
    },
    { 
      header: 'Keterangan', 
      accessor: (row: AttendanceItem) => <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{row.notes || '-'}</span>
    }
  ];

  const leaveColumns = [
    { 
      header: 'Karyawan', 
      accessor: (row: LeaveRequestItem) => <span className="font-bold text-slate-800">{row.employeeName}</span>,
      sortKey: 'employeeName' as keyof LeaveRequestItem
    },
    { 
      header: 'Mulai Cuti', 
      accessor: (row: LeaveRequestItem) => <span className="font-semibold text-slate-600 font-display text-xs">{row.startDate}</span>,
      sortKey: 'startDate' as keyof LeaveRequestItem
    },
    { 
      header: 'Selesai Cuti', 
      accessor: (row: LeaveRequestItem) => <span className="font-semibold text-slate-600 font-display text-xs">{row.endDate}</span>,
      sortKey: 'endDate' as keyof LeaveRequestItem
    },
    { 
      header: 'Alasan Cuti', 
      accessor: (row: LeaveRequestItem) => <span className="text-xs text-slate-500 font-medium max-w-[180px] block truncate">{row.reason || '-'}</span>
    },
    { 
      header: 'Status', 
      accessor: (row: LeaveRequestItem) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
          row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          row.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
          {row.status === 'Approved' ? 'DISETUJUI' :
           row.status === 'Rejected' ? 'DITOLAK' : 'PENDING'}
        </span>
      ),
      sortKey: 'status' as keyof LeaveRequestItem
    },
    { 
      header: 'Aksi', 
      accessor: (row: LeaveRequestItem) => {
        if (row.status !== 'Pending') {
          return <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-lg">Selesai</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <button 
              onClick={(e) => handleApproveLeave(row.id, e)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer uppercase tracking-wider"
            >
              Setujui
            </button>
            <button 
              onClick={(e) => handleRejectLeave(row.id, e)}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150/50 rounded-lg text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider"
            >
              Tolak
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Sub tabs inside Attendance/Leave */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LogIn className="w-3.5 h-3.5 text-slate-400" />
          Absensi Harian Karyawan
        </button>
        <button
          onClick={() => setActiveSubTab('leaves')}
          className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'leaves'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Permohonan Cuti (Leave Requests)
        </button>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-200/80 rounded-2xl w-1/4"></div>
            <div className="h-72 bg-slate-200/80 rounded-2xl"></div>
          </div>
        ) : activeSubTab === 'attendance' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick absensi status widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Hadir</span>
                  <p className="text-xl font-bold text-emerald-600 font-display">
                    {attendanceList.filter(a => a.status === 'Hadir').length} Log Absen
                  </p>
                </div>
                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sakit / Izin / Cuti</span>
                  <p className="text-xl font-bold text-indigo-600 font-display">
                    {attendanceList.filter(a => ['Sakit', 'Izin', 'Cuti'].includes(a.status)).length} Orang
                  </p>
                </div>
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mangkir (Alpa)</span>
                  <p className="text-xl font-bold text-rose-600 font-display">
                    {attendanceList.filter(a => a.status === 'Alpa').length} Kasus
                  </p>
                </div>
                <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
            </div>

            <DataTable
              columns={attendanceColumns}
              data={attendanceList}
              searchKey="employeeName"
              searchPlaceholder="Cari nama karyawan absensi..."
              onAddClick={handleAddAttendanceClick}
              addLabel="Catat Absensi"
            />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick leave stats widget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cuti Pending Persetujuan</span>
                  <p className="text-xl font-bold text-amber-600 font-display">
                    {leaveList.filter(l => l.status === 'Pending').length} Pengajuan
                  </p>
                </div>
                <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 stroke-[2]" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Cuti Disetujui</span>
                  <p className="text-xl font-bold text-emerald-600 font-display">
                    {leaveList.filter(l => l.status === 'Approved').length} Disetujui
                  </p>
                </div>
                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
            </div>

            <DataTable
              columns={leaveColumns}
              data={leaveList}
              searchKey="employeeName"
              searchPlaceholder="Cari nama pemohon cuti..."
              onAddClick={handleAddLeaveClick}
              addLabel="Ajukan Cuti"
            />
          </div>
        )}
      </div>

      {/* Modal Catat Attendance */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Form Catat Kehadiran Harian"
      >
        <form onSubmit={handleAttendanceSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pilih Karyawan</label>
            <div className="relative">
              <select
                required
                value={attEmployee}
                onChange={(e) => setAttEmployee(e.target.value)}
                className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.employeeName}>{emp.employeeName} ({emp.position})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Absen</label>
              <input
                type="date"
                required
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status Kehadiran</label>
              <div className="relative">
                <select
                  value={attStatus}
                  onChange={(e) => setAttStatus(e.target.value as any)}
                  className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Alpa">Mangkir (Alpa)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {attStatus === 'Hadir' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jam Masuk</label>
                <input
                  type="text"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  placeholder="08:00"
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jam Pulang</label>
                <input
                  type="text"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  placeholder="17:00"
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Catatan / Keterangan</label>
            <input
              type="text"
              value={attNotes}
              onChange={(e) => setAttNotes(e.target.value)}
              placeholder="Contoh: Keterangan sakit dokter, atau catatan keterlambatan..."
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
            />
          </div>

          <div className="pt-5 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAttendanceModalOpen(false)}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 stroke-[2]" />
              Catat Kehadiran
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Submit Leave Request */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Form Pengajuan Permohonan Cuti"
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pilih Karyawan</label>
            <div className="relative">
              <select
                required
                value={leaveEmployee}
                onChange={(e) => setLeaveEmployee(e.target.value)}
                className="appearance-none w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold cursor-pointer"
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.employeeName}>{emp.employeeName} ({emp.position})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Mulai Cuti</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Selesai Cuti</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Alasan Cuti</label>
            <textarea
              required
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Contoh: Cuti tahunan mudik lebaran, cuti melahirkan, keperluan mendesak keluarga..."
              rows={3}
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-semibold resize-none"
            />
          </div>

          <div className="pt-5 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 stroke-[2]" />
              Kirim Permohonan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
