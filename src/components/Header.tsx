import React, { useState } from 'react';
import { Menu, X, User } from 'lucide-react';
import { siteConfig } from '../data/siteData';
import logoResmi from '../assets/logo_resmi.png';

interface HeaderProps {
  onSelectRole: (role: 'guardian' | 'admin') => void;
  webConfig?: Record<string, string>;
}

export const Header: React.FC<HeaderProps> = ({ onSelectRole, webConfig }) => {
  const [isOpen, setIsOpen] = useState(false);

  const schoolShortName = webConfig?.schoolShortName || siteConfig.schoolShortName;
  const locationShort = webConfig?.locationShort || siteConfig.locationShort;

  const navLinks = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Program', href: '#program' },
    { label: 'Fasilitas', href: '#fasilitas' },
    { label: 'Kegiatan', href: '#kegiatan' },
    { label: 'Berita', href: '#berita' },
    { label: 'Galeri', href: '#galeri' },
    { label: 'PPDB', href: '#ppdb' },
    { label: 'Kontak', href: '#kontak' },
  ];

  return (
    <header className="fixed w-full top-0 z-50 bg-emerald-900 border-b border-emerald-800 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <a href="#beranda" className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-transparent flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <img src={logoResmi} alt="Logo resmi Ponpes Khairaat" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm sm:text-base tracking-wide leading-tight uppercase group-hover:text-amber-400 transition-colors">
                {schoolShortName}
              </h1>
              <p className="text-amber-400 text-xs font-semibold tracking-wider">
                {locationShort}
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1" id="desktop-nav">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-2.5 py-2 rounded-md text-[11px] xl:text-xs font-semibold tracking-wide transition-all duration-300 text-emerald-100 hover:text-white hover:bg-emerald-800"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              onClick={() => onSelectRole('guardian')}
              className="group flex items-center space-x-2 text-amber-400 hover:text-amber-300 font-bold text-xs tracking-wider transition-colors cursor-pointer"
            >
              <span className="bg-emerald-800 p-1.5 rounded-full group-hover:bg-emerald-700 transition-colors">
                <User className="w-4 h-4" />
              </span>
              <span className="uppercase border-b border-transparent group-hover:border-amber-400">Portal Wali</span>
            </button>
            <a
              href="#ppdb"
              className="bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold px-4 xl:px-5 py-2.5 rounded-full text-[11px] xl:text-xs tracking-wider uppercase transition-all duration-300 shadow hover:shadow-lg inline-block transform hover:-translate-y-0.5 text-center"
            >
              Daftar PPDB
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-emerald-100 hover:text-white focus:outline-none p-2 rounded-md hover:bg-emerald-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {isOpen && (
        <div id="mobile-menu" className="lg:hidden bg-emerald-900 border-t border-emerald-800 animate-fadeIn">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-emerald-100 hover:bg-emerald-800 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            
            <div className="pt-4 px-4 space-y-3 border-t border-emerald-800/60">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSelectRole('guardian');
                }}
                className="w-full bg-emerald-800 text-amber-400 border border-emerald-700 font-bold py-3 px-4 rounded-md text-sm flex items-center justify-center space-x-2 shadow cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Login Portal Wali</span>
              </button>
              <a
                href="#ppdb"
                onClick={() => setIsOpen(false)}
                className="w-full bg-amber-500 text-emerald-950 font-bold py-3 px-4 rounded-md text-center text-sm shadow hover:bg-amber-600 block"
              >
                Daftar PPDB Online
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
