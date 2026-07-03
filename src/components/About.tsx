import React from 'react';
import { CheckCircle } from 'lucide-react';
import { siteConfig } from '../data/siteData';

export const About: React.FC = () => {
  const values = [
    { title: 'Integritas', desc: 'Menjunjung tinggi kebenaran, kejujuran & etika moral.' },
    { title: 'Kemandirian', desc: 'Mampu berpikir kreatif, solutif & hidup mandiri.' },
    { title: 'Kedisiplinan', desc: 'Taat aturan ibadah, KBM & menghargai waktu.' },
    { title: 'Khidmat', desc: 'Siap mengabdi tulus untuk kepentingan ummat.' },
  ];

  return (
    <section id="tentang" className="py-20 sm:py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-600 font-bold text-xs tracking-wider uppercase bg-amber-100 px-3 py-1 rounded-full">
            Profil Pondok Pesantren
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mt-3 font-serif">
            Mengenal Lebih Dekat {siteConfig.schoolShortName}
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
          <p className="text-slate-600 mt-4 text-sm sm:text-base md:text-lg leading-relaxed">
            Pondok Pesantren Khairaat Tana Tidung berkomitmen melahirkan generasi bertakwa, menguasai ilmu agama secara mendalam, santun dalam ucapan, disiplin tinggi, serta siap menjadi pelopor perubahan positif di masyarakat.
          </p>
        </div>

        {/* 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          
          {/* Sejarah Card (Left column) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="text-xl font-bold text-amber-400 mb-4 border-b border-emerald-800 pb-2 font-serif">
              Sejarah Singkat
            </h3>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed mb-4">
              Didirikan dengan cita-cita mulia untuk menghadirkan mercusuar pendidikan keislaman yang komprehensif di Kabupaten Tana Tidung, Kalimantan Utara.
            </p>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed mb-4">
              Sejak awal berdiri, Pondok Pesantren Khairaat mendedikasikan diri untuk membimbing tunas bangsa agar tidak hanya cerdas intelektual, melainkan juga memiliki kepekaan batin (spiritual) yang kokoh berlandaskan paham Ahlussunnah wal Jama'ah.
            </p>
            <div className="bg-emerald-800/50 p-4 rounded-xl border border-emerald-700/60 mt-4">
              <p className="text-xs italic text-amber-300">
                "Menjadi rujukan pendidikan islam terpadu yang memadukan nilai keluhuran lokal dengan kecakapan global."
              </p>
            </div>
          </div>

          {/* Visi, Misi & Values (Right column) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visi */}
            <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border-l-4 border-amber-500 shadow-sm">
              <h4 className="text-base sm:text-lg font-bold text-emerald-950 flex items-center space-x-2">
                <span className="w-6 h-6 bg-amber-500/20 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">V</span>
                <span>Visi Pesantren</span>
              </h4>
              <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed font-medium">
                "Menjadi lembaga pendidikan Islam unggulan dalam melahirkan generasi Qur'ani yang shalih, cerdas, mandiri, berakhlak mulia, serta siap berkhidmat untuk agama, bangsa, dan negara."
              </p>
            </div>

            {/* Misi */}
            <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border-l-4 border-emerald-700 shadow-sm">
              <h4 className="text-base sm:text-lg font-bold text-emerald-950 flex items-center space-x-2">
                <span className="w-6 h-6 bg-emerald-200 text-emerald-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0">M</span>
                <span>Misi Pesantren</span>
              </h4>
              <ul className="text-slate-600 text-xs sm:text-sm mt-3 space-y-2.5 pl-1">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Menyelenggarakan pendidikan formal & non-formal yang berkualitas berbasis nilai Islami.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Mendidik hafalan Al-Qur'an dan pemahaman isi kandungannya secara benar.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Menerapkan kurikulum kemandirian melalui pembinaan kecakapan hidup (life skills).</span>
                </li>
              </ul>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-2">
              {values.map((v) => (
                <div key={v.title} className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-center shadow-2xs hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                  <h5 className="font-bold text-emerald-900 text-xs uppercase tracking-wider">{v.title}</h5>
                  <p className="text-slate-500 text-[10px] sm:text-[11px] mt-1 leading-snug">{v.desc}</p>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
