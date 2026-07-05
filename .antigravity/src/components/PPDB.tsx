import React, { useState } from 'react';
import { CheckCircle2, Phone, HelpCircle, ChevronDown, CheckCircle } from 'lucide-react';
import { siteConfig } from '../data/siteData';

export const PPDB: React.FC = () => {
  // PPDB Form State
  const [studentName, setStudentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [programOption, setProgramOption] = useState('Pendidikan Keagamaan');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // FAQ State (tracking open indices)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !phoneNumber) return;
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setStudentName('');
    setPhoneNumber('');
    setProgramOption('Pendidikan Keagamaan');
    setIsSubmitted(false);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const faqItems = [
    {
      q: 'Kapan pendaftaran santri baru (PPDB) dibuka?',
      a: 'Pendaftaran santri baru (PPDB) di Pondok Pesantren Khairaat dibuka setiap tahun mulai bulan Januari hingga akhir bulan Juni untuk gelombang utama.'
    },
    {
      q: 'Apakah menerima santri pindahan?',
      a: 'Ya, kami menerima santri pindahan untuk jenjang SMP maupun SMA pada setiap pergantian semester ganjil, setelah melengkapi berkas administrasi dan lolos seleksi kelayakan.'
    },
    {
      q: 'Bagaimana rincian biaya asrama dan konsumsi harian santri?',
      a: 'Seluruh biaya asrama dan katering makan santri dikelola secara mandiri dan transparan. Rincian dapat dicek berkala oleh wali santri terdaftar melalui Portal Wali Santri digital.'
    }
  ];

  return (
    <section id="ppdb" className="py-20 sm:py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-600 font-bold text-xs tracking-wider uppercase bg-amber-100 px-3 py-1 rounded-full">
            Pendaftaran Baru
          </span>
          <h2 className="text-3xl font-black text-emerald-950 mt-3 font-serif">
            Penerimaan Santri Baru (PPDB)
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Info & Form Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Eligibility Requirements (Left Column) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-3xs">
              <h3 className="text-xl font-bold text-emerald-950 mb-6 flex items-center space-x-2.5 font-serif">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
                <span>Syarat Pendaftaran</span>
              </h3>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 font-medium">
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-emerald-200 text-emerald-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                  <span>Mengisi formulir pengajuan pendaftaran secara online.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-emerald-200 text-emerald-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                  <span>Fotokopi Kartu Keluarga (KK) & Akta Kelahiran calon santri.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-emerald-200 text-emerald-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                  <span>Pas foto terbaru ukuran 3x4 berwarna (sebanyak 3 lembar).</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-emerald-200 text-emerald-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">4</div>
                  <span>Surat keterangan sehat dan bebas narkoba dari klinik/puskesmas.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-6 py-4 rounded-xl text-center text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm"
              >
                <Phone className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Hubungi Panitia PPDB (WA)</span>
              </a>
            </div>
          </div>

          {/* Initial Submission Form (Right Column) */}
          <div className="lg:col-span-5 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-emerald-950 font-serif mb-1">
              Formulir Pendaftaran Awal
            </h3>
            <p className="text-slate-500 text-[11px] sm:text-xs mb-6">
              Isi data di bawah untuk pengajuan awal calon santri Khairaat.
            </p>

            {isSubmitted ? (
              <div id="ppdb-success" className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-xl text-center space-y-4 animate-fadeIn">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <div>
                  <h4 className="font-bold text-base">Registrasi Berhasil!</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Registrasi Berhasil! Panitia akan segera menghubungi Anda via WhatsApp dalam 1x24 jam ke nomor {phoneNumber}.
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="mt-2 bg-emerald-900 hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                >
                  Daftar Lagi
                </button>
              </div>
            ) : (
              <form id="ppdb-form" onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Nama Calon Santri *
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                    placeholder="Masukkan nama lengkap calon santri"
                  />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Nomor HP / WhatsApp *
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                    placeholder="Contoh: 0812345678"
                  />
                </div>
                <div>
                  <label htmlFor="reg-program" className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Program Pilihan
                  </label>
                  <select
                    id="reg-program"
                    value={programOption}
                    onChange={(e) => setProgramOption(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-medium text-slate-700"
                  >
                    <option value="Pendidikan Keagamaan">Pendidikan Keagamaan</option>
                    <option value="Pendidikan Umum (MTs/MA)">Pendidikan Umum (MTs/MA)</option>
                    <option value="Tahfidz Al-Qur’an">Tahfidz Al-Qur’an</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-transform duration-300 transform hover:scale-[1.01]"
                >
                  Kirim Pengajuan
                </button>
              </form>
            )}
          </div>
        </div>
        
        {/* Accordion FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-emerald-950 text-center mb-8 flex items-center justify-center space-x-2 font-serif">
            <HelpCircle className="w-6 h-6 text-amber-500 shrink-0" />
            <span>Pertanyaan Umum (FAQ)</span>
          </h3>
          
          <div className="space-y-4">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shadow-2xs">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-4 sm:p-5 font-bold text-xs sm:text-sm text-emerald-950 flex justify-between items-center transition-colors hover:bg-slate-100/50 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transform transition-transform duration-350 ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-slate-600 text-xs sm:text-sm border-t border-slate-200/40 animate-fadeIn leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </section>
  );
};
