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
}

export const LandingAccessPage: React.FC<LandingAccessPageProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Header element */}
      <Header onSelectRole={onSelectRole} />
      
      {/* Main sections container */}
      <main className="flex-1">
        <Hero onSelectRole={onSelectRole} />
        <QuickAccess onSelectRole={onSelectRole} />
        <About />
        <Programs />
        <Facilities />
        <Activities />
        <News />
        <Gallery />
        <PPDB />
        <Contact />
      </main>

      {/* Footer element */}
      <Footer onSelectRole={onSelectRole} />

      {/* Floating interactive elements */}
      <FloatingWhatsApp />
    </div>
  );
};
