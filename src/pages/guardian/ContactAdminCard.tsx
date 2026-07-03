import React from 'react';
import { PhoneCall, MessageCircle, Clock, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';

interface ContactAdminCardProps {
  studentName?: string;
  academicYear?: string;
}

export const ContactAdminCard: React.FC<ContactAdminCardProps> = ({
  studentName = '[Nama Santri]',
  academicYear = '2026/2027',
}) => {
  const waNumber = '6282184509719'; // clean numeric value
  const message = `Assalamu’alaikum, saya wali dari santri ${studentName}. Saya ingin menanyakan tagihan SPP tahun ajaran ${academicYear}.`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  return (
    <Card className="border border-brand-cream-200 bg-white shadow-xs min-w-0">
      <div className="p-4 sm:p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <PhoneCall className="h-5 w-5 text-brand-green-800 shrink-0" />
          <h4 className="font-bold text-brand-green-950 font-serif text-sm">Kontak Admin Keuangan</h4>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Jika ada ketidaksesuaian nominal tagihan, sisa saldo, atau kendala dalam konfirmasi pembayaran,
          silakan hubungi asisten bendahara pondok.
        </p>

        {/* Info box */}
        <div className="space-y-2.5 pt-1 text-xs">
          <div className="flex items-start gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <Clock className="h-4 w-4 text-brand-green-800 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold">Jam Layanan Operasional</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                Senin - Sabtu: 08:00 - 15:00 WITA
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <ShieldCheck className="h-4 w-4 text-brand-green-800 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold">WhatsApp Resmi Bendahara</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 break-all">
                +62 821-8450-9719 (Ustadz Adi Santoso)
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full font-bold py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white
                       flex items-center justify-center gap-2 rounded-lg text-xs transition-all shadow-xs cursor-pointer
                       text-center"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Hubungi Admin via WhatsApp</span>
          </a>
        </div>
      </div>
    </Card>
  );
};