import React from 'react';
import {
  Users,
  CreditCard,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  PiggyBank,
  GraduationCap,
  Sparkles,
  DollarSign,
  UtensilsCrossed,
} from 'lucide-react';
import { Student } from '../../types/student';
import { SppBill } from '../../types/spp';
import { Payment } from '../../types/payment';
import { MealFinance } from '../../types/mealFinance';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { getPaymentStatusLabel, getPaymentStatusColor } from '../../utils/statusHelper';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface AdminDashboardPageProps {
  students: Student[];
  bills: SppBill[];
  payments: Payment[];
  mealFinance: MealFinance[];
  onNavigateTo: (page: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  students,
  bills,
  payments,
  mealFinance,
  onNavigateTo,
}) => {
  // --- 1. Programmatic Metrics Calculations ---
  
  // Total Santri Aktif
  const activeStudents = students.filter(s => s.status === 'active');
  const totalActive = activeStudents.length;

  // Total Santri SMP
  const totalSmp = activeStudents.filter(s => {
    const g = s.grade.toLowerCase();
    return g.includes('smp') || g.includes('vii') || g.includes('viii') || g.includes('ix');
  }).length;

  // Total Santri SMA
  const totalSma = activeStudents.filter(s => {
    const g = s.grade.toLowerCase();
    return g.includes('sma') || g.includes('x') || g.includes('xi') || g.includes('xii');
  }).length;

  // Total Tagihan Bulan Ini (Juni 2026 - current month)
  const currentMonth = 'Juni';
  const currentYear = 2026;
  const billsThisMonth = bills.filter(b => b.month === currentMonth && b.year === currentYear);
  const totalTagihanBulanIni = billsThisMonth.reduce((acc, b) => acc + b.amount, 0);

  // Total Pembayaran Masuk Bulan Ini (SPP Dibayar untuk bulan Juni 2026)
  const totalPembayaranMasukBulanIni = billsThisMonth.reduce((acc, b) => acc + b.paidAmount, 0);

  // Total Tunggakan (Sisa tagihan semua bulan)
  const totalTunggakan = bills.reduce((acc, b) => acc + (b.amount - b.paidAmount), 0);

  // Pembayaran Menunggu Validasi (Status pending_validation)
  const pendingValidations = payments.filter((p) => p.status === 'pending_validation');
  const pendingCount = pendingValidations.length;

  // Pengeluaran Uang Makan Bulan Ini (Uang makan / catering expense completed in June 2026)
  const totalMealExpenseBulanIni = mealFinance
    .filter(f => f.type === 'expense' && f.status === 'completed' && (f.date.includes('2026-06') || f.notes.toLowerCase().includes('juni')))
    .reduce((acc, f) => acc + f.amount, 0);

  // Get latest 5 payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  // --- 2. Chart Mockup Data Calculations ---
  // SMP vs SMA outstanding
  const outstandingSmp = bills.reduce((acc, b) => {
    const student = students.find(s => s.id === b.studentId);
    if (student) {
      const g = student.grade.toLowerCase();
      const isSmp = g.includes('smp') || g.includes('vii') || g.includes('viii') || g.includes('ix');
      if (isSmp) return acc + (b.amount - b.paidAmount);
    }
    return acc;
  }, 0);

  const outstandingSma = bills.reduce((acc, b) => {
    const student = students.find(s => s.id === b.studentId);
    if (student) {
      const g = student.grade.toLowerCase();
      const isSma = g.includes('sma') || g.includes('x') || g.includes('xi') || g.includes('xii');
      if (isSma) return acc + (b.amount - b.paidAmount);
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-brand-green-950 via-brand-green-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-brand-green-800 relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-brand-gold-400 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Pondok Pesantren Al-Khairaat Tana Tidung
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-black font-serif tracking-tight leading-tight text-white">
            Assalamu'alaikum, Pengurus Keuangan!
          </h1>
          <p className="text-sm text-emerald-100/90 font-medium leading-relaxed">
            Selamat datang di Sistem Informasi SPP dan Keuangan Santri. Anda memiliki{' '}
            <strong className="text-brand-gold-400 font-extrabold">{pendingCount} bukti pembayaran wali santri</strong> yang memerlukan tindakan validasi.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none text-white font-serif text-9xl font-black">
          AL-KHAIRAAT
        </div>
      </div>

      {/* 8 REQUIRED STATS GRID */}
      <div>
        <h3 className="text-base font-bold text-brand-green-950 font-serif mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-gold-500 animate-pulse" />
          Rangkasan Statistik Keuangan & Santri
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Total Santri Aktif */}
          <Card className="p-4 bg-white border border-brand-cream-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-brand-green-50 text-brand-green-800 rounded-xl border border-brand-green-100 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Santri Aktif</p>
              <p className="text-xl font-black text-brand-green-950 mt-0.5">{totalActive} Santri</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Status aktif di sekolah</p>
            </div>
          </Card>

          {/* 2. Total Santri SMP */}
          <Card className="p-4 bg-white border border-brand-cream-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Total Santri SMP</p>
              <p className="text-xl font-black text-indigo-950 mt-0.5">{totalSmp} Santri</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Tingkat menengah pertama</p>
            </div>
          </Card>

          {/* 3. Total Santri SMA */}
          <Card className="p-4 bg-white border border-brand-cream-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Total Santri SMA</p>
              <p className="text-xl font-black text-amber-950 mt-0.5">{totalSma} Santri</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Tingkat menengah atas</p>
            </div>
          </Card>

          {/* 4. Total Tagihan Bulan Ini */}
          <Card className="p-4 bg-white border border-brand-cream-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Tagihan Bulan Ini ({currentMonth})</p>
              <p className="text-xl font-black text-blue-950 mt-0.5">{formatCurrency(totalTagihanBulanIni)}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Periode {currentMonth} {currentYear}</p>
            </div>
          </Card>

          {/* 5. Total Pembayaran Masuk Bulan Ini */}
          <Card className="p-4 bg-white border border-brand-cream-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Realisasi Masuk Bulan Ini</p>
              <p className="text-xl font-black text-emerald-800 mt-0.5">{formatCurrency(totalPembayaranMasukBulanIni)}</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">
                {Math.round((totalPembayaranMasukBulanIni / (totalTagihanBulanIni || 1)) * 100)}% lunas terbayar
              </p>
            </div>
          </Card>

          {/* 6. Total Tunggakan */}
          <Card className="p-4 bg-white border border-brand-cream-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 shrink-0">
              <AlertCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Total Semua Tunggakan</p>
              <p className="text-xl font-black text-rose-700 mt-0.5">{formatCurrency(totalTunggakan)}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Akumulasi sisa iuran</p>
            </div>
          </Card>

          {/* 7. Pembayaran Menunggu Validasi */}
          <Card className={`p-4 bg-white border shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow ${pendingCount > 0 ? 'border-brand-gold-300 bg-amber-50/20' : 'border-brand-cream-200/80'}`}>
            <div className={`p-3 rounded-xl shrink-0 ${pendingCount > 0 ? 'bg-brand-gold-100 text-brand-gold-800 border border-brand-gold-200 animate-pulse' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Menunggu Validasi</p>
              <p className={`text-xl font-black mt-0.5 ${pendingCount > 0 ? 'text-brand-gold-700' : 'text-slate-700'}`}>{pendingCount} Transaksi</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Konfirmasi wali santri</p>
            </div>
          </Card>

          {/* 8. Pengeluaran Uang Makan Bulan Ini */}
          <Card className="p-4 bg-white border border-brand-cream-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100 shrink-0">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Belanja Katering ({currentMonth})</p>
              <p className="text-xl font-black text-teal-950 mt-0.5">{formatCurrency(totalMealExpenseBulanIni)}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Pengeluaran dapur santri</p>
            </div>
          </Card>

        </div>
      </div>

      {/* GRAPH PLACEHOLDERS: ELEGANT VISUAL COMPONENT CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph 1: Pemasukan SPP per bulan */}
        <Card className="p-5 border border-brand-cream-200 bg-white" title="Pemasukan SPP Bulanan (2026)">
          <div className="space-y-4 pt-2">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Nilai Realisasi SPP yang Berhasil Divalidasi</p>
            
            <div className="h-44 flex items-end justify-between gap-2.5 pt-4 border-b border-slate-100 pb-1">
              {[
                { month: 'Jan', val: 5500000, color: 'bg-brand-green-800' },
                { month: 'Feb', val: 6200000, color: 'bg-brand-green-800' },
                { month: 'Mar', val: 5800000, color: 'bg-brand-green-800' },
                { month: 'Apr', val: 7400000, color: 'bg-brand-green-800' },
                { month: 'Mei', val: 8100000, color: 'bg-brand-green-800' },
                { month: 'Jun', val: totalPembayaranMasukBulanIni, color: 'bg-brand-gold-500' },
              ].map((bar, i) => {
                // Calculate percentage based on max value (e.g. 10.000.000)
                const pct = Math.min(100, Math.round((bar.val / 9000000) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[8px] font-black text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white rounded px-1 py-0.5 -translate-y-2 absolute">
                      {formatCurrency(bar.val).replace(',00', '')}
                    </div>
                    <div 
                      style={{ height: `${pct}%` }} 
                      className={`w-full rounded-t-md transition-all duration-500 group-hover:brightness-90 ${bar.color} min-h-[4px] shadow-xs`}
                    />
                    <span className="text-[10px] font-bold text-slate-500">{bar.month}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-brand-green-800" />
                Lunas Historis
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-brand-gold-500" />
                Bulan Berjalan ({currentMonth})
              </span>
            </div>
          </div>
        </Card>

        {/* Graph 2: Tunggakan berdasarkan jenjang */}
        <Card className="p-5 border border-brand-cream-200 bg-white" title="Tunggakan SPP Berdasarkan Jenjang">
          <div className="space-y-5 pt-2">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Perbandingan Piutang Berjalan Santri</p>
            
            <div className="space-y-4 pt-2">
              {/* SMP outstanding */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                    Tingkat SMP (Madrasah Tsanawiyah)
                  </span>
                  <span className="text-rose-600 font-black">{formatCurrency(outstandingSmp)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((outstandingSmp / (totalTunggakan || 1)) * 100))}%` }} 
                    className="bg-indigo-600 h-full rounded-full" 
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Mengambil porsi {Math.round((outstandingSmp / (totalTunggakan || 1)) * 100)}% dari total tunggakan pondok
                </p>
              </div>

              {/* SMA outstanding */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-amber-600" />
                    Tingkat SMA (Madrasah Aliyah)
                  </span>
                  <span className="text-rose-600 font-black">{formatCurrency(outstandingSma)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((outstandingSma / (totalTunggakan || 1)) * 100))}%` }} 
                    className="bg-amber-500 h-full rounded-full" 
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Mengambil porsi {Math.round((outstandingSma / (totalTunggakan || 1)) * 100)}% dari total tunggakan pondok
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-800 leading-relaxed font-medium">
              Bendahara diimbau mengirimkan pemberitahuan tagihan otomatis via WhatsApp blast secara berkala bagi jenjang dengan tunggakan tinggi.
            </div>
          </div>
        </Card>

        {/* Graph 3: Pengeluaran uang makan bulanan */}
        <Card className="p-5 border border-brand-cream-200 bg-white" title="Pengeluaran Uang Makan Bulanan">
          <div className="space-y-4 pt-2">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Histori Belanja Katering Dapur Santri</p>
            
            <div className="h-44 flex items-end justify-between gap-2.5 pt-4 border-b border-slate-100 pb-1">
              {[
                { month: 'Jan', val: 4200000, label: 'Lancar' },
                { month: 'Feb', val: 3900000, label: 'Lancar' },
                { month: 'Mar', val: 4500000, label: 'Lancar' },
                { month: 'Apr', val: 4100000, label: 'Lancar' },
                { month: 'Mei', val: 4800000, label: 'Lancar' },
                { month: 'Jun', val: totalMealExpenseBulanIni || 4600000, label: 'Juni' },
              ].map((bar, i) => {
                const pct = Math.min(100, Math.round((bar.val / 6000000) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[8px] font-black text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white rounded px-1 py-0.5 -translate-y-2 absolute">
                      {formatCurrency(bar.val).replace(',00', '')}
                    </div>
                    <div 
                      style={{ height: `${pct}%` }} 
                      className="w-full rounded-t-md transition-all duration-500 group-hover:brightness-95 bg-teal-600 min-h-[4px] shadow-xs"
                    />
                    <span className="text-[10px] font-bold text-slate-500">{bar.month}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-[10px] bg-teal-50 border border-teal-100 text-teal-800 p-2.5 rounded-lg leading-relaxed">
              <UtensilsCrossed className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <span className="font-medium">Semua data belanja pangan terkoordinasi langsung dengan asisten dapur & bendahara asrama.</span>
            </div>
          </div>
        </Card>

      </div>

      {/* Main Content Split Area (Recent and Shortcuts) */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent payments logs */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Konfirmasi Pembayaran Terbaru"
            subtitle="5 log konfirmasi pembayaran terakhir dari portal wali santri"
            headerAction={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTo('payments')}
                className="text-xs font-bold border-brand-cream-200 text-brand-green-900 hover:bg-brand-cream-50 cursor-pointer"
              >
                Lihat Semua
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            }
          >
            <div className="divide-y divide-brand-cream-100 overflow-hidden">
              {recentPayments.length > 0 ? (
                recentPayments.map((pay) => {
                  const student = students.find((s) => s.id === pay.studentId);
                  const statusLabel = getPaymentStatusLabel(pay.status);
                  const statusColor = getPaymentStatusColor(pay.status);

                  return (
                    <div
                      key={pay.id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-brand-cream-50/20 transition-colors rounded-lg px-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-brand-green-950 text-sm truncate">
                          {student ? student.name : 'Santri Tidak Diketahui'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                          <span className="font-semibold text-slate-500">{pay.paymentDate}</span>
                          <span>•</span>
                          <span className="font-semibold capitalize text-slate-600">Metode: {pay.method === 'transfer' ? 'Transfer Bank' : 'Tunai'}</span>
                          <span>•</span>
                          <span className="font-mono font-bold text-brand-green-800/80">{pay.referenceNumber}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-black text-brand-green-950 text-sm">
                          {formatCurrency(pay.amount)}
                        </span>
                        <StatusBadge label={statusLabel} colorClass={statusColor} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-400 py-6 text-center">Belum ada aktivitas konfirmasi pembayaran masuk.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Fast shortcuts */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Pintasan Cepat">
            <div className="space-y-3">
              {pendingCount > 0 && (
                <button
                  onClick={() => onNavigateTo('validations')}
                  className="w-full text-left p-3.5 bg-brand-gold-50 border border-brand-gold-200 hover:bg-brand-gold-100/50 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-brand-gold-950 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-brand-gold-600 animate-pulse" />
                      Validasi Tertunda
                    </p>
                    <p className="text-[11px] text-brand-gold-700 font-medium">{pendingCount} transaksi menunggu persetujuan</p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-brand-gold-600 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <button
                onClick={() => onNavigateTo('students')}
                className="w-full text-left p-3.5 bg-brand-green-50 border border-brand-green-100 hover:bg-brand-green-100/40 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-brand-green-950">Data Registrasi Santri</p>
                  <p className="text-[11px] text-brand-green-700 font-semibold">Lihat & edit database profil santri</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-brand-green-800 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTo('bills')}
                className="w-full text-left p-3.5 bg-brand-cream-50 border border-brand-cream-200 hover:bg-brand-cream-100/80 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-brand-green-900">Buat Tagihan Baru</p>
                  <p className="text-[11px] text-brand-green-700 font-semibold">Buka tagihan SPP bulanan otomatis</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-brand-green-700 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigateTo('meal-finance')}
                className="w-full text-left p-3.5 bg-teal-50 border border-teal-100 hover:bg-teal-100/50 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-teal-950">Arus Kas Uang Makan</p>
                  <p className="text-[11px] text-teal-700 font-semibold">Rekap pengeluaran & pemasukan dapur</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-teal-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

// Simple Chevron Icon for cleaner imports
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
