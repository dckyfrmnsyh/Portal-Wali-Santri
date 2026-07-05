import React from 'react';
import { Coins, CheckCircle2, CreditCard, AlertCircle, Calendar } from 'lucide-react';
import { SppBill } from '../../types/spp';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

interface GuardianSppSummaryProps {
  bills: SppBill[];
}

export const GuardianSppSummary: React.FC<GuardianSppSummaryProps> = ({ bills }) => {
  // Calculations
  const totalTagihan = bills.reduce((acc, b) => acc + b.amount, 0);
  const totalDibayar = bills.reduce((acc, b) => acc + b.paidAmount, 0);
  const totalCicilanMasuk = bills.reduce(
    (acc, b) => acc + (b.installments?.reduce((sum, inst) => sum + inst.amount, 0) || 0),
    0
  );
  const sisaTagihan = totalTagihan - totalDibayar;

  // Status Pembayaran
  let statusPembayaran: 'Lunas' | 'Belum Lunas' | 'Cicilan Berjalan' | 'Menunggak' = 'Belum Lunas';
  const today = new Date();

  const hasUnpaidPastDue = bills.some(
    (b) => (b.status === 'unpaid' || b.status === 'partial') && new Date(b.dueDate) < today
  );

  if (sisaTagihan === 0 && totalTagihan > 0) {
    statusPembayaran = 'Lunas';
  } else if (hasUnpaidPastDue) {
    statusPembayaran = 'Menunggak';
  } else if (totalDibayar > 0) {
    statusPembayaran = 'Cicilan Berjalan';
  } else {
    statusPembayaran = 'Belum Lunas';
  }

  // Get status color & description
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Lunas':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Lunas Administrasi',
        };
      case 'Menunggak':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Menunggak / Lewat Tempo',
        };
      case 'Cicilan Berjalan':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Cicilan Berjalan',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-400',
          label: 'Belum Lunas',
        };
    }
  };

  const statusStyle = getStatusDisplay(statusPembayaran);

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-brand-green-950 font-serif">Ringkasan Administrasi SPP</h3>
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${statusStyle.bg}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${statusStyle.dot} animate-pulse`} />
          <span>Status Keuangan: {statusStyle.label}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tagihan Tahun Ajaran */}
        <Card className="p-5 border border-brand-cream-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-slate-50 text-slate-700 rounded-xl w-fit border border-slate-100">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan Tahun Ajaran</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(totalTagihan)}</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 font-semibold">Total iuran wajib per tahun ajaran</p>
        </Card>

        {/* Card 2: Total Dibayar */}
        <Card className="p-5 border border-brand-cream-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl w-fit border border-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Dibayar (Selesai)</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totalDibayar)}</p>
            </div>
          </div>
          <p className="text-[10px] text-emerald-600/80 mt-3 font-semibold">Telah divalidasi oleh bendahara</p>
        </Card>

        {/* Card 3: Total Cicilan Masuk */}
        <Card className="p-5 border border-brand-cream-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-brand-green-50 text-brand-green-800 rounded-xl w-fit border border-brand-green-100">
              <CreditCard className="h-5 w-5 text-brand-green-700" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">Total Cicilan Terdaftar</p>
              <p className="text-xl font-bold text-brand-green-950 mt-1">{formatCurrency(totalCicilanMasuk)}</p>
            </div>
          </div>
          <p className="text-[10px] text-brand-green-700 mt-3 font-semibold">Termasuk cicilan parsial berjalan</p>
        </Card>

        {/* Card 4: Sisa Tagihan */}
        <Card className="p-5 border border-brand-cream-200 bg-white shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl w-fit border border-rose-100">
              <AlertCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Sisa Tagihan SPP</p>
              <p className="text-xl font-bold text-rose-700 mt-1">{formatCurrency(sisaTagihan)}</p>
            </div>
          </div>
          <p className="text-[10px] text-rose-600 mt-3 font-semibold">Tunggakan yang harus dilunasi</p>
        </Card>
      </div>
    </div>
  );
};
