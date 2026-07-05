import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  pendingValidationCount: number;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentPage,
  onPageChange,
  onLogout,
  pendingValidationCount,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar role="admin" onLogout={onLogout} />

      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            currentPage={currentPage}
            onPageChange={onPageChange}
            pendingValidationCount={pendingValidationCount}
            onLogout={onLogout}
            variant="desktop"
          />
        </div>

        {/* Mobile/Tablet: Top-center Toggle Button */}
        <div className="md:hidden w-full fixed bottom-20 left-0 z-50 px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-green-950/90 text-white px-4 py-2 border border-brand-gold-500/30"
          >
            <span className="text-lg leading-none">☰</span>
            <span className="text-sm font-bold">Menu</span>
          </button>
        </div>

        {/* Mobile/Tablet: Drawer Sidebar Overlay */}
        <div
          className={`md:hidden fixed inset-0 z-50 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!sidebarOpen}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Panel */}
          <div className="absolute left-0 top-0 bottom-0 w-[320px] max-w-[85vw] overflow-hidden">
            <Sidebar
              currentPage={currentPage}
              onPageChange={(page) => {
                onPageChange(page);
                setSidebarOpen(false); // tutup setelah pilih menu
              }}
              pendingValidationCount={pendingValidationCount}
              onLogout={() => {
                onLogout();
                setSidebarOpen(false);
              }}
              variant="mobile"
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">{children}</div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};