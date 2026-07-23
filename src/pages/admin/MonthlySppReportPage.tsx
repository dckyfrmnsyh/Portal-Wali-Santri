import React, { useState, useMemo } from 'react';
import { Calendar, DollarSign, Users, CheckCircle2, AlertCircle, FileText, FileSpreadsheet, Filter, RefreshCw } from 'lucide-react';
import { Student } from '../../types/student';
import { SppBill } from '../../types/spp';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

interface MonthlySppReportPageProps {
  students: Student[];
  bills: SppBill[];
}

export const MonthlySppReportPage: React.FC<MonthlySppReportPageProps> = ({ students, bills }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('Juli');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026/2027');
  const [selectedJenjang, setSelectedJenjang] = useState<'all' | 'SMP' | 'SMA'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const monthOptions = [
    { value: 'all', label: 'Semua Bulan' },
    { value: 'Januari', label: 'Januari' },
    { value: 'Februari', label: 'Februari' },
    { value: 'Maret', label: 'Maret' },
    { value: 'April', label: 'April' },
    { value: 'Mei', label: 'Mei' },
    { value: 'Juni', label: 'Juni' },
    { value: 'Juli', label: 'Juli' },
    { value: 'Agustus', label: 'Agustus' },
    { value: 'September', label: 'September' },
    { value: 'Oktober', label: 'Oktober' },
    { value: 'November', label: 'November' },
    { value: 'Desember', label: 'Desember' },
  ];

  const academicYearOptions = [
    { value: 'all', label: 'Semua T.A.' },
    { value: '2025/2026', label: 'T.A. 2025/2026' },
    { value: '2026/2027', label: 'T.A. 2026/2027' },
    { value: '2027/2028', label: 'T.A. 2027/2028' },
  ];

  const jenjangOptions = [
    { value: 'all', label: 'Semua Jenjang (SMP/SMA)' },
    { value: 'SMP', label: 'SMP' },
    { value: 'SMA', label: 'SMA' },
  ];

  const gradeOptions = [
    { value: 'all', label: 'Semua Kelas' },
    { value: '7-A SMP', label: 'Kelas 7-A SMP' },
    { value: '7-B SMP', label: 'Kelas 7-B SMP' },
    { value: '8-A SMP', label: 'Kelas 8-A SMP' },
    { value: '8-B SMP', label: 'Kelas 8-B SMP' },
    { value: '9-A SMP', label: 'Kelas 9-A SMP' },
    { value: '10-A SMA', label: 'Kelas 10-A SMA' },
    { value: '10-B SMA', label: 'Kelas 10-B SMA' },
    { value: '11 SMA', label: 'Kelas 11 SMA' },
    { value: '12 SMA', label: 'Kelas 12 SMA' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'Lunas', label: 'Lunas' },
    { value: 'Belum Lunas', label: 'Belum Lunas' },
    { value: 'Cicilan', label: 'Cicilan Berjalan' },
    { value: 'Menunggak', label: 'Menunggak (Lewat Jatuh Tempo)' },
  ];

  // Helper to map student grade to Jenjang
  const checkJenjang = (g: string) => {
    const gl = g.toLowerCase();
    if (gl.includes('smp') || gl.includes('vii') || gl.includes('viii') || gl.includes('ix')) {
      return 'SMP';
    }
    return 'SMA';
  };

  // Filter bills and map with student profiles
  const processedData = useMemo(() => {
    return bills
      .map((bill) => {
        const student = students.find((s) => s.id === bill.studentId);
        if (!student) return null;

        const jenjang = checkJenjang(student.grade);
        const sisa = bill.amount - bill.paidAmount;

        // Determine status with proper overdue handling
        let statusText = 'Belum Lunas';
        const today = new Date().toISOString().split('T')[0];
        const isOverdue = bill.dueDate ? bill.dueDate < today : false;

        if (sisa === 0) {
          // Fully paid
          statusText = 'Lunas';
        } else if (isOverdue) {
          // Past due date with remaining balance = Menunggak
          statusText = 'Menunggak';
        } else if (bill.paidAmount > 0) {
          // Partially paid but not overdue = Cicilan
          statusText = 'Cicilan';
        } else {
          // Not paid and not overdue = Belum Lunas
          statusText = 'Belum Lunas';
        }

        return {
          ...bill,
          studentName: student.name,
          studentNisn: student.nisn,
          studentGrade: student.grade,
          studentJenjang: jenjang,
          studentAcademicYear: student.academicYear || '2026/2027',
          sisa,
          statusText,
        };
      })
      .filter((b): b is NonNullable<typeof b> => {
        if (!b) return false;

        // Apply filters
        if (selectedMonth !== 'all' && b.month !== selectedMonth) return false;
        if (selectedAcademicYear !== 'all' && b.studentAcademicYear !== selectedAcademicYear) return false;
        if (selectedJenjang !== 'all' && b.studentJenjang !== selectedJenjang) return false;
        if (selectedGrade !== 'all' && b.studentGrade !== selectedGrade) return false;
        
        if (selectedStatus !== 'all') {
          if (selectedStatus === 'Lunas' && b.statusText !== 'Lunas') return false;
          if (selectedStatus === 'Belum Lunas' && b.statusText !== 'Belum Lunas') return false;
          if (selectedStatus === 'Cicilan' && b.statusText !== 'Cicilan') return false;
          if (selectedStatus === 'Menunggak' && b.statusText !== 'Menunggak') return false;
        }

        return true;
      });
  }, [bills, students, selectedMonth, selectedAcademicYear, selectedJenjang, selectedGrade, selectedStatus]);

  // Aggregate statistics
  const summary = useMemo(() => {
    let totalTagihan = 0;
    let totalDibayar = 0;
    let totalSisa = 0;
    let lunasCount = 0;
    let menunggakCount = 0;

    processedData.forEach((b) => {
      totalTagihan += b.amount;
      totalDibayar += b.paidAmount;
      totalSisa += b.sisa;

      if (b.statusText === 'Lunas') {
        lunasCount++;
      } else if (b.statusText === 'Menunggak') {
        menunggakCount++;
      }
    });

    return {
      totalTagihan,
      totalDibayar,
      totalSisa,
      lunasCount,
      menunggakCount,
      totalStudents: processedData.length,
    };
  }, [processedData]);

  // Generate HTML content for PDF
  const generatePDFHTML = () => {
    const dateStr = new Date().toLocaleDateString('id-ID');
    const monthDisplay = selectedMonth === 'all' ? 'Semua Bulan' : selectedMonth;
    
    const tableRows = processedData.map((row, idx) => {
      const statusClass = row.statusText === 'Lunas' 
        ? 'status-lunas' 
        : row.statusText === 'Cicilan' 
          ? 'status-cicilan' 
          : 'status-belum';
      
      const jenjangClass = row.studentJenjang === 'SMA' ? 'tag-sma' : 'tag-smp';
      
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-bold">${row.studentName}</td>
          <td>${row.studentNisn}</td>
          <td class="text-center"><span class="tag-jenjang ${jenjangClass}">${row.studentJenjang}</span></td>
          <td>${row.studentGrade}</td>
          <td class="text-right text-bold">${formatCurrency(row.amount)}</td>
          <td class="text-right text-green">${formatCurrency(row.paidAmount)}</td>
          <td class="text-right ${row.sisa > 0 ? 'text-red' : ''}">${row.sisa > 0 ? formatCurrency(row.sisa) : '-'}</td>
          <td class="text-center"><span class="status ${statusClass}">${row.statusText}</span></td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Laporan SPP Bulanan - Ponpes Al-Khairaat</title>
          <style>
              body {
                  background-color: #fafcfb;
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  color: #333;
                  margin: 0;
                  padding: 15mm;
              }
              * { box-sizing: border-box; }
              
              @media print {
                  body { background-color: white; padding: 0; }
                  @page { size: A4; margin: 15mm 12mm; }
              }

              .instansi-header {
                  border-bottom: 3px double #005c3c;
                  padding-bottom: 12px;
                  margin-bottom: 15px;
              }
              .instansi-title {
                  font-size: 16pt;
                  font-weight: bold;
                  color: #005c3c;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  text-align: center;
                  margin: 0;
              }
              .instansi-subtitle {
                  font-size: 10pt;
                  color: #ff9800;
                  font-weight: bold;
                  text-transform: uppercase;
                  text-align: center;
                  margin-top: 3px;
              }

              .report-title-section {
                  margin-bottom: 20px;
              }
              .report-title {
                  color: #111;
                  margin: 0;
                  font-size: 20pt;
                  font-weight: bold;
                  text-align: center;
              }
              .report-desc {
                  color: #666;
                  margin: 4px 0 10px 0;
                  font-size: 10pt;
                  font-style: italic;
                  text-align: center;
              }

              .meta-table {
                  width: 100%;
                  margin-bottom: 15px;
                  font-size: 9.5pt;
                  background: #f1f5f3;
                  border-radius: 6px;
                  padding: 10px 15px;
                  border: 1px solid #e0e8e4;
              }
              .meta-table table {
                  width: 100%;
                  border-collapse: collapse;
              }
              .meta-table td {
                  padding: 4px 0;
                  border: none;
              }

              .summary-container {
                  width: 100%;
                  margin-bottom: 20px;
                  display: flex;
                  justify-content: space-between;
                  gap: 15px;
              }
              .summary-card {
                  flex: 1;
                  background: #ffffff;
                  border: 1px solid #d0ded7;
                  border-radius: 6px;
                  padding: 12px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
              }
              .summary-title {
                  font-size: 7.5pt;
                  font-weight: bold;
                  color: #666;
                  text-transform: uppercase;
                  margin-bottom: 4px;
              }
              .summary-value {
                  font-size: 13pt;
                  font-weight: bold;
                  color: #005c3c;
              }
              .summary-value.red { color: #d32f2f; }
              .summary-value.green { color: #00897b; }
              .summary-sub {
                  font-size: 7pt;
                  color: #999;
                  margin-top: 3px;
              }

              table.data-table {
                  width: 100%;
                  border-collapse: collapse;
                  background: #fff;
                  border-radius: 6px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                  font-size: 9pt;
                  border: 1px solid #e0eae5;
              }
              table.data-table th {
                  background-color: #005c3c;
                  color: #ffffff;
                  padding: 10px 8px;
                  text-align: left;
                  font-weight: bold;
                  font-size: 9.5pt;
                  border-bottom: 2px solid #00442c;
              }
              table.data-table td {
                  padding: 10px 8px;
                  border-bottom: 1px solid #eaeaea;
                  color: #333;
              }
              table.data-table tr:nth-child(even) { background-color: #f7fbf9; }

              .tag-jenjang {
                  font-size: 8pt;
                  padding: 3px 8px;
                  border-radius: 4px;
                  font-weight: bold;
              }
              .tag-sma { background: #fff4e5; color: #ff9800; border: 1px solid #ffe0b2; }
              .tag-smp { background: #e3f2fd; color: #2196f3; border: 1px solid #bbdefb; }

              .status {
                  font-size: 8pt;
                  padding: 4px 10px;
                  border-radius: 12px;
                  font-weight: bold;
                  text-align: center;
                  display: inline-block;
              }
              .status-lunas { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
              .status-cicilan { background: #f3e5f5; color: #7b1fa2; border: 1px solid #e1bee7; }
              .status-belum { background: #eceff1; color: #455a64; border: 1px solid #cfd8dc; }
              
              .text-right { text-align: right !important; }
              .text-center { text-align: center !important; }
              .text-red { color: #d32f2f; font-weight: bold; }
              .text-green { color: #00897b; font-weight: bold; }
              .text-bold { font-weight: bold; }

              .footer-signatures {
                  margin-top: 30px;
                  width: 100%;
                  font-size: 9.5pt;
                  display: flex;
                  justify-content: space-between;
              }
              .signature-block {
                  width: 250px;
              }
              .signature-block.right {
                  text-align: right;
              }
              .signature-space {
                  height: 70px;
              }
          </style>
      </head>
      <body>
          <div class="instansi-header">
              <div class="instansi-title">Pondok Pesantren Al-Khairaat</div>
              <div class="instansi-subtitle">Portal Ponpes Tana Tidung • Kabupaten Tana Tidung</div>
          </div>

          <div class="report-title-section">
              <h1 class="report-title">Laporan SPP Bulanan</h1>
              <p class="report-desc">Audit ringkasan tagihan, realisasi pembayaran, dan pemantauan santri menunggak.</p>
          </div>

          <div class="meta-table">
              <table>
                  <tr>
                      <td style="width: 15%; font-weight: bold; color: #555;">Periode Laporan</td>
                      <td style="width: 2%; color: #555;">:</td>
                      <td style="width: 33%; font-weight: bold; color: #005c3c;">${monthDisplay} ${selectedAcademicYear}</td>
                      
                      <td style="width: 15%; font-weight: bold; color: #555;">Tanggal Cetak</td>
                      <td style="width: 2%; color: #555;">:</td>
                      <td style="width: 33%; color: #333;">${dateStr}</td>
                  </tr>
                  <tr>
                      <td style="font-weight: bold; color: #555;">Tahun Ajaran</td>
                      <td>:</td>
                      <td style="color: #333;">${selectedAcademicYear}</td>
                      
                      <td style="font-weight: bold; color: #555;">Status Dokumen</td>
                      <td>:</td>
                      <td style="color: #2e7d32; font-weight: bold;">Final / Resmi</td>
                  </tr>
              </table>
          </div>

          <div class="summary-container">
              <div class="summary-card">
                  <div class="summary-title">TOTAL TAGIHAN</div>
                  <div class="summary-value">${formatCurrency(summary.totalTagihan)}</div>
                  <div class="summary-sub">Periode filter aktif</div>
              </div>
              <div class="summary-card">
                  <div class="summary-title">TOTAL DIBAYAR</div>
                  <div class="summary-value green">${formatCurrency(summary.totalDibayar)}</div>
                  <div class="summary-sub">Realisasi terkumpul</div>
              </div>
              <div class="summary-card">
                  <div class="summary-title">TOTAL SISA</div>
                  <div class="summary-value red">${formatCurrency(summary.totalSisa)}</div>
                  <div class="summary-sub">Piutang belum tertagih</div>
              </div>
              <div class="summary-card">
                  <div class="summary-title">SANTRI LUNAS</div>
                  <div class="summary-value green">${summary.lunasCount} Santri</div>
                  <div class="summary-sub">Dari ${summary.totalStudents} terfilter</div>
              </div>
              <div class="summary-card">
                  <div class="summary-title" style="color:#d32f2f;">SANTRI MENUNGGAK</div>
                  <div class="summary-value" style="color:#ff9800;">${summary.menunggakCount} Santri</div>
                  <div class="summary-sub">Lewat jatuh tempo</div>
              </div>
          </div>

          <table class="data-table">
              <thead>
                  <tr>
                      <th width="4%" class="text-center">No</th>
                      <th width="18%">Nama Santri</th>
                      <th width="12%">NISN</th>
                      <th width="8%" class="text-center">Jenjang</th>
                      <th width="10%">Kelas</th>
                      <th width="12%" class="text-right">Nominal Tagihan</th>
                      <th width="12%" class="text-right">Total Dibayar</th>
                      <th width="12%" class="text-right">Sisa</th>
                      <th width="12%" class="text-center">Status</th>
                  </tr>
              </thead>
              <tbody>
                  ${tableRows}
              </tbody>
          </table>

          <div class="footer-signatures">
              <div class="signature-block">
                  <p>Mengetahui,</p>
                  <p style="font-weight: bold;">Bendahara Pesantren</p>
                  <div class="signature-space"></div>
                  <p style="text-decoration: underline; font-weight: bold;">( _______________________ )</p>
              </div>
              <div class="signature-block right">
                  <p>Tana Tidung, ${dateStr}</p>
                  <p style="font-weight: bold;">Kepala Sekolah</p>
                  <div class="signature-space"></div>
                  <p style="text-decoration: underline; font-weight: bold;">( _______________________ )</p>
              </div>
          </div>
      </body>
      </html>
    `;

    return html;
  };

  // Handle PDF export click
  const handleExportPDF = async () => {
    const htmlContent = generatePDFHTML();
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    const monthDisplay = selectedMonth === 'all' ? 'Semua_Bulan' : selectedMonth;
    const fileName = `Laporan_SPP_${monthDisplay}_${selectedAcademicYear.replace('/', '_')}`;

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
    if (processedData.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    const exportData = processedData.map((row) => ({
      'Nama Santri': row.studentName,
      'NISN': row.studentNisn,
      'Kelas': row.studentGrade,
      'Jenjang': row.studentJenjang,
      'Bulan': row.month,
      'Tahun': row.year,
      'Nominal SPP': row.amount,
      'Terbayar': row.paidAmount,
      'Sisa': row.sisa,
      'Status': row.statusText,
      'Jatuh Tempo': row.dueDate,
    }));
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan SPP');
      const monthDisplay = selectedMonth === 'all' ? 'Semua_Bulan' : selectedMonth;
      const fileName = `Laporan_SPP_${monthDisplay}_${selectedAcademicYear.replace('/', '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err);
    }
  };

  // Reset Filters helper
  const handleResetFilters = () => {
    setSelectedMonth('Juli');
    setSelectedAcademicYear('2026/2027');
    setSelectedJenjang('all');
    setSelectedGrade('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-green-950 font-serif">Laporan SPP Bulanan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Audit ringkasan tagihan, realisasi pembayaran, dan pemantauan santri menunggak</p>
        </div>

        {/* Mockup export buttons */}
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

      {/* FILTERS CARD */}
      <div className="bg-white border border-brand-cream-200 shadow-xs rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-brand-green-950 font-bold text-xs uppercase tracking-wider">
            <Filter className="h-4 w-4 text-brand-green-800" />
            Filter Data Laporan
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[10px] text-slate-400 font-bold hover:text-brand-green-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Atur Ulang
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Month Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-month" className="text-[11px] font-bold text-slate-500">Bulan</label>
            <select
              id="rep-spp-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Academic Year Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-ay" className="text-[11px] font-bold text-slate-500">Tahun Ajaran</label>
            <select
              id="rep-spp-ay"
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {academicYearOptions.map((ay) => (
                <option key={ay.value} value={ay.value}>{ay.label}</option>
              ))}
            </select>
          </div>

          {/* Jenjang Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-jenjang" className="text-[11px] font-bold text-slate-500">Jenjang</label>
            <select
              id="rep-spp-jenjang"
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value as any)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {jenjangOptions.map((j) => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </div>

          {/* Grade Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-grade" className="text-[11px] font-bold text-slate-500">Kelas</label>
            <select
              id="rep-spp-grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {gradeOptions.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label htmlFor="rep-spp-status" className="text-[11px] font-bold text-slate-500">Status</label>
            <select
              id="rep-spp-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Tagihan</span>
            <div className="p-1 bg-slate-50 rounded-lg text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-slate-900">{formatCurrency(summary.totalTagihan)}</p>
            <p className="text-[9px] text-slate-400">Periode filter aktif</p>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Dibayar</span>
            <div className="p-1 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-emerald-600">{formatCurrency(summary.totalDibayar)}</p>
            <p className="text-[9px] text-slate-400">Realisasi terkumpul</p>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Sisa</span>
            <div className="p-1 bg-rose-50 rounded-lg text-rose-600">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-rose-600">{formatCurrency(summary.totalSisa)}</p>
            <p className="text-[9px] text-slate-400">Piutang belum tertagih</p>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Santri Lunas</span>
            <div className="p-1 bg-teal-50 rounded-lg text-teal-600">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-teal-600">{summary.lunasCount} Santri</p>
            <p className="text-[9px] text-slate-400">Dari {summary.totalStudents} terfilter</p>
          </div>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs col-span-2 md:col-span-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Santri Menunggak</span>
            <div className="p-1 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-amber-600">{summary.menunggakCount} Santri</p>
            <p className="text-[9px] text-slate-400">Lewat jatuh tempo</p>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[640px] md:min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="p-4 text-center font-semibold w-12">No</th>
                <th className="p-4 font-semibold">Nama Santri</th>
                <th className="p-4 font-semibold">NISN</th>
                <th className="p-4 text-center font-semibold">Jenjang</th>
                <th className="p-4 font-semibold">Kelas</th>
                <th className="p-4 text-right font-semibold">Nominal Tagihan</th>
                <th className="p-4 text-right font-semibold">Total Dibayar</th>
                <th className="p-4 text-right font-semibold">Sisa</th>
                <th className="p-4 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {processedData.length > 0 ? (
                processedData.map((row, idx) => {
                  let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                  if (row.statusText === 'Lunas') {
                    statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (row.statusText === 'Cicilan') {
                    statusBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  } else if (row.statusText === 'Menunggak') {
                    statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                  }

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/40">
                      <td className="p-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-4 font-bold text-brand-green-950 font-serif">{row.studentName}</td>
                      <td className="p-4 font-mono font-semibold text-slate-500">{row.studentNisn}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 border rounded-full ${
                          row.studentJenjang === 'SMP' 
                            ? 'bg-indigo-50/50 text-indigo-700 border-indigo-100' 
                            : 'bg-amber-50/50 text-amber-700 border-amber-100'
                        }`}>
                          {row.studentJenjang}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{row.studentGrade}</td>
                      <td className="p-4 text-right font-mono font-semibold text-slate-800">{formatCurrency(row.amount)}</td>
                      <td className="p-4 text-right font-mono text-emerald-600 font-semibold">{formatCurrency(row.paidAmount)}</td>
                      <td className={`p-4 text-right font-mono font-bold ${row.sisa > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                        {row.sisa > 0 ? formatCurrency(row.sisa) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${statusBadge}`}>
                          {row.statusText === 'Cicilan' ? 'Cicilan' : row.statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                    Tidak ada data tagihan SPP yang cocok dengan filter di atas.
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
