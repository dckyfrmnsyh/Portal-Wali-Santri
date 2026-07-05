import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { SppBill } from '../../types/spp';
import { formatCurrency } from '../../utils/formatCurrency';
import { Check, Calendar, AlertCircle } from 'lucide-react';

interface InstallmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: SppBill | null;
}

export const InstallmentDetailModal: React.FC<InstallmentDetailModalProps> = ({
  isOpen,
  onClose,
  bill,
}) => {
  if (!bill) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Riwayat & Cicilan Pembayaran - ${bill.month} ${bill.year}`}>
      <div className="space-y-6">
        <div className="bg-brand-cream-50 p-4 rounded-xl border border-brand-cream-100 flex justify-between items-center text-xs">
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider">Total Tagihan SPP</p>
            <p className="text-lg font-black text-brand-green-950 mt-1">{formatCurrency(bill.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 font-bold uppercase tracking-wider font-sans">Sudah Dibayar</p>
            <p className="text-lg font-black text-emerald-700 mt-1">{formatCurrency(bill.paidAmount)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-brand-green-950 font-serif uppercase tracking-wider">Tabel Pelacakan Cicilan Mingguan</h4>
          
          {/* Progress Bar */}
          <div className="bg-slate-100 h-2.5 w-full rounded-full overflow-hidden relative border border-slate-200">
            <div 
              className="bg-emerald-600 h-full transition-all duration-500 rounded-full" 
              style={{ width: `${Math.min(100, (bill.paidAmount / bill.amount) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono">
            <span>Sisa Cicilan: {formatCurrency(bill.amount - bill.paidAmount)}</span>
            <span>Progress: {Math.round((bill.paidAmount / bill.amount) * 100)}%</span>
          </div>

          <div className="overflow-x-auto border border-brand-cream-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-cream-50/50 border-b border-brand-cream-100 text-[10px] font-bold text-brand-green-900 uppercase tracking-wider">
                  <th className="px-4 py-3">Minggu Ke-</th>
                  <th className="px-4 py-3">Target Jatuh Tempo</th>
                  <th className="px-4 py-3 text-right">Nominal Target</th>
                  <th className="px-4 py-3 text-center">Status Cicilan</th>
                  <th className="px-4 py-3 text-center">Pengingat Mingguan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream-100">
                {[1, 2, 3, 4].map((weekNum) => {
                  const weeklyTarget = bill.amount / 4;
                  const threshold = weeklyTarget * weekNum;
                  const previousThreshold = weeklyTarget * (weekNum - 1);
                  
                  // Calculate status
                  let statusLabel = 'Belum Dibayar';
                  let statusBadge = 'bg-rose-50 text-rose-700 border-rose-100';
                  
                  if (bill.paidAmount >= threshold) {
                    statusLabel = 'Lunas';
                    statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  } else if (bill.paidAmount > previousThreshold) {
                    statusLabel = 'Dibayar Sebagian';
                    statusBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                  }

                  // Calculate mock due date based on month context
                  const dueDay = weekNum === 1 ? '07' : weekNum === 2 ? '14' : weekNum === 3 ? '21' : '28';
                  const mockDueDate = `${dueDay} ${bill.month} ${bill.year}`;

                  const handleSendReminder = () => {
                    const message = `Halo Bapak/Ibu Wali Santri, ini adalah pengingat mingguan otomatis dari Pondok Pesantren Khairaat Tana Tidung. SPP Cicilan Minggu Ke-${weekNum} (${formatCurrency(weeklyTarget)}) jatuh tempo pada tanggal ${mockDueDate}. Status saat ini: ${statusLabel}. Mohon lakukan pembayaran melalui aplikasi portal wali santri. Terima kasih.`;
                    alert(`📲 PENGINGAT DIKIRIM (WhatsApp Simulasi):\n\n${message}`);
                  };

                  return (
                    <tr key={`week-tracker-${weekNum}`} className="hover:bg-brand-cream-50/10">
                      <td className="px-4 py-3.5 font-bold text-brand-green-950">
                        Minggu Ke-{weekNum}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600 font-mono">
                        {mockDueDate}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                        {formatCurrency(weeklyTarget)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {/* <button
                          onClick={handleSendReminder}
                          className="px-2.5 py-1 text-[10px] font-bold bg-brand-green-900 text-white rounded-lg hover:bg-brand-green-800 transition-colors shadow-2xs cursor-pointer"
                        >
                          Kirim Reminder WA
                        </button> */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {bill.status === 'paid' ? (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Tagihan SPP bulan ini telah lunas disahkan sepenuhnya oleh tata usaha pondok pesantren.</span>
          </div>
        ) : (
          <div className="p-3 bg-brand-cream-50 text-brand-green-950 rounded-xl text-xs font-medium flex items-center gap-2 border border-brand-cream-100">
            <AlertCircle className="h-4 w-4 shrink-0 text-brand-gold-600" />
            <span>Anda masih memiliki sisa tunggakan sebesar {formatCurrency(bill.amount - bill.paidAmount)}.</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
