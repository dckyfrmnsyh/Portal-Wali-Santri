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
      expenseByCategory,
      records: recordsWithRunningBalance,
    };
  }, [sortedAndFilteredRecords]);

  const generatePDFHTML = () => {
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.label || 'Semua Bulan';
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let rowsHTML = '';
    computations.records.forEach((row) => {
      const isIncome = row.type === 'income';
      const displayCategory = row.category === 'subscription' ? 'Uang Langganan' : row.category;
      rowsHTML += `
        <tr>
          <td style="font-family: monospace;">${row.date}</td>
          <td style="text-align: center;">${isIncome ? 'Pemasukan' : 'Pengeluaran'}</td>
          <td>${displayCategory}</td>
          <td>${row.description}</td>
          <td style="text-align: right; font-family: monospace;">${isIncome ? formatCurrency(row.amount) : '-'}</td>
          <td style="text-align: right; font-family: monospace;">${!isIncome ? formatCurrency(row.amount) : '-'}</td>
          <td style="text-align: right; font-family: monospace;">${formatCurrency(row.runningBalance)}</td>
        </tr>
      `;
    });

    if (computations.records.length === 0) {
      rowsHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 20px;">Tidak ada data transaksi.</td></tr>`;
    }

    const html = `
      <html>
      <head>
        <style>
          body { font-family: 'Georgia', 'Times New Roman', serif; color: #1e293b; padding: 20px; font-size: 11px; }
          .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { font-size: 16px; margin: 0; font-family: 'Times New Roman', serif; text-transform: uppercase; color: #14532d; }
          .header p { margin: 3px 0 0 0; font-size: 10px; color: #64748b; }
          .meta-info { margin-bottom: 15px; display: flex; justify-content: space-between; }
          .meta-info div { line-height: 1.5; }
          .summary-boxes { display: flex; gap: 15px; margin-bottom: 20px; }
          .summary-box { flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; }
          .summary-box span { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #64748b; }
          .summary-box p { margin: 5px 0 0 0; font-size: 12px; font-weight: bold; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { border-bottom: 2px solid #0f172a; padding: 6px; font-weight: bold; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; }
          td { border-bottom: 1px solid #e2e8f0; padding: 6px; vertical-align: top; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; }
          .sig-block { text-align: center; width: 200px; }
          .sig-space { height: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Pondok Pesantren Al-Khairaat Tana Tidung</h1>
          <p>Alamat: RT 03 Desa Tideng Pale Timur, Kec. Sesayap, Kabupaten Tana Tidung, Kalimantan Utara</p>
          <p style="font-weight: bold; color: #0f172a; margin-top: 5px;">LAPORAN BUKU KAS KATERING DAPUR (UANG MAKAN)</p>
        </div>
        <div class="meta-info">
          <div>
            <strong>Periode Laporan:</strong> ${monthName} ${selectedYear}<br/>
            <strong>Kategori Belanja:</strong> ${selectedCategory === 'all' ? 'Semua Kategori' : selectedCategory}
          </div>
          <div>
            <strong>Tanggal Cetak:</strong> ${dateStr}<br/>
            <strong>Dicetak Oleh:</strong> Pengurus Dapur/Katering
          </div>
        </div>
        <div class="summary-boxes">
          <div class="summary-box">
            <span>Total Pemasukan</span>
            <p style="color: #16a34a;">${formatCurrency(computations.totalPemasukan)}</p>
          </div>
          <div class="summary-box">
            <span>Total Pengeluaran</span>
            <p style="color: #dc2626;">${formatCurrency(computations.totalPengeluaran)}</p>
          </div>
          <div class="summary-box">
            <span>Saldo Kas Akhir</span>
            <p>${formatCurrency(computations.saldoAkhir)}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th style="text-align: center;">Jenis</th>
              <th>Kategori</th>
              <th>Keterangan</th>
              <th style="text-align: right;">Pemasukan</th>
              <th style="text-align: right;">Pengeluaran</th>
              <th style="text-align: right;">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
        <div class="footer-sig">
          <div class="sig-block">
            <p>Mengetahui,</p>
            <p style="font-weight: bold;">Bendahara Pesantren</p>
            <div class="sig-space"></div>
            <p style="text-decoration: underline; font-weight: bold;">( _______________________ )</p>
          </div>
          <div class="sig-block">
            <p>Tana Tidung, ${dateStr}</p>
            <p style="font-weight: bold;">Kepala Pengurus Dapur</p>
            <div class="sig-space"></div>
            <p style="text-decoration: underline; font-weight: bold;">( _______________________ )</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  };

  const handleExportPDF = async () => {
    const htmlContent = generatePDFHTML();
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.label || 'Semua_Bulan';
    const fileName = `Laporan_Kas_Dapur_${monthName}_${selectedYear}`;
    const opt = {
      margin: 10,
      filename: `${fileName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape' as const, unit: 'mm', format: 'a4' },
    };
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
    } finally {
      document.body.removeChild(element);
    }
  };

  const handleExportExcel = async () => {
    if (computations.records.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    const exportData = computations.records.map((row) => ({
      'Tanggal': row.date,
      'Jenis': row.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Kategori': row.category === 'subscription' ? 'Uang Langganan' : row.category,
      'Keterangan': row.description,
      'Pemasukan (IDR)': row.type === 'income' ? row.amount : 0,
      'Pengeluaran (IDR)': row.type === 'expense' ? row.amount : 0,
      'Saldo Kumulatif (IDR)': row.runningBalance,
      'Kuantitas': row.quantity || '',
      'Satuan': row.unit || '',
      'Harga Satuan (IDR)': row.pricePerUnit || '',
      'Supplier': row.supplierName || '',
    }));
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kas Dapur Katering');
      const monthName = monthOptions.find(m => m.value === selectedMonth)?.label || 'Semua_Bulan';
      const fileName = `Laporan_Kas_Dapur_${monthName}_${selectedYear}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err);
    }
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

      {/* CATEGORY EXPENSES BREAKDOWN PROGRESS LIST */}
      {computations.totalPengeluaran > 0 && (
        <div className="bg-white border border-brand-cream-200 shadow-xs rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Proporsi Biaya Pengeluaran Dapur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(computations.expenseByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const percentage = computations.totalPengeluaran > 0 ? (amt / computations.totalPengeluaran) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700">{cat}</span>
                      <span className="font-mono text-slate-500 font-semibold">{formatCurrency(amt)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand-green-900 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

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
