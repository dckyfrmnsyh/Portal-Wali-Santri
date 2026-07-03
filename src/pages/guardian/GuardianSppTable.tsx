import React from 'react';
import { Eye, CreditCard, CheckCircle } from 'lucide-react';
import { SppBill } from '../../types/spp';
import { formatCurrency } from '../../utils/formatCurrency';
import { getSppStatusLabel, getSppStatusColor } from '../../utils/statusHelper';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface GuardianSppTableProps {
  bills: SppBill[];
  academicYear?: string;
  onOpenInstallments: (bill: SppBill) => void;
  onOpenConfirmPayment: (bill: SppBill) => void;
}

export const GuardianSppTable: React.FC<GuardianSppTableProps> = ({
  bills,
  academicYear = '2026/2027',
  onOpenInstallments,
  onOpenConfirmPayment,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-brand-cream-200 shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-brand-cream-100 bg-brand-cream-50/50">
        <h3 className="font-bold text-brand-green-950 font-serif text-sm">Tabel Tagihan SPP Bulanan</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Daftar iuran wajib per bulan serta log realisasi cicilan pembayaran Anda
        </p>
      </div>

      {/* Desktop/Tablet: Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px] lg:min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-4">Bulan</th>
                <th className="px-6 py-4">Tahun Ajaran</th>
                <th className="px-6 py-4 text-right">Nominal SPP</th>
                <th className="px-6 py-4 text-right">Jumlah Dibayar</th>
                <th className="px-6 py-4 text-right">Sisa Tagihan</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Jatuh Tempo</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-cream-100 text-xs text-slate-700">
              {bills.length > 0 ? (
                bills.map((bill) => {
                  const remaining = bill.amount - bill.paidAmount;
                  const statusLabel = getSppStatusLabel(bill.status);
                  const statusColor = getSppStatusColor(bill.status);

                  return (
                    <tr key={bill.id} className="hover:bg-brand-cream-50/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-brand-green-950">
                        {bill.month} {bill.year}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-600">{academicYear}</td>

                      <td className="px-6 py-4 text-right font-bold text-slate-800">
                        {formatCurrency(bill.amount)}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {formatCurrency(bill.paidAmount)}
                      </td>

                      <td className="px-6 py-4 text-right font-black text-rose-600">
                        {remaining > 0 ? formatCurrency(remaining) : 'Lunas'}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <StatusBadge label={statusLabel} colorClass={statusColor} />
                      </td>

                      <td className="px-6 py-4 font-mono font-medium text-slate-500">{bill.dueDate}</td>

                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 justify-center">
                          <button
                            onClick={() => onOpenInstallments(bill)}
                            className="px-3 py-1.5 rounded-lg border border-brand-cream-200 bg-white hover:bg-brand-cream-50 text-brand-green-900 font-bold flex items-center gap-1 hover:border-brand-green-800 transition-all text-[11px] cursor-pointer"
                            title="Lihat rincian cicilan mingguan"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Lihat Detail</span>
                          </button>

                          {bill.status !== 'paid' ? (
                            <button
                              onClick={() => onOpenConfirmPayment(bill)}
                              className="px-3 py-1.5 rounded-lg bg-brand-green-800 hover:bg-brand-green-900 text-white font-bold flex items-center gap-1 transition-all text-[11px] cursor-pointer"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Konfirmasi</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-[11px]">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Lunas
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400 font-medium">
                    Tidak ada data tagihan SPP yang terdaftar untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden px-4 py-4 space-y-3.5">
        {bills.length > 0 ? (
          bills.map((bill) => {
            const remaining = bill.amount - bill.paidAmount;
            const statusLabel = getSppStatusLabel(bill.status);
            const statusColor = getSppStatusColor(bill.status);

            return (
              <div
                key={bill.id}
                className="border border-brand-cream-100 rounded-2xl bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-green-950 text-sm">
                      {bill.month} {bill.year}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tahun Ajaran: {academicYear}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Jatuh Tempo: {bill.dueDate}
                    </p>
                  </div>

                  <StatusBadge label={statusLabel} colorClass={statusColor} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="text-slate-500">Nominal SPP</p>
                    <p className="font-bold text-slate-800">{formatCurrency(bill.amount)}</p>
                  </div>

                  <div>
                    <p className="text-slate-500">Jumlah Dibayar</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(bill.paidAmount)}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-slate-500">Sisa Tagihan</p>
                    <p className="font-black text-rose-600">
                      {remaining > 0 ? formatCurrency(remaining) : 'Lunas'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => onOpenInstallments(bill)}
                    className="px-3 py-2 rounded-lg border border-brand-cream-200 bg-white hover:bg-brand-cream-50 text-brand-green-900 font-bold flex items-center gap-2 transition-all text-[11px] cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Lihat Detail</span>
                  </button>

                  {bill.status !== 'paid' ? (
                    <button
                      onClick={() => onOpenConfirmPayment(bill)}
                      className="px-3 py-2 rounded-lg bg-brand-green-800 hover:bg-brand-green-900 text-white font-bold flex items-center gap-2 transition-all text-[11px] cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Konfirmasi</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 text-[11px]">
                      <CheckCircle className="h-4 w-4" />
                      Lunas
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-400 text-sm py-10 font-medium">
            Tidak ada data tagihan SPP yang terdaftar untuk periode ini.
          </div>
        )}
      </div>
    </div>
  );
};