import React, { useState, useMemo } from 'react';
import { Calendar, DollarSign, Users, CheckCircle2, AlertCircle, FileText, FileSpreadsheet, Filter, RefreshCw } from 'lucide-react';
import { Student } from '../../types/student';
import { SppBill } from '../../types/spp';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

interface MonthlySppReportPageProps {
  students: Student[];
  bills: SppBill[];
}

export const MonthlySppReportPage: React.FC<MonthlySppReportPageProps> = ({ students, bills }) => {
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('Juli');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026/2027');
  const [selectedJenjang, setSelectedJenjang] = useState<'all' | 'SMP' | 'SMA'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const monthOptions = [
    { value: 'all', label: 'Semua Bulan' },
    { value: 'Januari', label: 'Januari' },
    { value: 'Februari', label: 'Februari' },
    { value: 'Maret', label: 'Maret' },
    { value: 'April', label: 'April' },
    { value: 'Mei', label: 'Mei' },
    { value: 'Juni', label: 'Juni' },
    { value: 'Juli', label: 'Juli' },
    { value: 'Agustus', label: 'Agustus' },
    { value: 'September', label: 'September' },
    { value: 'Oktober', label: 'Oktober' },
    { value: 'November', label: 'November' },
    { value: 'Desember', label: 'Desember' },
  ];

  const academicYearOptions = [
    { value: 'all', label: 'Semua T.A.' },
    { value: '2025/2026', label: 'T.A. 2025/2026' },
    { value: '2026/2027', label: 'T.A. 2026/2027' },
    { value: '2027/2028', label: 'T.A. 2027/2028' },
  ];

  const jenjangOptions = [
    { value: 'all', label: 'Semua Jenjang (SMP/SMA)' },
    { value: 'SMP', label: 'SMP' },
    { value: 'SMA', label: 'SMA' },
  ];

  const gradeOptions = [
    { value: 'all', label: 'Semua Kelas' },
    { value: '7-A SMP', label: 'Kelas 7-A SMP' },
    { value: '7-B SMP', label: 'Kelas 7-B SMP' },
    { value: '8-A SMP', label: 'Kelas 8-A SMP' },
    { value: '8-B SMP', label: 'Kelas 8-B SMP' },
    { value: '9-A SMP', label: 'Kelas 9-A SMP' },
    { value: '10-A SMA', label: 'Kelas 10-A SMA' },
    { value: '10-B SMA', label: 'Kelas 10-B SMA' },
    { value: '11 SMA', label: 'Kelas 11 SMA' },
    { value: '12 SMA', label: 'Kelas 12 SMA' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'Lunas', label: 'Lunas' },
    { value: 'Belum Lunas', label: 'Belum Lunas' },
    { value: 'Cicilan', label: 'Cicilan Berjalan' },
    { value: 'Menunggak', label: 'Menunggak (Lewat Jatuh Tempo)' },
  ];

  // Helper to map student grade to Jenjang
  const checkJenjang = (g: string) => {
    const gl = g.toLowerCase();
    if (gl.includes('smp') || gl.includes('vii') || gl.includes('viii') || gl.includes('ix')) {
      return 'SMP';
    }
    return 'SMA';
  };

  // Filter bills and map with student profiles
  const processedData = useMemo(() => {
    return bills
      .map((bill) => {
        const student = students.find((s) => s.id === bill.studentId);
        if (!student) return null;

        const jenjang = checkJenjang(student.grade);
        const sisa = bill.amount - bill.paidAmount;

        // Determine status
        let statusText = 'Belum Lunas';
        if (sisa === 0) {
          statusText = 'Lunas';
        } else if (bill.paidAmount > 0) {
          statusText = 'Cicilan';
        } else {
          // Check if overdue
          const today = new Date().toISOString().split('T')[0];
          const isOverdue = bill.dueDate ? bill.dueDate < today : false;
          if (isOverdue) {
            statusText = 'Menunggak';
          }
        }

        return {
          ...bill,
          studentName: student.name,
          studentNisn: student.nisn,
          studentGrade: student.grade,
          studentJenjang: jenjang,
          studentAcademicYear: student.academicYear || '2026/2027',
          sisa,
          statusText,
        };
      })
      .filter((b): b is NonNullable<typeof b> => {
        if (!b) return false;

        // Apply filters
        if (selectedMonth !== 'all' && b.month !== selectedMonth) return false;
        if (selectedAcademicYear !== 'all' && b.studentAcademicYear !== selectedAcademicYear) return false;
        if (selectedJenjang !== 'all' && b.studentJenjang !== selectedJenjang) return false;
        if (selectedGrade !== 'all' && b.studentGrade !== selectedGrade) return false;
        
        if (selectedStatus !== 'all') {
          if (selectedStatus === 'Lunas' && b.statusText !== 'Lunas') return false;
          if (selectedStatus === 'Belum Lunas' && b.statusText !== 'Belum Lunas') return false;
          if (selectedStatus === 'Cicilan' && b.statusText !== 'Cicilan') return false;
          if (selectedStatus === 'Menunggak' && b.statusText !== 'Menunggak') return false;
        }

        return true;
      });
  }, [bills, students, selectedMonth, selectedAcademicYear, selectedJenjang, selectedGrade, selectedStatus]);

  // Aggregate statistics
  const summary = useMemo(() => {
    let totalTagihan = 0;
    let totalDibayar = 0;
    let totalSisa = 0;
    let lunasCount = 0;
    let menunggakCount = 0;

    processedData.forEach((b) => {
      totalTagihan += b.amount;
      totalDibayar += b.paidAmount;
      totalSisa += b.sisa;

      if (b.statusText === 'Lunas') {
        lunasCount++;
      } else if (b.statusText === 'Menunggak') {
        menunggakCount++;
      }
    });

    return {
      totalTagihan,
      totalDibayar,
      totalSisa,
      lunasCount,
      menunggakCount,
      totalStudents: processedData.length,
    };
  }, [processedData]);

  // Handle mock PDF export click
  const handleExportPDF = () => {
    alert('📋 Fitur Ekspor Laporan SPP ke PDF sedang disiapkan.\nFormat PDF resmi dengan kop surat Pondok Pesantren Al-Khairaat akan diunduh secara otomatis.');
  };

  // Handle mock Excel export click
  const handleExportExcel = () => {
    alert('📊 Fitur Ekspor Laporan SPP ke Excel (.xlsx) sedang dipersiapkan.\nSemua data tabel lengkap dengan rumus total akan diunduh secara otomatis.');
  };

  // Reset Filters helper
  const handleResetFilters = () => {
    setSelectedMonth('Juli');
    setSelectedAcademicYear('2026/2027');
    setSelectedJenjang('all');
    setSelectedGrade('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-green-950 font-serif">Laporan SPP Bulanan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Audit ringkasan tagihan, realisasi pembayaran, dan pemantauan santri menunggak</p>
        </div>

        {/* Mockup export buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl"
          >
            <FileText className="h-4 w-4" />
            Ekspor PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ekspor Excel
          </Button>
        </div>
      </div>

      {/* FILTERS CARD */}
      <div className="bg-white border border-brand-cream-200 shadow-xs rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-brand-green-950 font-bold text-xs uppercase tracking-wider">
            <Filter className="h-4 w-4 text-brand-green-800" />
            Filter Data Laporan
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[10px] text-slate-400 font-bold hover:text-brand-green-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Atur Ulang
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Month Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-month" className="text-[11px] font-bold text-slate-500">Bulan</label>
            <select
              id="rep-spp-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Academic Year Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-ay" className="text-[11px] font-bold text-slate-500">Tahun Ajaran</label>
            <select
              id="rep-spp-ay"
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {academicYearOptions.map((ay) => (
                <option key={ay.value} value={ay.value}>{ay.label}</option>
              ))}
            </select>
          </div>

          {/* Jenjang Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-jenjang" className="text-[11px] font-bold text-slate-500">Jenjang</label>
            <select
              id="rep-spp-jenjang"
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value as any)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {jenjangOptions.map((j) => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </div>

          {/* Grade Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-grade" className="text-[11px] font-bold text-slate-500">Kelas</label>
            <select
              id="rep-spp-grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {gradeOptions.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-status" className="text-[11px] font-bold text-slate-500">Status</label>
            <select
              id="rep-spp-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Tagihan</span>
            <div className="p-1 bg-slate-50 rounded-lg text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-slate-900">{formatCurrency(summary.totalTagihan)}</p>
            <p className="text-[9px] text-slate-400">Periode filter aktif</p>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Dibayar</span>
            <div className="p-1 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-emerald-600">{formatCurrency(summary.totalDibayar)}</p>
            <p className="text-[9px] text-slate-400">Realisasi terkumpul</p>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Sisa</span>
            <div className="p-1 bg-rose-50 rounded-lg text-rose-600">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-rose-600">{formatCurrency(summary.totalSisa)}</p>
            <p className="text-[9px] text-slate-400">Piutang belum tertagih</p>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Santri Lunas</span>
            <div className="p-1 bg-teal-50 rounded-lg text-teal-600">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-teal-600">{summary.lunasCount} Santri</p>
            <p className="text-[9px] text-slate-400">Dari {summary.totalStudents} terfilter</p>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs col-span-2 md:col-span-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Santri Menunggak</span>
            <div className="p-1 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-amber-600">{summary.menunggakCount} Santri</p>
            <p className="text-[9px] text-slate-400">Lewat jatuh tempo</p>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[640px] md:min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="p-4 text-center font-semibold w-12">No</th>
                <th className="p-4 font-semibold">Nama Santri</th>
                <th className="p-4 font-semibold">NISN</th>
                <th className="p-4 text-center font-semibold">Jenjang</th>
                <th className="p-4 font-semibold">Kelas</th>
                <th className="p-4 text-right font-semibold">Nominal Tagihan</th>
                <th className="p-4 text-right font-semibold">Total Dibayar</th>
                <th className="p-4 text-right font-semibold">Sisa</th>
                <th className="p-4 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {processedData.length > 0 ? (
                processedData.map((row, idx) => {
                  let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                  if (row.statusText === 'Lunas') {
                    statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (row.statusText === 'Cicilan') {
                    statusBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  } else if (row.statusText === 'Menunggak') {
                    statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                  }

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/40">
                      <td className="p-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-4 font-bold text-brand-green-950 font-serif">{row.studentName}</td>
                      <td className="p-4 font-mono font-semibold text-slate-500">{row.studentNisn}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 border rounded-full ${
                          row.studentJenjang === 'SMP' 
                            ? 'bg-indigo-50/50 text-indigo-700 border-indigo-100' 
                            : 'bg-amber-50/50 text-amber-700 border-amber-100'
                        }`}>
                          {row.studentJenjang}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{row.studentGrade}</td>
                      <td className="p-4 text-right font-mono font-semibold text-slate-800">{formatCurrency(row.amount)}</td>
                      <td className="p-4 text-right font-mono text-emerald-600 font-semibold">{formatCurrency(row.paidAmount)}</td>
                      <td className={`p-4 text-right font-mono font-bold ${row.sisa > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                        {row.sisa > 0 ? formatCurrency(row.sisa) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${statusBadge}`}>
                          {row.statusText === 'Cicilan' ? 'Cicilan' : row.statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                    Tidak ada data tagihan SPP yang cocok dengan filter di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
