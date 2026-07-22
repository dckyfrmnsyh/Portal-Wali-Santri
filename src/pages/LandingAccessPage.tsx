import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { QuickAccess } from '../components/QuickAccess';
import { About } from '../components/About';
import { Programs } from '../components/Programs';
import { Facilities } from '../components/Facilities';
import { Activities } from '../components/Activities';
import { News } from '../components/News';
import { Gallery } from '../components/Gallery';
import { PPDB } from '../components/PPDB';
import { Contact } from '../components/Contact';
import { Footer } from '../components/Footer';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';

interface LandingAccessPageProps {
  onSelectRole: (role: 'guardian' | 'admin') => void;
  webConfig?: Record<string, string>;
  aboutContent?: any;
  heroBanners?: any[];
  programs?: any[];
  newsList?: any[];
  galleryList?: any[];
}

export const LandingAccessPage: React.FC<LandingAccessPageProps> = ({
  onSelectRole,
  webConfig,
  aboutContent,
  heroBanners,
  programs,
  newsList,
  galleryList
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Header element */}
      <Header onSelectRole={onSelectRole} webConfig={webConfig} />
      
      {/* Main sections container */}
      <main className="flex-1">
        <Hero onSelectRole={onSelectRole} webConfig={webConfig} banners={heroBanners} />
        <QuickAccess onSelectRole={onSelectRole} />
        <About content={aboutContent} webConfig={webConfig} />
        <Programs programs={programs} />
        <Facilities />
        <Activities />
        <News articles={newsList} />
        <Gallery items={galleryList} />
        <PPDB />
        <Contact webConfig={webConfig} />
      </main>

      {/* Footer element */}
      <Footer onSelectRole={onSelectRole} webConfig={webConfig} />

      {/* Floating interactive elements */}
      <FloatingWhatsApp webConfig={webConfig} />
    </div>
  );
};
