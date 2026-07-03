import React from 'react';
import { Shield, BookOpen, LogOut, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  role: 'public' | 'guardian' | 'admin';
  onBackToLanding?: () => void;
  onLogout?: () => void;
  guardianName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  onBackToLanding,
  onLogout,
  guardianName,
}) => {
  return (
    <nav id="main-navbar" className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-green-50 text-brand-green-800 rounded-xl border border-brand-green-100">
              <BookOpen className="h-6 w-6 text-brand-green-700" />
            </div>
            <div>
              <span className="font-bold text-brand-green-950 text-lg tracking-tight font-serif">Al-Khairaat</span>
              <span className="text-[10px] text-brand-gold-600 font-extrabold tracking-wider block -mt-1">PORTAL PONPES TANA TIDUNG</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {role === 'guardian' && (
              <>
                <div className="hidden sm:block text-right mr-2">
                  <p className="text-[10px] text-brand-gold-600 font-extrabold uppercase tracking-widest">Akses Portal</p>
                  <p className="text-sm font-bold text-brand-green-950 font-serif">Portal Wali Santri</p>
                </div>
                {onBackToLanding && (
                  <button
                    onClick={onBackToLanding}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-green-900 hover:text-brand-green-950 border border-brand-cream-200 hover:bg-brand-cream-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali ke Beranda
                  </button>
                )}
              </>
            )}

            {role === 'admin' && (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                  <Shield className="h-3.5 w-3.5" />
                  Admin Mode
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Keluar
                  </button>
                )}
              </>
            )}

            {role === 'public' && (
              <span className="text-xs font-semibold text-slate-400 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                Akses Publik
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
