import React from 'react';
import { Phone } from 'lucide-react';
import { siteConfig } from '../data/siteData';

export const FloatingWhatsApp: React.FC = () => {
  return (
    <a
      href={siteConfig.whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:shadow-emerald-600/50 transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
      aria-label="Hubungi Admin Pondok Pesantren via WhatsApp"
    >
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap text-xs font-extrabold uppercase tracking-wider group-hover:pr-2 block">
        Hubungi Admin
      </span>
      <Phone className="w-5 h-5 shrink-0" />
    </a>
  );
};
