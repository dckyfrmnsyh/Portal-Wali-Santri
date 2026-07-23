import React, { useState, useMemo } from 'react';
import { Search, User, FileText, FileSpreadsheet, Landmark, CheckCircle, Phone, MapPin } from 'lucide-react';
import { Student } from '../../types/student';
import { SppBill } from '../../types/spp';
import { Payment } from '../../types/payment';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/formatCurrency';
import logoResmi from '../../assets/logo_resmi.png';

interface StudentYearlyReportPageProps {
  students: Student[];
  bills: SppBill[];
  payments: Payment[];
}

export const StudentYearlyReportPage: React.FC<StudentYearlyReportPageProps> = ({
  students,
  bills,
  payments,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026/2027');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Filter students based on search string
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.nisn.includes(query) ||
        (s.nis && s.nis.toLowerCase().includes(query))
    );
  }, [students, searchQuery]);

  // Handle student select from search
  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setSearchQuery('');
  };

  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Helper to map student grade to Jenjang
  const checkJenjang = (g: string) => {
    const gl = g.toLowerCase();
    if (gl.includes('smp') || gl.includes('vii') || gl.includes('viii') || gl.includes('ix')) {
      return 'SMP';
    }
    return 'SMA';
  };

  // Build academic year bills for the selected student
  const studentYearlyBills = useMemo(() => {
    if (!selectedStudentId) return [];
    
    // Sort month order chronologically for typical Indonesian school year (Juli to Juni)
    const monthOrder: { [key: string]: number } = {
      'Juli': 1, 'Agustus': 2, 'September': 3, 'Oktober': 4, 'November': 5, 'Desember': 6,
      'Januari': 7, 'Februari': 8, 'Maret': 9, 'April': 10, 'Mei': 11, 'Juni': 12
    };

    return bills
      .filter((b) => b.studentId === selectedStudentId)
      .map((bill) => {
        const student = students.find((s) => s.id === bill.studentId);
        const studentAY = student?.academicYear || '2026/2027';

        // Find payments linked to this bill
        const billPayments = payments.filter(
          (p) => p.billId === bill.id && p.status === 'approved'
        );

        // Find last payment date
        let lastPaymentDate = '-';
        if (billPayments.length > 0) {
          const sortedPayments = [...billPayments].sort((a, b) => 
            new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
          );
          lastPaymentDate = sortedPayments[0].paymentDate;
        }

        // Aggregate comments/notes
        let notes = '-';
        const notesList = billPayments
          .map((p) => p.notes)
          .filter((n): n is string => !!n && n.trim() !== '');
        
        if (notesList.length > 0) {
          notes = notesList.join('; ');
        } else if (bill.status === 'paid') {
          notes = 'Lunas';
        }

        const sisa = bill.amount - bill.paidAmount;

        // Determine status
        let statusText = 'Belum Lunas';
        if (sisa === 0) {
          statusText = 'Lunas';
        } else if (bill.paidAmount > 0) {
          statusText = 'Cicilan';
        } else {
          const today = new Date().toISOString().split('T')[0];
          const isOverdue = bill.dueDate ? bill.dueDate < today : false;
          if (isOverdue) {
            statusText = 'Menunggak';
          }
        }

        return {
          ...bill,
          studentAcademicYear: studentAY,
          sisa,
          statusText,
          lastPaymentDate,
          notes,
          order: monthOrder[bill.month] || 99,
        };
      })
      .filter((b) => {
        if (selectedAcademicYear !== 'all' && b.studentAcademicYear !== selectedAcademicYear) return false;
        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [bills, selectedStudentId, payments, selectedAcademicYear, students]);

  // Aggregate stats
  const totals = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalSisa = 0;

    studentYearlyBills.forEach((b) => {
      totalBilled += b.amount;
      totalPaid += b.paidAmount;
      totalSisa += b.sisa;
    });

    return {
      totalBilled,
      totalPaid,
      totalSisa,
    };
  }, [studentYearlyBills]);

  // Mock export handlers
  const handleExportPDF = () => {
    if (!activeStudent) return;
    setIsPdfModalOpen(true);
  };

  const handleExportExcel = async () => {
    if (!activeStudent) return;
    if (studentYearlyBills.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    const exportData = studentYearlyBills.map((row) => ({
      'Bulan': row.month,
      'Tahun': row.year,
      'Nominal Tagihan': row.amount,
      'Nominal Terbayar': row.paidAmount,
      'Sisa Tagihan': row.sisa,
      'Status': row.statusText,
      'Tanggal Bayar Terakhir': row.lastPaymentDate,
      'Keterangan': row.notes,
    }));
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kartu SPP Siswa');
      const fileName = `Laporan_SPP_${activeStudent.name.replace(/[^a-zA-Z0-9]/g, '_')}_TA_${selectedAcademicYear.replace('/', '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err);
    }
  };

  const academicYearOptions = [
    { value: '2025/2026', label: 'T.A. 2025/2026' },
    { value: '2026/2027', label: 'T.A. 2026/2027' },
    { value: '2027/2028', label: 'T.A. 2027/2028' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-green-950 font-serif">Laporan SPP Per Siswa Per Tahun Ajaran</h2>
          <p className="text-xs text-slate-500 mt-0.5">Analisis histori kartu SPP, cicilan bulanan, rincian kuitansi kassa, serta rekap tahunan wali santri</p>
        </div>

        {activeStudent && (
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
        )}
      </div>

      {/* SEARCH AND YEAR FILTER BAR */}
      <div className="bg-white border border-brand-cream-200 shadow-xs rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          
          {/* Student Search with Auto-suggest */}
          <div className="md:col-span-2 space-y-1 relative">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-brand-green-800" />
              Cari Santri berdasarkan nama/NISN/NIS
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama, NISN, atau NIS santri..."
                className="block w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Suggestions list popup */}
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStudent(s.id)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">NISN: {s.nisn} • NIS: {s.nis || '-'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-brand-green-900 bg-brand-green-50/50 px-2 py-0.5 rounded border border-brand-green-100">
                        {s.grade}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 font-semibold">
                    Tidak ditemukan santri yang cocok.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Academic Year Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-yr-ay" className="text-xs font-bold text-slate-500">Tahun Ajaran</label>
            <select
              id="rep-yr-ay"
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {academicYearOptions.map((ay) => (
                <option key={ay.value} value={ay.value}>{ay.label}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {activeStudent ? (
        <div className="space-y-6">
          {/* STUDENT PROFILE BRIEF CARD */}
          <div className="bg-white border border-brand-cream-200 shadow-xs rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-brand-green-50 rounded-xl text-brand-green-900">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-brand-green-950 uppercase tracking-wider">Profil Singkat Santri</h3>
                <p className="text-[10px] text-slate-400">Data kemahasiswaan dan penanggung jawab wali terdaftar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
              <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Nama Santri</span>
                  <span className="font-bold text-sm text-brand-green-950 font-serif">{activeStudent.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Status Pondok</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1">
                    Active / Aktif
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-6">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">NISN</span>
                    <span className="font-mono font-bold text-slate-800">{activeStudent.nisn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">NIS</span>
                    <span className="font-mono font-bold text-slate-800">{activeStudent.nis || '-'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Jenjang</span>
                    <span className="font-bold text-slate-700">{checkJenjang(activeStudent.grade)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Kelas</span>
                    <span className="font-bold text-slate-700">{activeStudent.grade}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Wali Santri</span>
                  <span className="font-bold text-slate-800 font-serif">{activeStudent.guardianName}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-slate-500">
                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px]">{activeStudent.guardianPhone}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="text-[10px] truncate max-w-xs">{activeStudent.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY WIDGETS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-brand-cream-100 rounded-2xl p-5 shadow-2xs flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Total Ditagih T.A. {selectedAcademicYear}</span>
                <span className="text-base font-black font-mono text-slate-900 mt-1 block">{formatCurrency(totals.totalBilled)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-500">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-brand-cream-100 rounded-2xl p-5 shadow-2xs flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Telah Dibayar (Realisasi)</span>
                <span className="text-base font-black font-mono text-emerald-600 mt-1 block">{formatCurrency(totals.totalPaid)}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-brand-cream-100 rounded-2xl p-5 shadow-2xs flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Sisa Piutang (Tunggakan)</span>
                <span className="text-base font-black font-mono text-rose-600 mt-1 block">{formatCurrency(totals.totalSisa)}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                <Landmark className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* VISUAL TIMELINE */}
          <div className="bg-white border border-brand-cream-200 shadow-xs rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="text-sm font-black text-brand-green-950 uppercase tracking-wider block">Lini Masa Pembayaran (Juli - Juni)</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {studentYearlyBills.map((bill) => {
                let badgeColor = 'bg-slate-50 text-slate-500 border-slate-200';
                if (bill.statusText === 'Lunas') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (bill.statusText === 'Cicilan') badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                if (bill.statusText === 'Menunggak') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <div key={bill.id} className={`flex-1 min-w-[80px] p-3 border rounded-xl flex flex-col items-center justify-between text-center transition-all hover:shadow-xs ${badgeColor}`}>
                    <span className="text-[10px] font-black uppercase tracking-wider">{bill.month}</span>
                    <span className="text-[9px] font-mono mt-1 block">{formatCurrency(bill.paidAmount)}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border mt-2 bg-white/80">
                      {bill.statusText}
                    </span>
                  </div>
                );
              })}
              {studentYearlyBills.length === 0 && (
                <p className="text-xs text-slate-400 italic">Tidak ada tagihan diterbitkan untuk tahun ajaran terpilih.</p>
              )}
            </div>
          </div>

          {/* TABLE RECAP */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Histori Jurnal Kartu SPP Bulanan</span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full font-mono">
                T.A. {selectedAcademicYear}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[640px] md:min-w-full">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="p-4 font-semibold">Bulan</th>
                    <th className="p-4 text-right font-semibold">Nominal Tagihan</th>
                    <th className="p-4 text-right font-semibold">Dibayar</th>
                    <th className="p-4 text-right font-semibold">Sisa</th>
                    <th className="p-4 text-center font-semibold">Status</th>
                    <th className="p-4 text-center font-semibold">Tanggal Pembayaran Terakhir</th>
                    <th className="p-4 font-semibold">Catatan / Referensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {studentYearlyBills.length > 0 ? (
                    studentYearlyBills.map((bill) => {
                      let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                      if (bill.statusText === 'Lunas') {
                        statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      } else if (bill.statusText === 'Cicilan') {
                        statusBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      } else if (bill.statusText === 'Menunggak') {
                        statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                      }

                      return (
                        <tr key={bill.id} className="hover:bg-slate-50/30">
                          <td className="p-4 font-bold text-slate-800">{bill.month} {bill.year}</td>
                          <td className="p-4 text-right font-mono font-semibold text-slate-800">{formatCurrency(bill.amount)}</td>
                          <td className="p-4 text-right font-mono text-emerald-600 font-semibold">{formatCurrency(bill.paidAmount)}</td>
                          <td className={`p-4 text-right font-mono font-bold ${bill.sisa > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                            {bill.sisa > 0 ? formatCurrency(bill.sisa) : '-'}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-full ${statusBadge}`}>
                              {bill.statusText}
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono text-slate-500 font-medium">{bill.lastPaymentDate}</td>
                          <td className="p-4 font-medium text-slate-500 italic max-w-xs truncate" title={bill.notes}>
                            {bill.notes}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                        Tidak ada catatan tagihan SPP terdaftar untuk santri ini di Tahun Ajaran {selectedAcademicYear}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-brand-cream-100 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <User className="h-12 w-12 mx-auto text-slate-300" />
          <p className="font-semibold text-sm">Silakan pilih santri menggunakan kolom pencarian di atas untuk memuat laporan.</p>
        </div>
      )}

      {/* PDF PRINT PREVIEW MODAL */}
      {isPdfModalOpen && activeStudent && (
        <Modal 
          isOpen={isPdfModalOpen} 
          onClose={() => setIsPdfModalOpen(false)} 
          title="Pratinjau PDF Laporan Keuangan SPP"
        >
          <div className="space-y-6">
            <div className="flex justify-end gap-2 border-b border-slate-100 pb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs bg-brand-green-900 text-white hover:bg-brand-green-800 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Cetak Dokumen / Simpan PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPdfModalOpen(false)}
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-3 py-1.5 rounded-lg"
              >
                Tutup
              </Button>
            </div>

            {/* Formal Report Sheet (A4 ratio mock) */}
            <div className="bg-white border border-slate-300 p-8 rounded-lg shadow-inner font-sans text-slate-800 space-y-6 max-h-[70vh] overflow-y-auto" id="printable-report-area">
              {/* Formal Letterhead */}
              <div className="text-center border-b-2 border-double border-slate-900 pb-4 relative">
                <div className="absolute left-2 top-2 h-16 w-16 bg-transparent flex items-center justify-center">
                  <img src={logoResmi} alt="Logo resmi" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 leading-none">Yayasan Khairaat Tana Tidung</p>
                <h3 className="text-sm font-black uppercase text-brand-green-950 tracking-wider mt-1 font-serif">Pondok Pesantren Khairaat Tana Tidung</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Izin Operasional Kemenag No. 432 Tahun 2018 • Telp: (0553) 221-XXXX</p>
                <p className="text-[9px] text-slate-400 italic">Alamat: Jl. Pesantren, RT. 02, Kec. Sesayap Hilir, Kabupaten Tana Tidung, Kalimantan Utara</p>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Kartu Kontrol & Rekapitulasi SPP Santri</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tahun Ajaran {selectedAcademicYear}</p>
              </div>

              {/* Student Profile Info */}
              <div className="grid grid-cols-2 gap-4 text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-bold uppercase">Nama Santri</span>
                    <span className="text-slate-900 font-black font-serif">: {activeStudent.name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-bold uppercase">NISN / NIS</span>
                    <span className="text-slate-800 font-mono font-bold">: {activeStudent.nisn} / {activeStudent.nis || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-bold uppercase">Kelas / Jenjang</span>
                    <span className="text-slate-800 font-bold">: {activeStudent.grade}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-bold uppercase">Wali Santri</span>
                    <span className="text-slate-800 font-bold">: {activeStudent.guardianName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-bold uppercase">Telepon Wali</span>
                    <span className="text-slate-800 font-mono font-bold">: {activeStudent.guardianPhone}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400 font-bold uppercase">Status</span>
                    <span className="text-emerald-700 font-bold">: Aktif / Terdaftar</span>
                  </div>
                </div>
              </div>

              {/* Detailed Financial Ledger Table */}
              <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                    <th className="p-2 border border-slate-300">Bulan & Tahun</th>
                    <th className="p-2 border border-slate-300 text-right">Nominal Tagihan</th>
                    <th className="p-2 border border-slate-300 text-right">Total Dibayar</th>
                    <th className="p-2 border border-slate-300 text-right">Sisa Tunggakan</th>
                    <th className="p-2 border border-slate-300 text-center">Status</th>
                    <th className="p-2 border border-slate-300 text-center">Validasi Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  {studentYearlyBills.map((bill) => (
                    <tr key={`print-${bill.id}`}>
                      <td className="p-2 border border-slate-300 font-bold">{bill.month} {bill.year}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold">{formatCurrency(bill.amount)}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono text-emerald-700 font-bold">{formatCurrency(bill.paidAmount)}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono text-rose-600 font-black">{bill.sisa > 0 ? formatCurrency(bill.sisa) : '-'}</td>
                      <td className="p-2 border border-slate-300 text-center uppercase font-black text-[9px]">
                        {bill.statusText}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-slate-500">{bill.lastPaymentDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Summary Block */}
              <div className="grid grid-cols-3 gap-3 bg-slate-900 text-white p-4 rounded-xl text-center font-mono text-[11px] font-bold">
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[9px] font-bold block">Total Ditagih</span>
                  <p className="text-xs">{formatCurrency(totals.totalBilled)}</p>
                </div>
                <div className="space-y-1 border-x border-slate-700">
                  <span className="text-emerald-400 uppercase text-[9px] font-bold block">Realisasi Bayar</span>
                  <p className="text-xs">{formatCurrency(totals.totalPaid)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-rose-400 uppercase text-[9px] font-bold block">Sisa Piutang</span>
                  <p className="text-xs">{formatCurrency(totals.totalSisa)}</p>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="pt-8 text-[11px] flex justify-between">
                <div className="text-center w-48 space-y-12">
                  <p>Mengetahui,<br /><span className="font-bold">Orang Tua / Wali Santri</span></p>
                  <p className="border-b border-slate-400 w-36 mx-auto pt-4"></p>
                </div>
                <div className="text-center w-56 space-y-12">
                  <p>Tana Tidung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br /><span className="font-bold">Kepala Administrasi Keuangan</span></p>
                  <p className="font-bold underline uppercase">( Ustadz Ahmad )</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
