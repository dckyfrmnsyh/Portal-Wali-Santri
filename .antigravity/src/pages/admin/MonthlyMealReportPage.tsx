import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Award, FileText, FileSpreadsheet, Filter, RefreshCw, BarChart2 } from 'lucide-react';
import { MealFinance } from '../../types/mealFinance';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

interface MonthlyMealReportPageProps {
  mealFinance: MealFinance[];
}

export const MonthlyMealReportPage: React.FC<MonthlyMealReportPageProps> = ({ mealFinance }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('06'); // June default
  const [selectedYear, setSelectedYear] = useState<string>('2026'); // 2026 default
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const monthOptions = [
    { value: 'all', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const yearOptions = [
    { value: 'all', label: 'Semua Tahun' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
    { value: '2027', label: '2027' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'subscription', label: 'Uang Makan Langganan' },
    { value: 'Beras', label: 'Beras' },
    { value: 'Sayur', label: 'Sayur' },
    { value: 'Lauk', label: 'Lauk' },
    { value: 'Gas', label: 'Gas' },
    { value: 'Bumbu dapur', label: 'Bumbu Dapur' },
    { value: 'Air minum', label: 'Air Minum' },
    { value: 'Peralatan dapur', label: 'Peralatan Dapur' },
    { value: 'Lainnya', label: 'Lainnya' },
  ];

  // Filter records chronologically
  const sortedAndFilteredRecords = useMemo(() => {
    return [...mealFinance]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .filter((record) => {
        const parts = record.date.split('-'); // e.g. "2026-06-15"
        const year = parts[0];
        const month = parts[1];

        if (selectedYear !== 'all' && year !== selectedYear) return false;
        if (selectedMonth !== 'all' && month !== selectedMonth) return false;
        if (selectedCategory !== 'all' && record.category !== selectedCategory) return false;

        return true;
      });
  }, [mealFinance, selectedMonth, selectedYear, selectedCategory]);

  // Compute metrics with running ledger balance
  const computations = useMemo(() => {
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    // Track expenses by category to find largest
    const expenseByCategory: { [key: string]: number } = {};

    sortedAndFilteredRecords.forEach((r) => {
      if (r.type === 'income') {
        totalPemasukan += r.amount;
      } else {
        totalPengeluaran += r.amount;
        expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + r.amount;
      }
    });

    const saldoAkhir = totalPemasukan - totalPengeluaran;

    // Determine largest expense category
    let largestCategory = '-';
    let maxExpense = 0;

    Object.entries(expenseByCategory).forEach(([cat, amt]) => {
      if (amt > maxExpense) {
        maxExpense = amt;
        largestCategory = cat === 'subscription' ? 'Uang Langganan' : cat;
      }
    });

    // Compute running balance column for filtered rows
    let currentBalance = 0;
    const recordsWithRunningBalance = sortedAndFilteredRecords.map((r) => {
      if (r.type === 'income') {
        currentBalance += r.amount;
      } else {
        currentBalance -= r.amount;
      }
      return {
        ...r,
        runningBalance: currentBalance,
      };
    });

    return {
      totalPemasukan,
      totalPengeluaran,
      saldoAkhir,
      largestCategory,
      maxExpense,
      records: recordsWithRunningBalance,
    };
  }, [sortedAndFilteredRecords]);

  // Mock export alerts
  const handleExportPDF = () => {
    alert('📋 Fitur Ekspor Laporan Bulanan Uang Makan ke PDF sedang disiapkan.\nLaporan ditata rapi dengan grafik ringkasan biaya dapur.');
  };

  const handleExportExcel = () => {
    alert('📊 Fitur Ekspor Laporan Bulanan Uang Makan ke Excel (.xlsx) sedang dipersiapkan.\nFormat neraca saku dapur katering lengkap dengan rincian kategori belanja.');
  };

  const handleResetFilters = () => {
    setSelectedMonth('06');
    setSelectedYear('2026');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-green-950 font-serif">Laporan Uang Makan Bulanan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Analisis perputaran dana dapur, rekap belanja komoditi masakan katering, dan saldo pembukuan</p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl"
          >
            <FileText className="h-4 w-4" />
            Ekspor PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ekspor Excel
          </Button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-brand-cream-200 shadow-xs rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <span className="flex items-center gap-1.5 text-brand-green-950 font-bold text-xs uppercase tracking-wider">
            <Filter className="h-4 w-4 text-brand-green-800" />
            Filter Buku Kas Dapur
          </span>
          <button
            onClick={handleResetFilters}
            className="text-[10px] text-slate-400 font-bold hover:text-brand-green-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Month selector */}
          <div className="space-y-1">
            <label htmlFor="rep-meal-month" className="text-xs font-bold text-slate-500">Bulan</label>
            <select
              id="rep-meal-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Year selector */}
          <div className="space-y-1">
            <label htmlFor="rep-meal-year" className="text-xs font-bold text-slate-500">Tahun</label>
            <select
              id="rep-meal-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Expense Category selector */}
          <div className="space-y-1">
            <label htmlFor="rep-meal-cat" className="text-xs font-bold text-slate-500">Kategori Belanja</label>
            <select
              id="rep-meal-cat"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-brand-cream-100 rounded-2xl p-5 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Total Pemasukan</span>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-base font-black font-mono text-emerald-600">{formatCurrency(computations.totalPemasukan)}</span>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-5 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Total Pengeluaran</span>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
            <span className="text-base font-black font-mono text-rose-600">{formatCurrency(computations.totalPengeluaran)}</span>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-5 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Saldo Akhir</span>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="p-1.5 bg-brand-green-50 rounded-lg text-brand-green-900">
              <PiggyBank className="h-4 w-4" />
            </div>
            <span className="text-base font-black font-mono text-brand-green-950">{formatCurrency(computations.saldoAkhir)}</span>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-5 shadow-2xs space-y-1.5 col-span-2 md:col-span-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block font-sans">Kategori Terbesar</span>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <Award className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 truncate" title={computations.largestCategory}>
              {computations.largestCategory} {computations.maxExpense > 0 ? `(${formatCurrency(computations.maxExpense)})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* DATA TABLE LEDGER */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Laporan Neraca Buku Kas Katering Dapur</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[640px] md:min-w-full">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
                <th className="p-4 font-semibold">Tanggal</th>
                <th className="p-4 text-center font-semibold">Jenis Transaksi</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold">Keterangan</th>
                <th className="p-4 text-right font-semibold">Pemasukan</th>
                <th className="p-4 text-right font-semibold">Pengeluaran</th>
                <th className="p-4 text-right font-semibold">Saldo Kumulatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {computations.records.length > 0 ? (
                computations.records.map((row) => {
                  const isIncome = row.type === 'income';
                  const displayCategory = row.category === 'subscription' ? 'Uang Langganan' : row.category;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-mono font-medium text-slate-500">{row.date}</td>
                      <td className="p-4 text-center">
                        {/* Colored status badge for transaction types */}
                        <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{displayCategory}</td>
                      <td className="p-4 font-medium text-slate-600 max-w-sm truncate" title={row.description}>
                        {row.description}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-600">
                        {isIncome ? formatCurrency(row.amount) : '-'}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-rose-600">
                        {!isIncome ? formatCurrency(row.amount) : '-'}
                      </td>
                      <td className={`p-4 text-right font-mono font-bold ${row.runningBalance >= 0 ? 'text-brand-green-950' : 'text-rose-600'}`}>
                        {formatCurrency(row.runningBalance)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                    Tidak ada transaksi buku kas katering yang sesuai dengan filter di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
