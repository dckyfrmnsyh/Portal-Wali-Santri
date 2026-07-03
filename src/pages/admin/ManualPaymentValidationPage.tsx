import React, { useMemo, useState } from 'react';
import { Check, X, Landmark, AlertCircle, Eye, ClipboardSignature } from 'lucide-react';

import { Student } from '../../types/student';
import { Payment } from '../../types/payment';
import { SppBill } from '../../types/spp';

import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/formatCurrency';

interface ManualPaymentValidationPageProps {
  students: Student[];
  payments: Payment[];
  bills: SppBill[];
  onApprovePayment: (paymentId: string) => void;
  onRejectPayment: (paymentId: string, reason: string) => void;
}

const pickFirst = (obj: any, keys: string[]) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return undefined;
};

const isPdfUrl = (url: string) => url.toLowerCase().includes('.pdf');

export const ManualPaymentValidationPage: React.FC<ManualPaymentValidationPageProps> = ({
  students,
  payments,
  bills,
  onApprovePayment,
  onRejectPayment,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [adminNotes, setAdminNotes] = useState('');
  const [notesSuccess, setNotesSuccess] = useState('');

  const pendingPayments = useMemo(() => {
    const list = (payments as any[])
      .filter((p) => {
        const status = pickFirst(p, ['status']);
        return status === 'pending_validation';
      })
      .map((pay) => {
        // handle snake_case vs camelCase
        const studentId = pickFirst(pay, ['student_id', 'studentId']);
        const billId = pickFirst(pay, ['bill_id', 'billId']);

        const student = students.find((s) => s.id === studentId);
        const bill = bills.find((b) => b.id === billId);

        const receiptImage = pickFirst(pay, ['receipt_image', 'receiptImage']);

        return {
          // IDs
          id: pickFirst(pay, ['id']) ?? '',

          // table fields
          paymentDate: pickFirst(pay, ['payment_date', 'paymentDate']) ?? '',
          studentName: student ? student.name : 'Santri Tidak Diketahui',
          studentNisn: student ? student.nisn : '-',
          studentGrade: student ? student.grade : '-',
          billMonth: bill ? `${bill.month} ${bill.year}` : 'N/A',

          accountName: pickFirst(pay, ['account_name', 'accountName']) ?? '-',
          bankName: pickFirst(pay, ['bank_name', 'bankName']) ?? '-',
          accountNumber: pickFirst(pay, ['account_number', 'accountNumber']) ?? '-',

          amount: Number(pickFirst(pay, ['amount']) ?? 0),

          // key yang dipakai modal
          receiptImage: receiptImage ?? null,

          status: pickFirst(pay, ['status']) ?? '',
          referenceNumber: pickFirst(pay, ['reference_number', 'referenceNumber']) ?? '-',
          notes: pickFirst(pay, ['notes']) ?? '',

          // opsional tapi berguna kalau kamu mau tampilkan method
          method: pickFirst(pay, ['method']) ?? '',
        };
      });

    return list;
  }, [payments, students, bills]);

  const handleApprove = (paymentId: string, name: string) => {
    if (window.confirm(`Setujui dan sahkan transfer bank dari santri "${name}"?`)) {
      onApprovePayment(paymentId);
      alert('Pembayaran berhasil disetujui! Status tagihan SPP santri telah diperbarui secara otomatis.');
    }
  };

  const openRejectModal = (payment: any) => {
    setSelectedPayment(payment);
    setRejectReason('');
    setRejectError('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    if (!rejectReason.trim()) {
      setRejectError('Silakan masukkan alasan penolakan.');
      return;
    }

    onRejectPayment(selectedPayment.id, rejectReason.trim());
    setIsRejectModalOpen(false);
    setSelectedPayment(null);
    alert('Konfirmasi pembayaran telah ditolak. Status tagihan santri dipulihkan.');
  };

  const openReceiptModal = (payment: any) => {
    // Pastikan receiptImage terisi
    const receiptImage = payment.receiptImage ?? payment.receipt_image ?? null;

    setSelectedPayment({
      ...payment,
      receiptImage,
    });
    setIsReceiptModalOpen(true);
  };

  const openNotesModal = (payment: any) => {
    setSelectedPayment(payment);
    setAdminNotes(payment.notes || '');
    setNotesSuccess('');
    setIsNotesModalOpen(true);
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    selectedPayment.notes = adminNotes;

    const payIndex = (payments as any[]).findIndex((p) => p.id === selectedPayment.id);
    if (payIndex !== -1) {
      (payments as any[])[payIndex].notes = adminNotes;
    }

    setNotesSuccess('Catatan admin berhasil ditambahkan!');
    setTimeout(() => {
      setIsNotesModalOpen(false);
      setSelectedPayment(null);
    }, 1000);
  };

  const columns = [
    {
      key: 'paymentDate',
      header: 'Tanggal Konfirmasi',
      render: (row: any) => <span className="font-mono text-xs text-slate-600 font-semibold">{row.paymentDate}</span>,
    },
    {
      key: 'studentName',
      header: 'Nama Santri',
      render: (row: any) => <span className="font-bold text-brand-green-950 font-serif">{row.studentName}</span>,
    },
    {
      key: 'studentNisn',
      header: 'NISN',
      render: (row: any) => <span className="font-mono text-xs text-slate-500 font-bold">{row.studentNisn}</span>,
    },
    {
      key: 'studentGrade',
      header: 'Kelas',
      render: (row: any) => <span className="font-bold text-slate-700">{row.studentGrade}</span>,
    },
    {
      key: 'billMonth',
      header: 'Bulan SPP',
      render: (row: any) => (
        <span className="font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded text-xs">
          {row.billMonth}
        </span>
      ),
    },
    {
      key: 'accountName',
      header: 'Nama Pengirim',
      render: (row: any) => (
        <div className="text-xs">
          <p className="font-bold text-slate-700">{row.accountName}</p>
          <p className="text-[10px] text-slate-400 font-mono font-semibold">
            {row.bankName} - {row.accountNumber}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Nominal Transfer',
      render: (row: any) => <span className="font-mono font-black text-brand-green-900">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'receiptImage',
      header: 'Bukti Pembayaran',
      render: (row: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openReceiptModal(row)}
          className="text-xs font-bold text-brand-green-800 hover:text-white hover:bg-brand-green-900 border-brand-green-200/80 cursor-pointer flex items-center gap-1"
        >
          <Eye className="h-3 w-3" />
          Lihat Bukti
        </Button>
      ),
    },
    {
      key: 'status',
      header: 'Status Validasi',
      render: () => (
        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
          Menunggu Validasi
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="success"
            size="sm"
            onClick={() => handleApprove(row.id, row.studentName)}
            className="p-1.5 cursor-pointer flex items-center justify-center font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            title="Sahkan & Terima"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => openRejectModal(row)}
            className="p-1.5 cursor-pointer flex items-center justify-center font-bold bg-rose-600 hover:bg-rose-700 text-white"
            title="Tolak Bukti"
          >
            <X className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openNotesModal(row)}
            className="p-1.5 cursor-pointer flex items-center justify-center border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            title="Tambahkan Catatan"
          >
            <ClipboardSignature className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Validasi Pembayaran SPP</h2>
        <p className="text-xs text-slate-500 mt-0.5">Audit konfirmasi transfer bank, verifikasi bukti, dan sahkan tagihan menjadi lunas</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={pendingPayments}
          searchPlaceholder="Cari berdasarkan nama santri atau pengirim..."
          searchKeys={['studentName', 'accountName', 'bankName']}
          emptyMessage="Alhamdulillah! Tidak ada antrean konfirmasi pembayaran yang perlu divalidasi manual."
        />
      </div>

      {/* Reject Reason Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Tolak Pembayaran Transfer">
        {selectedPayment && (
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            {rejectError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{rejectError}</span>
              </div>
            )}

            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-950 font-medium">
              ⚠️ Penolakan pembayaran akan memulihkan status tagihan santri menjadi <strong>Belum Bayar</strong> kembali.
            </div>

            <p className="text-xs text-slate-500">
              Menolak pembayaran dari{' '}
              <strong className="text-slate-800 font-semibold">{selectedPayment.studentName}</strong> sebesar{' '}
              <strong className="text-slate-800 font-semibold">{formatCurrency(selectedPayment.amount)}</strong>.
            </p>

            <Input
              id="reject-reason"
              label="Alasan Penolakan"
              placeholder="Contoh: Bukti transfer tidak jelas / nominal tidak sesuai"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)} className="rounded-xl text-xs font-semibold">
                Batal
              </Button>
              <Button type="submit" variant="danger" className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl px-5 text-xs">
                Kirim Penolakan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} title="Tambahkan Catatan Pembayaran">
        {selectedPayment && (
          <form onSubmit={handleSaveNotes} className="space-y-4">
            {notesSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                {notesSuccess}
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-500">
              <p>
                Santri: <strong className="text-slate-700 font-bold">{selectedPayment.studentName}</strong>
              </p>
              <p>
                Jumlah:{' '}
                <strong className="text-slate-700 font-bold">{formatCurrency(selectedPayment.amount)}</strong>
              </p>
            </div>

            <Input
              id="admin-notes-field"
              label="Catatan Bendahara"
              placeholder="Tulis catatan penting..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              required
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsNotesModalOpen(false)} className="rounded-xl text-xs font-semibold">
                Batal
              </Button>
              <Button type="submit" variant="primary" className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl px-5 text-xs">
                Simpan Catatan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Bukti Transfer Pembayaran">
        {selectedPayment && (
          <div className="space-y-4">
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-900/5 aspect-4/3 flex items-center justify-center p-2">
              {selectedPayment.receiptImage ? (
                isPdfUrl(selectedPayment.receiptImage) ? (
                  <iframe
                    src={selectedPayment.receiptImage}
                    title="Bukti Transfer (PDF)"
                    className="w-full h-full rounded-lg bg-white"
                  />
                ) : (
                  <img
                    src={selectedPayment.receiptImage}
                    alt="Bukti Transfer"
                    className="max-h-64 object-contain rounded-lg shadow bg-white"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // kalau URL ternyata error, sembunyikan gambar agar tidak tampak broken
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Landmark className="h-12 w-12 mx-auto text-indigo-300" />
                  <p className="text-sm font-bold text-slate-700">Slip Bukti Transfer Bank</p>
                  <p className="text-xs text-slate-400">Bukti tidak tersedia untuk pembayaran ini</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-2">
              <p>
                <strong className="text-slate-700">Catatan Pengirim:</strong>{' '}
                {selectedPayment.notes || 'Tidak ada catatan pengirim.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)} className="rounded-xl px-5 text-xs font-semibold">
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};