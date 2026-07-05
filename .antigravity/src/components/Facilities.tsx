import React from 'react';

export const Facilities: React.FC = () => {
  const items = [
    {
      image: 'https://images.unsplash.com/photo-1590076215667-873d6f00918c?auto=format&fit=crop&q=80&w=600',
      title: 'Masjid Utama',
      tag: 'Fasilitas Utama',
      desc: 'Pusat kegiatan ibadah berjamaah, kajian kitab, dan setoran hafalan Al-Qur’an harian.'
    },
    {
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=600',
      title: 'Ruang Kelas Modern',
      tag: 'Fasilitas Utama',
      desc: 'Tempat proses belajar mengajar formal yang nyaman, bersih, dan memadai.'
    },
    {
      image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600',
      title: 'Asrama Santri',
      tag: 'Fasilitas Utama',
      desc: 'Gedung asrama yang tertata rapi, sehat dengan pengawasan ustadz pembina selama 24 jam.'
    }
  ];

  return (
    <section id="fasilitas" className="py-20 sm:py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-600 font-bold text-xs tracking-wider uppercase bg-amber-100 px-3 py-1 rounded-full">
            Kondisi Fisik & Sarana
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mt-3 font-serif">
            Fasilitas Pendukung Belajar
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
          {/* Note: All images, titles, and descriptions below can be updated with the actual assets of the Islamic Boarding School */}
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((facility, idx) => (
            <div
              key={idx}
              className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                <img
                  src={facility.image}
                  alt={facility.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-3 left-3 bg-amber-500 text-emerald-950 text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider shadow-xs">
                  {facility.tag}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-emerald-950 mb-2 font-serif">
                  {facility.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {facility.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
