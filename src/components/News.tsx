import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

export const News: React.FC = () => {
  const articles = [
    {
      title: 'Pembangunan Gedung Asrama Putri Gelombang Pertama Dimulai',
      date: '24 Juni 2026',
      image: 'https://images.unsplash.com/photo-1541829019-21325530102c?auto=format&fit=crop&q=80&w=400',
      desc: 'Pondok Pesantren Khairaat resmi memulai pembangunan asrama baru guna menunjang kapasitas santriwati yang terus meningkat.'
    },
    {
      title: 'Santri Ponpes Khairaat Meraih Juara I Musabaqah Tilawatil Quran',
      date: '15 Mei 2026',
      image: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&q=80&w=400',
      desc: 'Ananda Ahmad Fauzi menyabet piala utama kategori Tilawah Remaja tingkat Provinsi Kalimantan Utara tahun ini.'
    },
    {
      title: 'Kunjungan Silaturahmi MUI Tana Tidung ke Kompleks Katering Dapur',
      date: '02 April 2026',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=400',
      desc: 'MUI meninjau sistem tata kelola gizi halal-higienis di pondok yang dikelola secara profesional berdaya guna.'
    }
  ];

  return (
    <section id="berita" className="py-20 sm:py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-600 font-bold text-xs tracking-wider uppercase bg-amber-100 px-3 py-1 rounded-full">
            Kabar & Informasi
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mt-3 font-serif">
            Berita Terkini Ponpes
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((item, idx) => (
            <article
              key={idx}
              className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col h-full justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.date}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-emerald-950 font-serif leading-snug group-hover:text-emerald-850 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
              
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={() => alert(`Sistem Informasi: Detail berita "${item.title}" sedang dipersiapkan oleh Humas Ponpes.`)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 group/btn cursor-pointer"
                >
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};
