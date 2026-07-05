import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Landmark,
  Coins,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Bell,
} from 'lucide-react';

import { Student } from '../../types/student';
import { Payment } from '../../types/payment';
import { SppBill } from '../../types/spp';

import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ExportButton } from '../../components/ui/ExportButton';

import { formatCurrency } from '../../utils/formatCurrency';

interface PaymentManagementPageProps {
  students: Student[];
  payments: Payment[];
  bills: SppBill[];
  onRecordPayment: (
    billId: string,
    amount: number,
    method: 'cash' | 'transfer',
    reference: string,
    date: string,
    notes: string
  ) => void;
}

const sanitizePhone = (phone: string) => {
  // WA biasanya butuh digit saja.
  // Hapus spasi, +, -, dll.
  const digits = phone.replace(/[^\d]/g, '');
  return digits;
};

const buildWhatsAppLink = (phone: string, text: string) => {
  const clean = sanitizePhone(phone);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${clean}?text=${encoded}`;
};

export const PaymentManagementPage: React.FC<PaymentManagementPageProps> = ({
  students,
  payments,
  bills,
  onRecordPayment,
}) => {
  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBillId, setSelectedBillId] = useState('');
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('cash');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Reminder state
  const [sendingReminderBillId, setSendingReminderBillId] = useState<string | null>(null);

  // Active student choices
  const studentOptions = useMemo(() => {
    return students
      .filter((s) => s.status === 'active')
      .map((s) => ({
        value: s.id,
        label: `${s.name} (NISN: ${s.nisn} - Kelas ${s.grade})`,
      }));
  }, [students]);

  // Load unpaid or partially paid bills for selected student
  const studentBillOptions = useMemo(() => {
    if (!selectedStudentId) return [];

    return bills
      .filter((b) => b.studentId === selectedStudentId && b.status !== 'paid')
      .map((b) => {
        const remaining = b.amount - b.paidAmount;
        return {
          value: b.id,
          label: `${b.month} ${b.year} - Sisa Tagihan: ${formatCurrency(remaining)}`,
          remainingAmount: remaining,
        };
      });
  }, [selectedStudentId, bills]);

  // When selected student changes, reset bill and amount
  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedStudentId(sId);
    setSelectedBillId('');
    setPayAmount(0);
    setFormError('');
    setFormSuccess('');
  };

  // When bill changes, autofill remaining amount
  const handleBillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bId = e.target.value;
    setSelectedBillId(bId);
    setFormError('');

    const matched = studentBillOptions.find((opt) => opt.value === bId);
    if (matched) {
      setPayAmount(matched.remainingAmount);
    } else {
      setPayAmount(0);
    }
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedStudentId) {
      setFormError('Mohon pilih santri terlebih dahulu.');
      return;
    }

    if (!selectedBillId) {
      setFormError('Mohon pilih bulan tagihan SPP yang akan dibayar.');
      return;
    }

    if (payAmount <= 0) {
      setFormError('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    const matchedBillOpt = studentBillOptions.find((opt) => opt.value === selectedBillId);
    if (matchedBillOpt && payAmount > matchedBillOpt.remainingAmount) {
      setFormError(`Nominal pembayaran melebihi sisa tagihan (${formatCurrency(matchedBillOpt.remainingAmount)}).`);
      return;
    }

    const reference = `${payMethod === 'cash' ? 'CASH' : 'TRSF'}-${Date.now().toString().slice(-6)}`;

    onRecordPayment(selectedBillId, payAmount, payMethod, reference, payDate, payNotes);

    setFormSuccess('Pembayaran berhasil disimpan dan langsung disahkan!');
    // Reset form fields
    setSelectedStudentId('');
    setSelectedBillId('');
    setPayAmount(0);
    setPayNotes('');
  };

  // Determine SPP Status: Lunas, Cicilan Berjalan, Belum Lunas, Menunggak
  const getSppDetailedStatus = (bill: SppBill) => {
    const sisa = bill.amount - bill.paidAmount;
    if (sisa === 0) return 'Lunas';
    if (bill.paidAmount > 0) return 'Cicilan Berjalan';

    // Check if past due date
    const today = new Date().toISOString().split('T')[0];
    const isPastDue = bill.dueDate ? bill.dueDate < today : false;
    return isPastDue ? 'Menunggak' : 'Belum Lunas';
  };

  // Prepare detailed billing grid data (+ data untuk reminder)
  const tableData = useMemo(() => {
    return bills.map((bill) => {
      const student = students.find((s) => s.id === bill.studentId);

      // Look up corresponding payment records to extract methods and dates
      const billPayments = payments.filter((p) => p.billId === bill.id && p.status === 'approved');
      const methods = Array.from(
        new Set(billPayments.map((p) => (p.method === 'cash' ? 'Tunai' : 'Transfer')))
      );
      const dates = billPayments.map((p) => p.paymentDate);

      const status = getSppDetailedStatus(bill);
      const sisaTagihan = bill.amount - bill.paidAmount;

      return {
        id: bill.id,

        // untuk reminder
        bill,
        studentId: bill.studentId,
        studentName: student ? student.name : 'Santri Tidak Ditemukan',
        guardianName: student ? student.guardianName : '-',
        guardianPhone: student ? student.guardianPhone : '',

        // untuk tabel existing
        studentNisn: student ? student.nisn : '-',
        studentGrade: student ? student.grade : '-',
        monthYear: `${bill.month} ${bill.year}`,
        amount: bill.amount,
        paidAmount: bill.paidAmount,
        sisaTagihan,
        statusLabel: status,
        metodePembayaran: methods.length > 0 ? methods.join(', ') : '-',
        tanggalBayar: dates.length > 0 ? dates.sort().join(', ') : '-',
        adminPencatat:
          billPayments.length > 0
            ? billPayments[0].notes?.includes('Wali')
              ? 'Wali (Sistem)'
              : 'Bendahara Pondok'
            : '-',
      };
    });
  }, [bills, students, payments]);

  // Export headers matching user columns
  const exportHeaders = [
    { key: 'studentName', label: 'Nama Santri' },
    { key: 'studentNisn', label: 'NISN' },
    { key: 'studentGrade', label: 'Kelas' },
    { key: 'monthYear', label: 'Bulan SPP' },
    { key: 'amount', label: 'Nominal Tagihan' },
    { key: 'paidAmount', label: 'Nominal Dibayar' },
    { key: 'sisaTagihan', label: 'Sisa Tagihan' },
    { key: 'statusLabel', label: 'Status' },
    { key: 'metodePembayaran', label: 'Metode' },
    { key: 'tanggalBayar', label: 'Tanggal Pembayaran' },
    { key: 'adminPencatat', label: 'Admin Pencatat' },
  ];

  const handleSendReminderWA = (row: any) => {
    const bill: SppBill | undefined = row?.bill;
    const phone: string = row?.guardianPhone;

    if (!bill) return;
    if (!phone) {
      alert('Nomor WhatsApp wali santri belum tersedia.');
      return;
    }

    const remaining = row?.sisaTagihan ?? bill.amount - bill.paidAmount;
    if (remaining <= 0) return;

    const guardianName = row?.guardianName || '';
    const studentName = row?.studentName || '';
    const month = bill.month;
    const year = bill.year;

    const message =
      `Assalamu'alaikum Wr. Wb.\n\n` +
      `${guardianName ? `${guardianName}, ` : ''}kami mengingatkan pembayaran SPP untuk ${studentName} (${month} ${year}).\n` +
      `Sisa tagihan: ${formatCurrency(remaining)}.\n\n` +
      `Mohon segera ditindak lanjuti. Terima kasih.\nWassalamu'alaikum Wr. Wb.`;

    const url = buildWhatsAppLink(phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Table columns matching exact Indonesia specification + reminder
  const columns = [
    {
      key: 'studentName',
      header: 'Nama Santri',
      render: (row: any) => (
        <div className="font-bold text-brand-green-950 font-serif">{row.studentName}</div>
      ),
    },
    {
      key: 'studentNisn',
      header: 'NISN',
      render: (row: any) => <span className="font-mono text-xs text-slate-500 font-semibold">{row.studentNisn}</span>,
    },
    {
      key: 'studentGrade',
      header: 'Kelas',
      render: (row: any) => <span className="font-bold text-slate-700">{row.studentGrade}</span>,
    },
    {
      key: 'monthYear',
      header: 'Bulan SPP',
      render: (row: any) => <span className="font-medium text-slate-600">{row.monthYear}</span>,
    },
    {
      key: 'amount',
      header: 'Nominal Tagihan',
      render: (row: any) => <span className="font-mono font-semibold text-slate-800">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'paidAmount',
      header: 'Nominal Dibayar',
      render: (row: any) => (
        <span className={`font-mono font-bold ${row.paidAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
          {formatCurrency(row.paidAmount)}
        </span>
      ),
    },
    {
      key: 'sisaTagihan',
      header: 'Sisa Tagihan',
      render: (row: any) => (
        <span className={`font-mono font-bold ${row.sisaTagihan > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
          {row.sisaTagihan > 0 ? formatCurrency(row.sisaTagihan) : '-'}
        </span>
      ),
    },
    {
      key: 'statusLabel',
      header: 'Status',
      render: (row: any) => {
        let badgeColor = 'bg-slate-50 text-slate-500 border-slate-200';
        if (row.statusLabel === 'Lunas') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (row.statusLabel === 'Cicilan Berjalan') badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        if (row.statusLabel === 'Menunggak') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

        return (
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-full ${badgeColor}`}>
            {row.statusLabel}
          </span>
        );
      },
    },
    {
      key: 'metodePembayaran',
      header: 'Metode',
      render: (row: any) => {
        if (row.metodePembayaran === '-') return <span className="text-slate-300">-</span>;
        const isCash = row.metodePembayaran.includes('Tunai');
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-xs text-slate-600">
            {isCash ? (
              <Coins className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Landmark className="h-3.5 w-3.5 text-indigo-500" />
            )}
            {row.metodePembayaran}
          </span>
        );
      },
    },
    {
      key: 'tanggalBayar',
      header: 'Tanggal Pembayaran',
      render: (row: any) => <span className="font-mono text-xs text-slate-600">{row.tanggalBayar}</span>,
    },
    {
      key: 'adminPencatat',
      header: 'Admin Pencatat',
      render: (row: any) => (
        <span className={`text-xs font-semibold ${row.adminPencatat.includes('Bendahara') ? 'text-brand-green-800' : 'text-slate-500'}`}>
          {row.adminPencatat}
        </span>
      ),
    },
    {
      key: 'reminder',
      header: 'Reminder',
      render: (row: any) => {
        const bill: SppBill | undefined = row?.bill;
        const isPaid = (row?.sisaTagihan ?? 0) <= 0;
        const isSending = sendingReminderBillId === bill?.id;

        return (
          <div className="flex items-center justify-center">
            <button
              type="button"
              disabled={!bill || isPaid || isSending}
              onClick={() => {
                if (!bill) return;
                setSendingReminderBillId(bill.id);
                try {
                  handleSendReminderWA(row);
                } finally {
                  // tidak menunggu WA terbuka karena link langsung.
                  setSendingReminderBillId(null);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                !bill || isPaid
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-green-800 hover:bg-brand-green-900 text-white'
              }`}
              title={isPaid ? 'Tagihan sudah lunas' : 'Kirim reminder ke WhatsApp wali'}
            >
              <span className="inline-flex items-center gap-2">
                <Bell className={`h-3.5 w-3.5 ${isSending ? 'animate-pulse' : ''}`} />
                {isPaid ? 'Lunas' : isSending ? 'Membuka WA...' : 'Kirim WA'}
              </span>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-green-950 font-serif">Input & Log Pembayaran SPP</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catat cicilan, pembayaran lunas di loket bendahara, serta audit rekam jejak bayar wali santri
          </p>
        </div>

        <ExportButton data={tableData} filename="pembayaran-spp.csv" headers={exportHeaders} />
      </div>

      {/* PAYMENT ENTRY FORM (Required Input Area) */}
      <div className="bg-white border border-brand-cream-200 shadow-xs rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-900">
            <CreditCard className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Entri Pembayaran SPP Baru</h3>
            <p className="text-[11px] text-slate-400">
              Pilih santri untuk menarik data tagihan SPP-nya yang masih outstanding secara real-time
            </p>
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
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Pilih Santri</label>
              <select
                value={selectedStudentId}
                onChange={handleStudentChange}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-green-900 bg-slate-50/50 text-slate-700 font-medium"
              >
                <option value="">-- Pilih Santri Aktif --</option>
                {studentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bill Period Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Pilih Bulan SPP (Periode Tunggakan)</label>
              <select
                value={selectedBillId}
                onChange={handleBillChange}
                disabled={!selectedStudentId}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-green-900 bg-slate-50/50 text-slate-700 font-medium disabled:opacity-50"
              >
                <option value="">
                  {!selectedStudentId
                    ? '-- Pilih Santri Terlebih Dahulu --'
                    : studentBillOptions.length === 0
                      ? 'Semua SPP Sudah Lunas!'
                      : '-- Pilih Periode Tagihan --'}
                </option>
                {studentBillOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Payment Amount */}
            <Input
              id="pay-amount"
              label="Nominal Pembayaran (Rp)"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              disabled={!selectedBillId}
              required
            />

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Metode Pembayaran</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                disabled={!selectedBillId}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-green-900 bg-slate-50/50 text-slate-700 font-medium"
              >
                <option value="cash">💵 Tunai Loket / Cash</option>
                <option value="transfer">🏦 Bank Transfer</option>
              </select>
            </div>

            {/* Payment Date */}
            <Input
              id="pay-date"
              label="Tanggal Pembayaran"
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              disabled={!selectedBillId}
              required
            />
          </div>

          {/* Admin Notes */}
          <Input
            id="pay-notes"
            label="Catatan Admin / Keterangan Pembayaran"
            placeholder="Contoh: Pembayaran SPP lunas dibayar cash di loket bendahara / Cicilan pertama"
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
            disabled={!selectedBillId}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedBillId}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs transition-all shadow-xs"
            >
              <DollarSign className="h-4 w-4" />
              Simpan Pembayaran SPP
            </Button>
          </div>
        </form>
      </div>

      {/* CORE PAYMENT TABLE VIEW */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Tabel Administrasi SPP Santri</h3>
        <DataTable
          columns={columns}
          data={tableData}
          searchPlaceholder="Cari berdasarkan nama santri atau NISN..."
          searchKeys={['studentName', 'studentNisn']}
          emptyMessage="Tidak ada rekam jejak administrasi SPP ditemui."
        />
      </div>
    </div>
  );
};