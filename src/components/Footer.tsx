import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { siteConfig } from '../data/siteData';
import logoResmi from '../assets/logo_resmi.png';

interface FooterProps {
  onSelectRole: (role: 'guardian' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectRole }) => {
  return (
    <footer className="bg-emerald-950 text-white pt-16 pb-8 border-t border-emerald-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-12 border-b border-emerald-900/60">
          
          {/* Identity Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-transparent flex items-center justify-center shrink-0">
                <img src={logoResmi} alt="Logo resmi Ponpes Khairaat" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide leading-tight">
                  {siteConfig.schoolShortName}
                </h3>
                <p className="text-amber-400 text-xs font-semibold tracking-wider">
                  {siteConfig.locationShort}
                </p>
              </div>
            </div>
            <p className="text-emerald-200/80 text-xs sm:text-sm leading-relaxed">
              Membentuk generasi tangguh, berakhlak mulia, berpemahaman Wasathiyah (moderat), mandiri, serta mumpuni dalam ilmu sains kontemporer.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-emerald-900 pb-2 font-serif">
              Menu Cepat
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-200/85">
              <li>
                <a href="#beranda" className="hover:text-amber-400 transition-colors">Halaman Utama</a>
              </li>
              <li>
                <a href="#tentang" className="hover:text-amber-400 transition-colors">Profil Pesantren</a>
              </li>
              <li>
                <a href="#program" className="hover:text-amber-400 transition-colors">Program Unggulan</a>
              </li>
              <li>
                <a href="#fasilitas" className="hover:text-amber-400 transition-colors">Fasilitas Kampus</a>
              </li>
              <li>
                <button
                  onClick={() => onSelectRole('admin')}
                  className="hover:text-amber-400 transition-colors text-left font-semibold text-amber-500/90 cursor-pointer block"
                >
                  Masuk Portal Pengurus
                </button>
              </li>
            </ul>
          </div>

          {/* Contacts and Admin Directory */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-emerald-900 pb-2 font-serif">
              Kontak & Administrasi
            </h4>
            <ul className="space-y-3.5 text-xs sm:text-sm text-emerald-200/85">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4.5 h-4.5 text-amber-400 mt-0.5 shrink-0" />
                <span>{siteConfig.location}</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                <span className="font-mono font-bold">{siteConfig.adminPhone}</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                <span className="font-mono">{siteConfig.email}</span>
              </li>
            </ul>
          </div>

        </div>
        
        {/* Copyright Panel */}
        <div className="pt-8 text-center text-[10px] sm:text-xs text-emerald-200/60 leading-relaxed">
          <p>© 2026 {siteConfig.schoolName}. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>

      </div>
    </footer>
  );
};
