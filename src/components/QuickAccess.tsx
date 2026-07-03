import React from 'react';
import { CreditCard, ChevronRight } from 'lucide-react';

interface QuickAccessProps {
  onSelectRole: (role: 'guardian' | 'admin') => void;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({ onSelectRole }) => {
  return (
    <section className="bg-amber-500 border-b border-amber-600 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-900 p-3 rounded-full text-amber-400 shrink-0 shadow-sm">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-emerald-950 font-black text-lg tracking-tight">
              Anda Wali Santri Khairaat?
            </h3>
            <p className="text-emerald-900/85 text-xs sm:text-sm font-semibold">
              Cek tagihan SPP, asrama, dan riwayat pembayaran putra/i Anda di sini.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectRole('guardian')}
          className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center space-x-2 transition-all w-full md:w-auto justify-center cursor-pointer transform hover:scale-[1.02]"
        >
          <span>Masuk Portal Wali</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>

      </div>
    </section>
  );
};
