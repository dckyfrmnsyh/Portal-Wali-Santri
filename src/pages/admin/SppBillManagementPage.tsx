import React, { useState, useMemo } from 'react';
import { Plus, Eye, DollarSign, AlertCircle, Sparkles, CheckSquare as CheckBadgeIcon } from 'lucide-react';
import { Student } from '../../types/student';
import { SppBill } from '../../types/spp';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatCurrency } from '../../utils/formatCurrency';
import { getSppStatusLabel, getSppStatusColor } from '../../utils/statusHelper';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface SppBillManagementPageProps {
  students: Student[];
  bills: SppBill[];
  onGenerateBulkBills: (
    month: string,
    year: number,
    amount: number,
    academicYear?: string,
    dueDate?: string,
    jenjang?: 'all' | 'SMP' | 'SMA',
    grade?: string,
    useIndividualSpp?: boolean // New parameter
  ) => void;
  onRecordCashPayment: (billId: string, amount: number, reference: string, date: string) => void;
}

export const SppBillManagementPage: React.FC<SppBillManagementPageProps> = ({
  students,
  bills,
  onGenerateBulkBills,
  onRecordCashPayment,
}) => {
  // Master Generation Form States
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [genMonth, setGenMonth] = useState('Juli');
  const [genYear, setGenYear] = useState(2026);
  const [jenjang, setJenjang] = useState<'all' | 'SMP' | 'SMA'>('all');
  const [grade, setGrade] = useState('all');
  const [amount, setAmount] = useState(500000); // Default bulk amount
  const [dueDate, setDueDate] = useState('2026-07-10');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [useIndividualSpp, setUseIndividualSpp] = useState(false); // New state for individual SPP

  // Selected Batch Modal States (for drill down)
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Cash Payment Dialog States (nested in detail)
  const [selectedBillForCash, setSelectedBillForCash] = useState<SppBill | null>(null);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [cashDate, setCashDate] = useState('');
  const [cashRef, setCashRef] = useState('');
  const [cashError, setCashError] = useState('');

  const monthOptions = [
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

  const yearOptions = [
    { value: '2026', label: '2026' },
    { value: '2027', label: '2027' },
  ];

  const academicYearOptions = [
    { value: '2025/2026', label: 'T.A. 2025/2026' },
    { value: '2026/2027', label: 'T.A. 2026/2027' },
    { value: '2027/2028', label: 'T.A. 2027/2028' },
  ];

  const jenjangOptions = [
    { value: 'all', label: 'Semua Jenjang' },
    { value: 'SMP', label: 'Jenjang SMP' },
    { value: 'SMA', label: 'Jenjang SMA' },
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

  // Map individual student grade to Jenjang string
  const checkJenjang = (g: string) => {
    const gl = g.toLowerCase();
    if (gl.includes('smp') || gl.includes('vii') || gl.includes('viii') || gl.includes('ix')) {
      return 'SMP';
    }
    return 'SMA';
  };

  // Build the Grouped Batch Data
  const batchData = useMemo(() => {
    const batches: { [key: string]: {
      id: string;
      month: string;
      year: number;
      academicYear: string;
      jenjang: 'SMP' | 'SMA';
      grade: string;
      studentCount: number;
      nominal: number;
      totalBill: number;
      totalPaid: number;
      totalSisa: number;
      status: 'Lunas' | 'Belum Lunas' | 'Cicilan Berjalan';
    }} = {};

    bills.forEach((bill) => {
      const student = students.find((s) => s.id === bill.studentId);
      if (!student) return;

      const j = checkJenjang(student.grade);
      const ay = student.academicYear || academicYear;
      const key = `${bill.month}-${bill.year}-${student.grade}`;

      if (!batches[key]) {
        batches[key] = {
          id: key,
          month: bill.month,
          year: bill.year,
          academicYear: ay,
          jenjang: j,
          grade: student.grade,
          studentCount: 0,
          nominal: bill.amount,
          totalBill: 0,
          totalPaid: 0,
          totalSisa: 0,
          status: 'Belum Lunas',
        };
      }

      batches[key].studentCount += 1;
      batches[key].totalBill += bill.amount;
      batches[key].totalPaid += bill.paidAmount;
    });

    // Compute status and sisa for each batch
    return Object.values(batches).map((b) => {
      const sisa = b.totalBill - b.totalPaid;
      b.totalSisa = sisa;
      if (sisa === 0) {
        b.status = 'Lunas';
      } else if (b.totalPaid > 0) {
        b.status = 'Cicilan Berjalan';
      } else {
        b.status = 'Belum Lunas';
      }
      return b;
    });
  }, [bills, students, academicYear]);

  // Handle bill generation click
  const handleGenerateBills = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!useIndividualSpp && amount <= 0) { // Only validate bulk amount if not using individual
      setFormError('Nominal SPP harus lebih besar dari Rp 0.');
      return;
    }

    if (!dueDate) {
      setFormError('Sila pilih tanggal jatuh tempo tagihan.');
      return;
    }

    // Identify how many students are active and match filter
    const activeMatch = students.filter((s) => {
      if (s.status !== 'active') return false;
      const sj = checkJenjang(s.grade);
      if (jenjang !== 'all' && sj !== jenjang) return false;
      if (grade !== 'all' && s.grade !== grade) return false;
      return true;
    });

    if (activeMatch.length === 0) {
      setFormError('Tidak ditemukan santri AKTIF yang cocok dengan filter Jenjang / Kelas terpilih.');
      return;
    }

    onGenerateBulkBills(genMonth, genYear, amount, academicYear, dueDate, jenjang, grade, useIndividualSpp);
    setFormSuccess(`Berhasil menerbitkan SPP periode ${genMonth} ${genYear} untuk ${activeMatch.length} santri aktif.`);
  };

  // Open batch detail view
  const handleViewBatchDetails = (batch: any) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
  };

  // Get list of individual bills in the selected batch
  const selectedBatchBills = useMemo(() => {
    if (!selectedBatch) return [];
    
    return bills.filter((b) => {
      const student = students.find((s) => s.id === b.studentId);
      if (!student) return false;
      return b.month === selectedBatch.month && b.year === selectedBatch.year && student.grade === selectedBatch.grade;
    }).map((b) => {
      const student = students.find((s) => s.id === b.studentId)!;
      return {
        ...b,
        studentName: student.name,
        studentNisn: student.nisn,
        studentNis: student.nis || '1234',
      };
    });
  }, [selectedBatch, bills, students]);

  // Open cash collection nested modal
  const handleOpenCashPayment = (bill: SppBill) => {
    setSelectedBillForCash(bill);
    setCashAmount(bill.amount - bill.paidAmount);
    setCashDate(new Date().toISOString().split('T')[0]);
    setCashRef(`CASH-${Date.now().toString().slice(-6)}`);
    setCashError('');
    setIsCashModalOpen(true);
  };

  // Submit cash collection directly
  const handleCashPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForCash) return;

    const remaining = selectedBillForCash.amount - selectedBillForCash.paidAmount;
    if (cashAmount <= 0) {
      setCashError('Jumlah bayar harus lebih dari Rp 0.');
      return;
    }
    if (cashAmount > remaining) {
      setCashError(`Jumlah bayar tidak boleh melebihi sisa tagihan (${formatCurrency(remaining)}).`);
      return;
    }

    onRecordCashPayment(selectedBillForCash.id, cashAmount, cashRef, cashDate);
    
    // Update local state for modal immediately so detail table refreshes nicely
    setIsCashModalOpen(false);
    setSelectedBillForCash(null);
    alert(`Pembayaran Tunai Sebesar ${formatCurrency(cashAmount)} berhasil dicatat di loket bendahara!`);
  };

  // Columns for main SPP Batch summary table
  const columns = [
    {
      key: 'month',
      header: 'Bulan',
      render: (row: any) => <span className="font-bold text-slate-800">{row.month} {row.year}</span>,
    },
    {
      key: 'academicYear',
      header: 'Tahun Ajaran',
      render: (row: any) => <span className="font-mono text-xs text-slate-600 font-semibold">{row.academicYear}</span>,
    },
    {
      key: 'jenjang',
      header: 'Jenjang',
      render: (row: any) => (
        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${
          row.jenjang === 'SMP' 
            ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
            : 'bg-amber-50 text-amber-700 border-amber-100'
        }`}>
          {row.jenjang}
        </span>
      ),
    },
    {
      key: 'grade',
      header: 'Kelas',
      render: (row: any) => <span className="font-bold text-slate-700">{row.grade}</span>,
    },
    {
      key: 'studentCount',
      header: 'Jumlah Santri',
      render: (row: any) => <span className="font-mono font-semibold text-slate-700">{row.studentCount} Santri</span>,
    },
    {
      key: 'nominal',
      header: 'Nominal Per Santri',
      render: (row: any) => <span className="font-mono font-semibold text-slate-800">{formatCurrency(row.nominal)}</span>,
    },
    {
      key: 'totalBill',
      header: 'Total Tagihan',
      render: (row: any) => <span className="font-mono font-bold text-slate-900">{formatCurrency(row.totalBill)}</span>,
    },
    {
      key: 'totalPaid',
      header: 'Total Dibayar',
      render: (row: any) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(row.totalPaid)}</span>,
    },
    {
      key: 'totalSisa',
      header: 'Sisa Tagihan',
      render: (row: any) => (
        <span className={`font-mono font-bold ${row.totalSisa > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {formatCurrency(row.totalSisa)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => {
        let color = 'bg-slate-50 text-slate-600 border-slate-200';
        if (row.status === 'Lunas') color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (row.status === 'Cicilan Berjalan') color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        return <span className={`text-xs font-semibold px-2 py-0.5 border rounded-full ${color}`}>{row.status}</span>;
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewBatchDetails(row)}
          className="p-1.5 hover:text-brand-green-900 hover:border-brand-green-300 font-semibold text-xs flex items-center gap-1 cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          Lihat Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Tagihan SPP Bulanan</h2>
        <p className="text-xs text-slate-500 mt-0.5">Kelola batasan tarif SPP, pembuatan kartu tagihan bulanan otomatis, dan entri kasir tunai</p>
      </div>

      {/* CREATE BILL FORM (Requested Form Area) */}
      <div className="bg-white border border-brand-cream-200 shadow-xs rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-brand-green-50 rounded-xl text-brand-green-900">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-green-950">Mulai Pembuatan Tagihan SPP Bulanan</h3>
            <p className="text-[11px] text-slate-400">Buat draf billing SPP bulanan serentak berdasarkan kriteria jenjang atau kelas</p>
          </div>
        </div>

        {formError && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckBadgeIcon className="h-4 w-4 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        <form onSubmit={handleGenerateBills} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <Select
            id="bill-academic-year"
            label="Tahun Ajaran"
            options={academicYearOptions}
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />

          <Select
            id="bill-month"
            label="Bulan SPP"
            options={monthOptions}
            value={genMonth}
            onChange={(e) => setGenMonth(e.target.value)}
          />

          <Select
            id="bill-jenjang"
            label="Jenjang"
            options={jenjangOptions}
            value={jenjang}
            onChange={(e) => setJenjang(e.target.value as any)}
          />

          <Select
            id="bill-grade"
            label="Kelas"
            options={gradeOptions}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />

          <Input
            id="bill-amount"
            label="Nominal SPP (Rp)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required={!useIndividualSpp} // Required only if not using individual SPP
            disabled={useIndividualSpp} // Disable if using individual SPP
          />

          <Input
            id="bill-due-date"
            label="Jatuh Tempo"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <div className="flex items-center gap-2 md:col-span-3 lg:col-span-3">
            <input
              type="checkbox"
              id="use-individual-spp"
              checked={useIndividualSpp}
              onChange={(e) => setUseIndividualSpp(e.target.checked)}
              className="h-4 w-4 text-brand-green-600 focus:ring-brand-green-500 border-gray-300 rounded"
            />
            <label htmlFor="use-individual-spp" className="text-xs font-medium text-slate-700">
              Gunakan tarif SPP per santri (diambil dari data santri)
            </label>
          </div>

          <div className="md:col-span-3 lg:col-span-3 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs shadow-xs transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Buat Tagihan SPP
            </Button>
          </div>
        </form>
      </div>

      {/* SUMMARY TABLE AREA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Daftar Periode Tagihan Berjalan</h3>
          <span className="text-[10px] text-slate-400 font-mono">Dikelompokkan per kelas & bulan</span>
        </div>
        
        <DataTable
          columns={columns}
          data={batchData}
          emptyMessage="Belum ada draf kartu tagihan SPP yang dibuka. Terbitkan menggunakan form di atas."
        />
      </div>

      {/* BATCH DETAIL DRILL DOWN MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedBatch ? `Detail Tagihan: Kelas ${selectedBatch.grade} - Periode ${selectedBatch.month} ${selectedBatch.year}` : 'Detail Tagihan'}
      >
        {selectedBatch && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-brand-cream-50 border border-brand-cream-100 rounded-2xl">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Santri</p>
                <p className="text-sm font-bold text-brand-green-950 font-mono">{selectedBatch.studentCount} Orang</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Tarif SPP</p>
                <p className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(selectedBatch.nominal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Realisasi Penerimaan</p>
                <p className="text-sm font-bold text-emerald-700 font-mono">{formatCurrency(selectedBatch.totalPaid)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Sisa Piutang</p>
                <p className="text-sm font-bold text-rose-600 font-mono">{formatCurrency(selectedBatch.totalSisa)}</p>
              </div>
            </div>

            {/* Sub-Table of Individual Student Bills inside Batch */}
            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500">
                    <th className="p-3 font-semibold">NISN / NIS</th>
                    <th className="p-3 font-semibold">Nama Lengkap Santri</th>
                    <th className="p-3 font-semibold text-right">Tarif</th>
                    <th className="p-3 font-semibold text-right">Dibayar</th>
                    <th className="p-3 font-semibold text-right">Sisa Tagihan</th>
                    <th className="p-3 font-semibold text-center">Status</th>
                    <th className="p-3 font-semibold text-center">Kasir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedBatchBills.length > 0 ? (
                    selectedBatchBills.map((bill) => {
                      const sisa = bill.amount - bill.paidAmount;
                      return (
                        <tr key={bill.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-medium">
                            <div>{bill.studentNisn}</div>
                            <div className="text-[9px] text-teal-600 font-bold">NIS: {bill.studentNis}</div>
                          </td>
                          <td className="p-3 font-bold text-brand-green-950 font-serif">{bill.studentName}</td>
                          <td className="p-3 text-right font-mono font-semibold">{formatCurrency(bill.amount)}</td>
                          <td className="p-3 text-right font-mono text-emerald-600 font-semibold">{formatCurrency(bill.paidAmount)}</td>
                          <td className={`p-3 text-right font-mono font-bold ${sisa > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {sisa > 0 ? formatCurrency(sisa) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block text-[10px] font-black px-2 py-0.5 border rounded-full ${getSppStatusColor(bill.status)}`}>
                              {getSppStatusLabel(bill.status)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {bill.status !== 'paid' ? (
                              <button
                                onClick={() => handleOpenCashPayment(bill)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[10px] font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center mx-auto"
                              >
                                <DollarSign className="h-3 w-3 mr-0.5" />
                                Bayar
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold font-mono">Lunas</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">Tidak ada individual bill ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsDetailModalOpen(false)} variant="outline" className="rounded-xl px-5 text-xs font-semibold">
                Tutup Detail
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* NESTED CASH PAYMENT DIALOG */}
      <Modal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        title="Kasir Loket: Pembayaran SPP Tunai"
      >
        {selectedBillForCash && (
          <form onSubmit={handleCashPaymentSubmit} className="space-y-4">
            {cashError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{cashError}</span>
              </div>
            )}

            <div className="p-4 bg-brand-cream-50 border border-brand-cream-100 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Santri</span>
                <span className="font-bold text-brand-green-950 font-serif">
                  {(selectedBillForCash as any).studentName}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Periode</span>
                <span className="font-bold text-slate-700">
                  {selectedBillForCash.month} {selectedBillForCash.year}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-200/50 pt-2 font-bold">
                <span className="text-slate-500 uppercase text-[10px]">Sisa Piutang</span>
                <span className="text-rose-600 font-mono">
                  {formatCurrency(selectedBillForCash.amount - selectedBillForCash.paidAmount)}
                </span>
              </div>
            </div>

            <Input
              id="cash-amount"
              label="Jumlah Tunai yang Dibayarkan (Rp)"
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(Number(e.target.value))}
              required
            />

            <Input
              id="cash-date"
              label="Tanggal Penerimaan"
              type="date"
              value={cashDate}
              onChange={(e) => setCashDate(e.target.value)}
              required
            />

            <Input
              id="cash-ref"
              label="Nomor Kuitansi Loket"
              value={cashRef}
              onChange={(e) => setCashRef(e.target.value)}
              required
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCashModalOpen(false)} className="rounded-xl text-xs font-semibold">
                Batal
              </Button>
              <Button type="submit" variant="success" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-5 text-xs flex items-center gap-1 cursor-pointer">
                <DollarSign className="h-3.5 w-3.5" />
                Sahkan & Cetak Kuitansi
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};