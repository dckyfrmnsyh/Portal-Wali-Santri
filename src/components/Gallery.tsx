import React, { useState } from 'react';

interface GalleryProps {
  items?: any[];
}

export const Gallery: React.FC<GalleryProps> = ({ items }) => {
  const [activeCategory, setActiveCategory] = useState<string>('semua');

  const categories = [
    { key: 'semua', label: 'Semua Foto' },
    { key: 'belajar', label: 'Belajar' },
    { key: 'ibadah', label: 'Ibadah' },
    { key: 'ekstra', label: 'Ekstra' },
  ];

  const defaultItems = [
    {
      category: 'belajar',
      image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600',
      title: 'Suasana KBM Di Kelas',
      label: 'Belajar'
    },
    {
      category: 'ibadah',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      title: 'Halaqah Quran Subuh',
      label: 'Ibadah'
    },
    {
      category: 'ekstra',
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
      title: 'Latihan Seni Kaligrafi Islam',
      label: 'Ekstra'
    },
    {
      category: 'belajar',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
      title: 'Membaca di Perpustakaan',
      label: 'Belajar'
    },
    {
      category: 'ibadah',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600',
      title: 'Kajian Rutin Kitab Kuning',
      label: 'Ibadah'
    },
    {
      category: 'ekstra',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=600',
      title: 'Kebugaran Olahraga Lapangan',
      label: 'Ekstra'
    }
  ];

  const rawItems = items && items.length > 0 ? items : defaultItems;

  const filteredItems = rawItems.filter(item => {
    return activeCategory === 'semua' || item.category === activeCategory;
  });

  return (
    <section id="galeri" className="py-20 sm:py-24 bg-emerald-50/20 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-amber-600 font-bold text-xs tracking-wider uppercase bg-amber-100 px-3 py-1 rounded-full">
            Kamera & Dokumentasi
          </span>
          <h2 className="text-3xl font-black text-emerald-950 mt-3 font-serif">
            Galeri Kegiatan Ponpes
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10" id="gallery-filters">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-emerald-950 shadow-md'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="gallery-grid">
          {filteredItems.map((item, idx) => {
            const image = item.image_url || item.image;
            const title = item.title;
            const label = item.label || item.category;

            return (
              <div
                key={idx}
                className="gallery-item group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xs bg-slate-200 border border-slate-100 animate-fadeIn"
              >
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <span className="bg-amber-500 text-emerald-950 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider self-start mb-2 shadow-xs">
                    {label}
                  </span>
                  <h4 className="text-white text-sm sm:text-base font-bold font-serif">
                    {title}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
