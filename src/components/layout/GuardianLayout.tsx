import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface GuardianLayoutProps {
  children: React.ReactNode;
  guardianName?: string;
  onBackToLanding: () => void;
}

export const GuardianLayout: React.FC<GuardianLayoutProps> = ({
  children,
  guardianName,
  onBackToLanding,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar role="guardian" guardianName={guardianName} onBackToLanding={onBackToLanding} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
