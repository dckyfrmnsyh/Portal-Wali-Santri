import React from 'react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  CheckSquare,
  History,
  FileBarChart2,
  CalendarDays,
  Utensils,
  PiggyBank,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  pendingValidationCount: number;
  onLogout: () => void;

  // tambahan
  variant?: 'desktop' | 'mobile';
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  pendingValidationCount,
  onLogout,
  variant = 'desktop',
  onClose,
}) => {
  const menuGroups = [
    {
      title: 'Utama',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Kelola SPP Santri',
      items: [
        { id: 'students', label: 'Data Santri', icon: Users },
        { id: 'bills', label: 'Tagihan SPP', icon: Receipt },
        { id: 'payments', label: 'Pembayaran & Cicilan', icon: History },
        {
          id: 'validations',
          label: 'Validasi Pembayaran',
          icon: CheckSquare,
          badge: pendingValidationCount > 0 ? pendingValidationCount : undefined,
        },
      ],
    },
    {
      title: 'Laporan SPP',
      items: [
        { id: 'report-spp-monthly', label: 'Laporan SPP Bulanan', icon: FileBarChart2 },
        { id: 'report-spp-yearly', label: 'Laporan Per Siswa', icon: CalendarDays },
      ],
    },
    {
      title: 'Keuangan Katering',
      items: [
        { id: 'meal-finance', label: 'Uang Makan Harian', icon: PiggyBank },
        { id: 'report-meal-monthly', label: 'Laporan Uang Makan', icon: Utensils },
      ],
    },
  ];

  // ganti baseClasses lama yang ada min-h-screen
  const baseClasses =
    'bg-brand-green-950 text-slate-300 border-r border-brand-green-900 flex flex-col min-h-0';

  // wrapper per mode
  const wrapperClasses =
    variant === 'mobile'
      ? `w-full h-full ${baseClasses}`          // <-- kunci tinggi drawer
      : `w-64 shrink-0 min-h-[calc(100vh-4rem)] ${baseClasses}`;

  return (
    <aside id="admin-sidebar" className={wrapperClasses}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-brand-green-900 bg-brand-green-950/80 ">
        <p className="text-[10px] font-bold text-brand-gold-400 uppercase tracking-widest">
          Akses Pengurus
        </p>
        <p className="text-sm font-bold text-white font-serif mt-1">Al-Khairaat Tana Tidung</p>

        {/* Tombol close hanya di mobile */}
        {variant === 'mobile' && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex items-center justify-center w-full rounded-lg bg-white/5 border border-white/10 text-white py-2 text-sm font-bold"
          >
            Tutup
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 p-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h5 className="text-[10px] font-bold text-brand-gold-500/75 uppercase tracking-wider px-3 mb-2">
              {group.title}
            </h5>

            {group.items.map((item) => {
              const Icon = item.icon as any;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    onClose?.(); // tutup drawer jika mobile
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-green-800 text-white border border-brand-gold-500/30 font-bold'
                      : 'hover:bg-brand-green-900/60 text-emerald-100 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? 'text-brand-gold-400' : 'text-emerald-300/60 group-hover:text-emerald-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="bg-brand-gold-500 text-brand-green-950 text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-brand-green-900 bg-brand-green-950/40">
        <button
          onClick={() => {
            onLogout();
            onClose?.();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-950/50 transition-all border border-transparent hover:border-rose-900/30 cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-rose-400 shrink-0" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  );
};