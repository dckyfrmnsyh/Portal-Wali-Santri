import React from 'react';
import { User, Sparkles } from 'lucide-react';
import { siteConfig } from '../data/siteData';

interface HeroProps {
  onSelectRole: (role: 'guardian' | 'admin') => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectRole }) => {
  return (
    <section
      id="beranda"
      className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center bg-emerald-950 text-white overflow-hidden py-16 sm:py-24 pt-32"
    >
      {/* Decorative Blur Circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-900 rounded-full filter blur-3xl opacity-30 -mr-20 -mt-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-800 rounded-full filter blur-3xl opacity-20 -ml-20 -mb-20 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline and Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Pondok Pesantren Resmi & Terakreditasi
            </span>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-serif">
              Membentuk Generasi <span className="text-amber-400">Qur’ani</span>, Berilmu, Berakhlak, dan Siap Mengabdi
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-sans">
              Pondok Pesantren Khairaat Tana Tidung hadir sebagai lembaga pendidikan Islam yang terintegrasi, memadukan sains, khazanah kitab kuning, program tahfidz Al-Qur'an, dan pembiasaan adab islami harian.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <a
                href="#ppdb"
                className="bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-amber-500/20 transform hover:-translate-y-0.5 inline-block text-center min-h-[44px]"
              >
                Daftar PPDB Online
              </a>
              <button
                onClick={() => onSelectRole('guardian')}
                className="bg-emerald-800 hover:bg-emerald-700 text-amber-400 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-sm border border-emerald-600 transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
              >
                <User className="w-5 h-5 shrink-0" />
                <span>Portal Wali Santri</span>
              </button>
            </div>

            {/* Statistics Row (Comments: Values are editable parameters in siteData) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 pt-8 border-t border-emerald-800/60 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                  {siteConfig.stats.activeStudents}
                </p>
                <p className="text-xs text-emerald-200">Santri Aktif</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                  {siteConfig.stats.teachersCount}
                </p>
                <p className="text-xs text-emerald-200">Ustadz & Pembina</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                  {siteConfig.stats.narcoticsFree}
                </p>
                <p className="text-xs text-emerald-200">Bebas Narkoba</p>
              </div>
            </div>
          </div>

          {/* Right Column: Feature Photo and Focal Badge */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-emerald-700 rounded-3xl transform rotate-3 scale-[1.02] opacity-20"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-emerald-800/80 aspect-[4/3] bg-emerald-900">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
                  alt="Santri Khairaat mengaji Al-Quran bersama"
                  className="w-full h-auto object-cover opacity-95 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent"></div>
                
                {/* Overlay Card on Image */}
                <div className="absolute bottom-4 left-4 right-4 bg-emerald-900/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-emerald-700">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Fokus Utama Kami</p>
                  <p className="text-white text-xs sm:text-sm font-semibold mt-1">
                    "Mencetak Hafidz Quran yang mandiri, beretika, dan mumpuni sains."
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
