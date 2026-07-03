import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { siteConfig } from '../data/siteData';

export const Contact: React.FC = () => {
  return (
    <section id="kontak" className="py-20 sm:py-24 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-600 font-bold text-xs tracking-wider uppercase bg-amber-100 px-3 py-1 rounded-full">
            Lokasi & Hubungan
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mt-3 font-serif">
            Hubungi & Kunjungi Kami
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Contact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Details (Left Column) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-2xs space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-emerald-950 font-serif border-b border-slate-100 pb-3">
                Informasi Kontak
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Alamat Lengkap</h4>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 leading-relaxed">
                      {siteConfig.location}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Telepon & WhatsApp</h4>
                    <p className="text-xs sm:text-sm text-slate-700 font-mono font-bold mt-1">
                      {siteConfig.adminPhone} (Humas)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Surel Resmi</h4>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 font-mono">
                      {siteConfig.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Jam Pelayanan Kantor</h4>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
                      Senin - Sabtu (08.00 - 14.30 WITA)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Map/Location Illustration (Right Column) */}
          <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs h-96 sm:h-[420px] flex flex-col">
            <div className="relative flex-1 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex flex-col justify-center items-center text-center p-6">
              {/* Custom maps mock canvas */}
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
              <div className="relative z-10 space-y-4 max-w-sm">
                <div className="w-12 h-12 bg-amber-500 text-emerald-950 rounded-full flex items-center justify-center mx-auto shadow-md border-2 border-white">
                  <MapPin className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Peta Kampus Pondok Pesantren Khairaat
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Kecamatan Sesayap Hilir, Kabupaten Tana Tidung, Provinsi Kalimantan Utara.
                  </p>
                </div>
                <button
                  onClick={() => window.open('https://maps.google.com', '_blank')}
                  className="bg-emerald-900 hover:bg-emerald-850 text-white font-bold px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase shadow-xs inline-block transition-all cursor-pointer"
                >
                  Buka Google Maps
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
