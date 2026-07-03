import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { SppBill } from '../../types/spp';
import { formatCurrency } from '../../utils/formatCurrency';
import { getSppStatusLabel, getSppStatusColor } from '../../utils/statusHelper';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface GuardianYearlyReportProps {
  bills: SppBill[];
  academicYear?: string;
}

export const GuardianYearlyReport: React.FC<GuardianYearlyReportProps> = ({
  bills,
  academicYear = '2026/2027',
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadMockup = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('File PDF Rekapitulasi SPP Tahun Ajaran ' + academicYear + ' sedang dipersiapkan dan diunduh secara otomatis!');
    }, 1500);
  };

  const getLastValidationDate = (bill: SppBill) => {
    if (bill.installments && bill.installments.length > 0) {
      return bill.installments[bill.installments.length - 1].paymentDate;
    }
    return '-';
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-cream-200 shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-brand-cream-100 bg-brand-cream-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-brand-green-950 font-serif text-sm">Rekap SPP Per Tahun Ajaran</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Ringkasan transaksi historis Anda untuk Tahun Ajaran {academicYear}
          </p>
        </div>

        <button
          onClick={handleDownloadMockup}
          className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            downloading
              ? 'bg-brand-cream-50 text-brand-green-950 border-brand-cream-200'
              : 'bg-brand-green-900 text-white hover:bg-brand-green-800 border-brand-green-950 shadow-xs'
          }`}
        >
          <FileDown className={`h-4 w-4 ${downloading ? 'animate-bounce' : ''}`} />
          <span>{downloading ? 'Mempersiapkan PDF...' : 'Download Rekap PDF'}</span>
        </button>
      </div>

      {/* Desktop/Tablet */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px] lg:min-w-full">
            <thead>
              <tr className="bg-brand-cream-50/30 border-b border-brand-cream-100 text-[10px] font-bold text-brand-green-950 uppercase tracking-wider">
                <th className="px-6 py-4">Bulan</th>
                <th className="px-6 py-4 text-right">Nominal Tagihan</th>
                <th className="px-6 py-4 text-right">Total Dibayar</th>
                <th className="px-6 py-4 text-right">Sisa</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Tanggal Validasi Terakhir</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-cream-100 text-xs text-slate-700">
              {bills.length > 0 ? (
                bills.map((bill) => {
                  const sisa = bill.amount - bill.paidAmount;
                  const statusLabel = getSppStatusLabel(bill.status);
                  const statusColor = getSppStatusColor(bill.status);
                  const lastValidationDate = getLastValidationDate(bill);

                  return (
                    <tr key={`yearly-${bill.id}`} className="hover:bg-brand-cream-50/10">
                      <td className="px-6 py-3.5 font-bold text-brand-green-950">
                        {bill.month} {bill.year}
                      </td>

                      <td className="px-6 py-3.5 text-right font-bold text-slate-700">
                        {formatCurrency(bill.amount)}
                      </td>

                      <td className="px-6 py-3.5 text-right font-bold text-emerald-600">
                        {formatCurrency(bill.paidAmount)}
                      </td>

                      <td className="px-6 py-3.5 text-right font-black text-rose-600">
                        {sisa > 0 ? formatCurrency(sisa) : 'Lunas'}
                      </td>

                      <td className="px-6 py-3.5 text-center">
                        <StatusBadge label={statusLabel} colorClass={statusColor} />
                      </td>

                      <td className="px-6 py-3.5 font-mono text-slate-500 font-semibold">
                        {lastValidationDate}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">
                    Belum ada rekap tagihan terdaftar untuk tahun ajaran ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden px-4 py-4 space-y-3.5">
        {bills.length > 0 ? (
          bills.map((bill) => {
            const sisa = bill.amount - bill.paidAmount;
            const statusLabel = getSppStatusLabel(bill.status);
            const statusColor = getSppStatusColor(bill.status);
            const lastValidationDate = getLastValidationDate(bill);

            return (
              <div
                key={`yearly-mobile-${bill.id}`}
                className="border border-brand-cream-100 rounded-2xl bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-green-950 text-sm">
                      {bill.month} {bill.year}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Validasi terakhir: {lastValidationDate}
                    </p>
                  </div>
                  <StatusBadge label={statusLabel} colorClass={statusColor} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="text-slate-500">Nominal</p>
                    <p className="font-bold text-slate-700">{formatCurrency(bill.amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Dibayar</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(bill.paidAmount)}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-slate-500">Sisa</p>
                    <p className="font-black text-rose-600">
                      {sisa > 0 ? formatCurrency(sisa) : 'Lunas'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-400 text-sm py-10 font-medium">
            Belum ada rekap tagihan terdaftar untuk tahun ajaran ini.
          </div>
        )}
      </div>
    </div>
  );
};