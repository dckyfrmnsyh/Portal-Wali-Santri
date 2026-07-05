import React, { useState } from 'react';
import { Copy, Check, Landmark } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const BankAccountCard: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const accounts = [
    { id: 'bpd', bank: 'BPD (Bank Pembangunan Daerah)', number: '0147519109', name: 'Adi Santoso' },
    { id: 'bni', bank: 'BNI (Bank Negara Indonesia)', number: '574237516', name: 'Adi Santoso' },
    { id: 'bri', bank: 'BRI (Bank Rakyat Indonesia)', number: '313501008158500', name: 'Adi Santoso' },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="border border-brand-cream-200 bg-white shadow-xs min-w-0">
      <div className="space-y-4 p-4 sm:p-5 md:p-6">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-brand-green-800 shrink-0" />
          <h4 className="font-bold text-brand-green-950 font-serif text-sm">
            Rekening Resmi Pondok Pesantren
          </h4>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Silakan lakukan transfer pembayaran SPP/Katering ke salah satu rekening resmi yayasan berikut
          sebelum mengunggah konfirmasi bukti transfer.
        </p>

        <div className="space-y-3.5 pt-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3.5 bg-brand-cream-50 rounded-xl border border-brand-cream-100
                         flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
                         group hover:bg-brand-cream-100/50 transition-colors"
            >
              <div className="space-y-1">
                <span className="inline-block text-[9px] font-black text-brand-green-900 bg-brand-green-50 border border-brand-green-100 px-1.5 py-0.5 rounded-md uppercase">
                  {acc.bank}
                </span>

                <p className="text-base sm:text-lg font-mono font-bold text-brand-green-950 tracking-wider break-all">
                  {acc.number}
                </p>

                <p className="text-[10px] font-semibold text-brand-gold-600 uppercase tracking-wide">
                  a/n {acc.name}
                </p>
              </div>

              <button
                onClick={() => handleCopy(acc.id, acc.number)}
                className="self-start sm:self-auto p-2 rounded-lg border border-slate-200 bg-white
                           hover:bg-brand-cream-50 text-slate-400 hover:text-brand-green-900
                           transition-colors shadow-xs cursor-pointer"
                title="Salin nomor rekening"
                aria-label={`Salin nomor rekening ${acc.number}`}
              >
                {copiedId === acc.id ? (
                  <Check className="h-4 w-4 text-brand-green-700" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400 group-hover:text-brand-green-900 transition-colors" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Catatan Konfirmasi Pembayaran */}
        <div className="mt-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-1.5">
          <p className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex flex-wrap items-center gap-2">
            <span>📲 Konfirmasi WA:</span>
            <span className="font-mono text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
              0821-8450-9719
            </span>
            <span className="text-slate-600 font-bold">(Ustadz Adi Santoso)</span>
          </p>

          <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wide leading-relaxed">
            ⚠️ MOHON SERTAKAN NAMA &amp; KELAS SAAT MELAKUKAN TRANSFER/KONFIRMASI
          </p>

          <p className="text-[9px] text-emerald-900/60 font-semibold text-center pt-1 border-t border-amber-200/40">
            PONPES ALKHAIRAAT (SMP &amp; SMA) • Semoga Allah meluaskan rezeki bapak/ibu sekalian, aamiin.
          </p>
        </div>
      </div>
    </Card>
  );
};