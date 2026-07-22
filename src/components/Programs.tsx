import React from 'react';
import { BookOpen, Layers, Award, Shield, Compass, Heart } from 'lucide-react';

interface ProgramsProps {
  programs?: any[];
}

const iconMap: Record<string, any> = {
  'BookOpen': BookOpen,
  'Layers': Layers,
  'Award': Award,
  'Shield': Shield,
  'Compass': Compass,
  'Heart': Heart,
};

export const Programs: React.FC<ProgramsProps> = ({ programs }) => {
  const defaultItems = [
    {
      icon: 'BookOpen',
      category: 'Agama',
      title: 'Pendidikan Keagamaan',
      desc: 'Fokus pendalaman kitab-kitab turots, nahwu, sharaf, tauhid, fiqih, dan hadits secara mendalam.'
    },
    {
      icon: 'Layers',
      category: 'Akademik',
      title: 'Pendidikan Umum',
      desc: 'Kurikulum nasional terintegrasi membekali santri dengan sains, matematika, teknologi, dan bahasa.'
    },
    {
      icon: 'Award',
      category: 'Unggulan',
      title: 'Tahfidz Al-Qur\'an',
      desc: 'Program bimbingan hafalan intensif dengan target capaian 30 juz bersanad, dan pemahaman tafsir dasar.'
    },
    {
      icon: 'Shield',
      category: 'Karakter',
      title: 'Pembinaan Akhlak',
      desc: 'Penanaman adab islami harian, kedisiplinan, serta pembiasaan ibadah sunnah di lingkungan pesantren.'
    },
    {
      icon: 'Compass',
      category: 'Bakat',
      title: 'Ekstrakurikuler',
      desc: 'Pengembangan bakat di bidang seni kaligrafi, rebana, bela diri, pramuka, dan jurnalistik islami.'
    },
    {
      icon: 'Heart',
      category: 'Life Skill',
      title: 'Kemandirian Santri',
      desc: 'Pelatihan tata kelola kehidupan asrama secara mandiri, kepemimpinan organisasi, serta kewirausahaan.'
    }
  ];

  const rawItems = programs && programs.length > 0 ? programs : defaultItems;

  return (
    <section id="program" className="py-20 sm:py-24 bg-emerald-50/30 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-600 font-bold text-xs tracking-wider uppercase bg-amber-100 px-3 py-1 rounded-full">
            Kurikulum & Program Utama
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mt-3 font-serif">
            Program Pendidikan Terintegrasi
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
          <p className="text-slate-600 mt-4 text-sm sm:text-base leading-relaxed">
            Kami menyusun program terpadu yang memadukan keilmuan kontemporer dengan kedalaman ilmu syar'i klasik demi keseimbangan tumbuh kembang santri.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {rawItems.map((item, idx) => {
            const IconComponent = iconMap[item.icon] || BookOpen;
            const category = item.category || 'Agama';
            const title = item.title || item.name;
            const desc = item.desc || item.description;

            return (
              <div
                key={idx}
                className="bg-white hover:bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {category}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-emerald-950 mb-3 font-serif">
                    {title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
