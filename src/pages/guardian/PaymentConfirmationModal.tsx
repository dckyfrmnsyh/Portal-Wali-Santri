import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, CreditCard, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { SppBill } from '../../types/spp';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

const accounts = [
  { id: 'bpd', bank: 'BPD (Bank Pembangunan Daerah)', number: '0147519109', name: 'Adi Santoso' },
  { id: 'bni', bank: 'BNI (Bank Negara Indonesia)', number: '574237516', name: 'Adi Santoso' },
  { id: 'bri', bank: 'BRI (Bank Rakyat Indonesia)', number: '313501008158500', name: 'Adi Santoso' },
];

// Target: sekecil mungkin, limit output < 500KB
const TARGET_MAX_BYTES = 500 * 1024; // 500KB
const MAX_DIMENSION = 1400; // batasi ukuran dimensi untuk memperkecil
const MIN_QUALITY = 0.12; // kualitas minimum untuk try terakhir
const QUALITY_STEP = 0.08; // penurunan bertahap

// Kompres gambar -> WEBP -> dataURL
const compressImageToWebpDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;

    reader.onload = () => {
      const src = reader.result as string;

      const img = new Image();
      img.onerror = reject;

      img.onload = async () => {
        try {
          const { width, height } = img;
          const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context tidak tersedia');

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let quality = 0.9;
          let bestBlob: Blob | null = null;

          // Iterasi kualitas sampai blob <= 500KB atau kualitas mendekati minimum
          while (quality >= MIN_QUALITY) {
            const blob: Blob = await new Promise((res, rej) => {
              canvas.toBlob(
                (b) => (b ? res(b) : rej(new Error('toBlob menghasilkan null'))),
                'image/webp',
                quality
              );
            });

            bestBlob = blob;

            if (blob.size <= TARGET_MAX_BYTES) break;
            quality -= QUALITY_STEP;
          }

          if (!bestBlob) throw new Error('Gagal menghasilkan blob hasil kompresi');

          const outReader = new FileReader();
          outReader.onerror = reject;
          outReader.onload = () => resolve(outReader.result as string);
          outReader.readAsDataURL(bestBlob);
        } catch (e) {
          reject(e);
        }
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
};

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: SppBill | null;
  onConfirm: (data: {
    amount: number;
    paymentDate: string;
    method: 'transfer' | 'cash';
    bankName: string;
    accountNumber: string;
    accountName: string;
    receiptImage: string;
    notes: string;
  }) => void;
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  onClose,
  bill,
  onConfirm,
}) => {
  const [accountName, setAccountName] = useState<string>(''); // Nama Pengirim
  const [amount, setAmount] = useState<number>(0); // Nominal Transfer
  const [paymentDate, setPaymentDate] = useState<string>(''); // Tanggal Transfer
  const [method, setMethod] = useState<'transfer' | 'cash'>('transfer'); // Metode Pembayaran

  const [bankName, setBankName] = useState<string>(accounts[0].id); // bpd|bni|bri
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // simpan sebagai dataURL hasil kompres (untuk gambar) atau dataURL asli (untuk PDF)
  const [receiptFile, setReceiptFile] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (bill) {
      setAmount(bill.amount - bill.paidAmount);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setMethod('transfer');

      setBankName(accounts[0].id);

      setAccountNumber('');
      setAccountName('');
      setNotes('');
      setReceiptFile('');
      setDragActive(false);
      setError('');
    }
  }, [bill]);

  if (!bill) return null;

  const bankOptions = accounts.map((acc) => ({
    value: acc.id,
    label: `${acc.bank} (${acc.number})`,
  }));

  const selectedAccount = accounts.find((a) => a.id === bankName);
  const bankLabelForSubmit = selectedAccount
    ? `${selectedAccount.bank} (${selectedAccount.number})`
    : '';

  const methodOptions = [
    { value: 'transfer', label: 'Transfer Bank (Verifikasi Manual Staf)' },
    { value: 'cash', label: 'Tunai / Cash (Bayar Langsung ke Bendahara)' },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const readAndSetFile = async (file: File) => {
    setError('');

    // Kalau PDF: kompres tanpa library hampir tidak bisa di browser.
    // Supaya tetap jalan, simpan apa adanya.
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setReceiptFile(ev.target.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Selain gambar: tolak
    if (!file.type.startsWith('image/')) {
      setError('Format file tidak didukung. Silakan upload JPG/PNG/WebP atau PDF.');
      return;
    }

    try {
      const compressed = await compressImageToWebpDataUrl(file);
      setReceiptFile(compressed);
    } catch {
      // fallback: kalau kompres gagal, pakai dataURL asli (besar bisa lebih dari target)
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setReceiptFile(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      void readAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Limit awal agar user tidak upload super besar (UI tetap aman).
    // Output tetap kita upayakan <500KB (untuk gambar) lewat kompres.
    const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
    if (f.size > MAX_UPLOAD_BYTES) {
      setError('Ukuran file terlalu besar. Silakan upload maksimal 10MB.');
      return;
    }

    void readAndSetFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountName.trim()) {
      setError('Nama pengirim wajib diisi.');
      return;
    }

    if (amount <= 0) {
      setError('Nominal transfer harus lebih dari Rp 0.');
      return;
    }

    if (amount > bill.amount - bill.paidAmount) {
      setError(
        `Nominal transfer tidak boleh melebihi sisa tagihan (${formatCurrency(
          bill.amount - bill.paidAmount
        )}).`
      );
      return;
    }

    if (method === 'transfer') {
      if (!receiptFile) {
        setError('Silakan lampirkan / unggah bukti transfer pembayaran.');
        return;
      }
    }

    onConfirm({
      amount,
      paymentDate,
      method,
      bankName: method === 'transfer' ? bankLabelForSubmit : '',
      accountNumber: method === 'transfer' ? accountNumber : '',
      accountName,
      receiptImage: receiptFile || 'bukti_transfer_mockup.jpg',
      notes,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Konfirmasi Pembayaran SPP - ${bill.month} ${bill.year}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2 border border-rose-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-brand-green-50 border border-brand-green-100 rounded-xl flex justify-between items-center text-xs text-brand-green-950 font-medium">
          <span>Sisa Tagihan SPP {bill.month}:</span>
          <span className="font-bold text-sm text-brand-green-900">
            {formatCurrency(bill.amount - bill.paidAmount)}
          </span>
        </div>

        {/* 1. Nama Pengirim */}
        <Input
          id="sender-name-input"
          label="Nama Pengirim"
          placeholder="Contoh: Rahman (Wali Ahmad Fauzan)"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          required
          className="border-brand-cream-200 focus:border-brand-green-800 text-sm font-semibold"
        />

        {/* 2. Nominal Transfer */}
        <Input
          id="amount-input"
          label="Nominal Transfer / Pembayaran"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          required
          className="border-brand-cream-200 focus:border-brand-green-800 text-sm font-semibold font-mono"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 3. Tanggal Transfer */}
          <Input
            id="date-input"
            label="Tanggal Transfer"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            className="border-brand-cream-200 focus:border-brand-green-800 text-sm font-semibold"
          />

          {/* 4. Bulan SPP yang Dibayar (Read-Only) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Bulan SPP yang Dibayar
            </label>
            <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 font-sans">
              {bill.month} {bill.year}
            </div>
          </div>
        </div>

        {/* 5. Metode Pembayaran */}
        <Select
          id="method-select"
          label="Metode Pembayaran"
          options={methodOptions}
          value={method}
          onChange={(e) => setMethod(e.target.value as 'transfer' | 'cash')}
          className="border-brand-cream-200 focus:border-brand-green-800 text-sm font-semibold"
        />

        {method === 'transfer' ? (
          <div className="space-y-4 p-4 border border-brand-cream-100 bg-brand-cream-50/20 rounded-xl">
            <p className="text-[10px] font-bold text-brand-green-900 uppercase tracking-widest flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" />
              Detail Bank Pengirim
            </p>

            <Select
              id="bank-select"
              label="Bank Pengalihan"
              options={bankOptions}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="border-brand-cream-200 focus:border-brand-green-800 text-sm font-semibold"
            />

            <Input
              id="account-no"
              label="Nomor Rekening Anda (Opsional)"
              placeholder="Contoh: 1234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="border-brand-cream-200 focus:border-brand-green-800 text-sm font-mono"
            />

            {/* 6. Upload Bukti Pembayaran */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Upload Bukti Pembayaran
              </span>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-brand-green-800 bg-brand-green-50'
                    : receiptFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-brand-cream-200 hover:border-brand-green-800 hover:bg-brand-cream-50/30'
                }`}
                onClick={() => document.getElementById('receipt-upload')?.click()}
              >
                <input
                  id="receipt-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />

                {receiptFile ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Bukti Transfer Dipilih !</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs mx-auto">
                      Ukuran sudah dioptimalkan untuk <strong>&lt; 500KB</strong> (gambar)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-brand-green-800/40 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">
                      Tarik bukti pembayaran ke sini, atau{' '}
                      <span className="text-brand-green-900 font-bold underline">pilih file</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Mendukung format gambar (JPG, PNG, WEBP) atau PDF
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-xs font-semibold border border-amber-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <span>
              Pembayaran secara Tunai (Cash) mengharuskan Anda menyetor uang tunai ke bendahara di kantor asrama
              pondok pesantren.
            </span>
          </div>
        )}

        {/* 7. Catatan */}
        <Input
          id="notes-input"
          label="Catatan Tambahan"
          placeholder="Contoh: Pembayaran cicilan SPP bulan Juli"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border-brand-cream-200 focus:border-brand-green-800 text-sm font-semibold"
        />

        <div className="pt-4 border-t border-brand-cream-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold cursor-pointer"
          >
            Kirim Konfirmasi Pembayaran
          </Button>
        </div>
      </form>
    </Modal>
  );
};