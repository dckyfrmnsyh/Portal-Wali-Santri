import React from 'react';
import { Clock } from 'lucide-react';

export const Activities: React.FC = () => {
  const schedule = [
    {
      time: '04.00 - 05.30',
      title: 'Tahajjud & Shalat Shubuh',
      desc: 'Qiyamul Lail berjamaah, Shalat Shubuh berjamaah, zikir bersama, dan tadarus pagi.'
    },
    {
      time: '05.30 - 06.30',
      title: 'Hafalan Al-Qur’an',
      desc: 'Setoran bimbingan hafalan baru (ziadah) dan pengulangan berkala (murajaah) terstruktur.'
    },
    {
      time: '07.30 - 12.00',
      title: 'Pendidikan Formal',
      desc: 'Kegiatan Belajar Mengajar (KBM) reguler kurikulum nasional, sains, dan keagamaan.'
    },
    {
      time: '13.30 - 15.00',
      title: 'Pendalaman Kitab Kuning',
      desc: 'Kajian kitab kuning klasik (turots) meliputi ilmu aqidah, fiqih ibadah, nahwu & sharaf.'
    },
    {
      time: '15.30 - 17.30',
      title: 'Olahraga & Ekstrakurikuler',
      desc: 'Latihan fisik kebugaran, kegiatan kepramukaan, seni kaligrafi, bela diri, atau jurnalistik.'
    }
  ];

  return (
    <section id="kegiatan" className="py-20 sm:py-24 bg-gradient-to-b from-emerald-950 to-emerald-900 text-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-400 font-bold text-xs tracking-wider uppercase bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            Keseharian & Disiplin
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 font-serif">
            Agenda Kegiatan Harian Santri
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Contents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Timeline list (Left Column) */}
          <div className="lg:col-span-7 space-y-4">
            {schedule.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl hover:bg-emerald-900/60 transition-colors border-l-2 border-emerald-800 hover:border-amber-500"
              >
                <div className="bg-amber-500 text-emerald-950 font-black px-3 py-1.5 rounded-lg text-xs tracking-wider whitespace-nowrap min-w-[110px] text-center shadow-xs">
                  {item.time}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-emerald-200/80 text-xs sm:text-sm mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Overview Overview Card (Right Column) */}
          <div className="lg:col-span-5 bg-emerald-900/60 p-6 sm:p-8 rounded-2xl border border-emerald-800/80 shadow-inner relative overflow-hidden">
            <div className="absolute top-4 right-4 text-emerald-700/40">
              <Clock className="w-16 h-16" />
            </div>
            
            <h3 className="text-xl font-bold text-amber-400 mb-4 font-serif">
              Pembinaan 24 Jam
            </h3>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed mb-4">
              Siklus keseharian ini dirancang khusus untuk membangun keseimbangan spiritual (ruhiyah), intelektual (aqliyah), dan kekuatan fisik (jasmaniyah).
            </p>
            
            <div className="bg-emerald-950 p-4 rounded-xl border border-emerald-800/80 mt-6">
              <h5 className="font-bold text-white text-xs mb-1 uppercase tracking-wide">
                Penerapan Akhlak Utama
              </h5>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                "Menghormati guru, rukun sesama rekan santri, dan senantiasa menjaga keasrian lingkungan asrama adalah adab utama yang diwariskan."
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
