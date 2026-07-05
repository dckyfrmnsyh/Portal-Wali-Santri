import React, { useState, useMemo } from 'react';
import { FileDown } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { SppBill } from '../../types/spp';
import { formatCurrency } from '../../utils/formatCurrency';
import { getSppStatusLabel, getSppStatusColor } from '../../utils/statusHelper';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface GuardianYearlyReportProps {
  bills: SppBill[];
  academicYear?: string;
}

export const GuardianYearlyReport: React.FC<GuardianYearlyReportProps> = ({
  bills,
  academicYear = '2026/2027',
}) => {
  const [downloading, setDownloading] = useState(false);

  // Calculate summary statistics
  const summary = useMemo(() => {
    let totalTagihan = 0;
    let totalDibayar = 0;
    let totalSisa = 0;
    let lunasCount = 0;

    bills.forEach((bill) => {
      totalTagihan += bill.amount;
      totalDibayar += bill.paidAmount;
      const sisa = bill.amount - bill.paidAmount;
      totalSisa += sisa;

      if (sisa === 0) {
        lunasCount++;
      }
    });

    return {
      totalTagihan,
      totalDibayar,
      totalSisa,
      lunasCount,
      totalBills: bills.length,
      completionPercentage: bills.length > 0 ? Math.round((lunasCount / bills.length) * 100) : 0,
    };
  }, [bills]);

  const getLastValidationDate = (bill: SppBill) => {
    if (bill.installments && bill.installments.length > 0) {
      return bill.installments[bill.installments.length - 1].paymentDate;
    }
    return '-';
  };

  const generatePDFHTML = () => {
    const dateStr = new Date().toLocaleDateString('id-ID');
    
    const tableRows = bills.map((bill, idx) => {
      const sisa = bill.amount - bill.paidAmount;
      const statusLabel = getSppStatusLabel(bill.status);
      const statusColor = getSppStatusColor(bill.status);
      const lastValidationDate = getLastValidationDate(bill);
      
      // Determine background color based on status
      let rowBg = idx % 2 === 0 ? '#ffffff' : '#f7fbf9';
      if (statusColor.includes('emerald')) rowBg = '#f0fdf4';
      else if (statusColor.includes('amber')) rowBg = '#fffbeb';
      else if (statusColor.includes('rose')) rowBg = '#fef2f2';
      else if (statusColor.includes('indigo')) rowBg = '#eef2ff';
      
      // Determine cell colors
      let sisaTextColor = sisa > 0 ? '#d32f2f' : '#00897b';
      let sisaText = sisa > 0 ? formatCurrency(sisa) : 'Lunas';
      
      // Determine status badge colors
      let badgeBorderColor = '#e0e0e0';
      let badgeTextColor = '#374151';
      if (statusColor.includes('emerald')) {
        badgeBorderColor = '#c8e6c9';
        badgeTextColor = '#1b5e20';
      } else if (statusColor.includes('amber')) {
        badgeBorderColor = '#f3e8b5';
        badgeTextColor = '#854d0e';
      } else if (statusColor.includes('rose')) {
        badgeBorderColor = '#f3c6c6';
        badgeTextColor = '#7f1d1d';
      } else if (statusColor.includes('indigo')) {
        badgeBorderColor = '#c7d2fe';
        badgeTextColor = '#4338ca';
      }
      
      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #eaeaea;">
          <td style="text-align: center; font-family: monospace; color: #666666; padding: 10px 8px;">${idx + 1}</td>
          <td style="font-weight: bold; color: #005c3c; padding: 10px 8px;">${bill.month} ${bill.year}</td>
          <td style="font-weight: bold; color: #333333; font-family: monospace; text-align: right; padding: 10px 8px;">${formatCurrency(bill.amount)}</td>
          <td style="font-weight: bold; color: #00897b; font-family: monospace; text-align: right; padding: 10px 8px;">${formatCurrency(bill.paidAmount)}</td>
          <td style="font-weight: bold; color: ${sisaTextColor}; font-family: monospace; text-align: right; padding: 10px 8px;">${sisaText}</td>
          <td style="text-align: center; padding: 10px 8px;">
            <span style="display: inline-block; padding: 3px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; border: 1px solid ${badgeBorderColor}; color: ${badgeTextColor};">${statusLabel}</span>
          </td>
          <td style="font-family: monospace; color: #666666; text-align: center; padding: 10px 8px;">${lastValidationDate}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Laporan SPP Per Siswa - Tahun Ajaran ${academicYear}</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  color: #333333;
                  margin: 0;
                  padding: 20px;
              }
              * { box-sizing: border-box; }
              
              @media print {
                  body { padding: 0; }
                  @page { size: A4; margin: 15mm 12mm; }
              }

              .header-section {
                  border-bottom: 3px double #005c3c;
                  padding-bottom: 12px;
                  margin-bottom: 20px;
              }
              .institution-title {
                  font-size: 16pt;
                  font-weight: bold;
                  color: #005c3c;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  text-align: center;
                  margin: 0;
              }
              .institution-subtitle {
                  font-size: 10pt;
                  color: #ff9800;
                  font-weight: bold;
                  text-transform: uppercase;
                  text-align: center;
                  margin-top: 3px;
              }

              .report-info {
                  margin-bottom: 20px;
              }
              .report-title {
                  font-size: 14pt;
                  font-weight: bold;
                  color: #111111;
                  text-align: center;
                  margin: 0 0 10px 0;
              }
              .report-desc {
                  font-size: 10pt;
                  color: #666666;
                  text-align: center;
                  margin: 0 0 15px 0;
                  font-style: italic;
              }
              .meta-info {
                  font-size: 9pt;
                  text-align: center;
                  color: #555555;
                  margin: 0;
              }

              .summary-cards {
                  display: flex;
                  justify-content: space-between;
                  gap: 15px;
                  margin-bottom: 25px;
              }
              .summary-card {
                  flex: 1;
                  background: #ffffff;
                  border: 1px solid #d0ded7;
                  border-radius: 6px;
                  padding: 12px;
                  text-align: center;
              }
              .summary-card-title {
                  font-size: 8pt;
                  font-weight: bold;
                  color: #666666;
                  text-transform: uppercase;
                  margin-bottom: 6px;
              }
              .summary-card-value {
                  font-size: 12pt;
                  font-weight: bold;
                  color: #005c3c;
                  margin: 5px 0;
              }
              .summary-card-note {
                  font-size: 7pt;
                  color: #666666;
                  margin-top: 4px;
              }

              .data-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 30px;
                  font-size: 9pt;
                  border: 1px solid #e0eae5;
              }
              .data-table th {
                  background-color: #005c3c;
                  color: #ffffff;
                  padding: 10px 8px;
                  text-align: left;
                  font-weight: bold;
                  font-size: 9.5pt;
                  border-bottom: 2px solid #00442c;
              }
              .data-table td {
                  padding: 10px 8px;
                  border-bottom: 1px solid #eaeaea;
                  color: #333333;
              }

              .signature-section {
                  margin-top: 40px;
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
              .signature-line {
                  margin-top: 60px;
                  border-top: 1px solid #333333;
                  padding-top: 5px;
              }
          </style>
      </head>
      <body>
          <div class="header-section">
              <div class="institution-title">Pondok Pesantren Al-Khairaat</div>
              <div class="institution-subtitle">Portal Ponpes Tana Tidung - Kabupaten Tana Tidung</div>
          </div>

          <div class="report-info">
              <h1 class="report-title">Laporan SPP Per Siswa</h1>
              <p class="report-desc">Rekapitulasi transaksi SPP per tahun ajaran untuk wali santri</p>
              <p class="meta-info">Tahun Ajaran: ${academicYear} | Tanggal Cetak: ${dateStr}</p>
          </div>

          <div class="summary-cards">
              <div class="summary-card">
                  <div class="summary-card-title">Total Tagihan</div>
                  <div class="summary-card-value" style="color: #005c3c;">${formatCurrency(summary.totalTagihan)}</div>
                  <div class="summary-card-note">Seluruh tahun ajaran</div>
              </div>
              <div class="summary-card">
                  <div class="summary-card-title">Total Dibayar</div>
                  <div class="summary-card-value" style="color: #00897b;">${formatCurrency(summary.totalDibayar)}</div>
                  <div class="summary-card-note">Realisasi pembayaran</div>
              </div>
              <div class="summary-card">
                  <div class="summary-card-title">Total Sisa</div>
                  <div class="summary-card-value" style="color: #d32f2f;">${formatCurrency(summary.totalSisa)}</div>
                  <div class="summary-card-note">Piutang belum lunas</div>
              </div>
              <div class="summary-card">
                  <div class="summary-card-title">Status Kelunasan</div>
                  <div class="summary-card-value" style="color: #00897b;">${summary.completionPercentage}%</div>
                  <div class="summary-card-note">${summary.lunasCount} dari ${summary.totalBills} bulan lunas</div>
              </div>
          </div>

          <table class="data-table">
              <thead>
                  <tr>
                      <th style="text-align: center; width: 5%;">No</th>
                      <th style="width: 18%;">Bulan</th>
                      <th style="text-align: right; width: 14%;">Nominal Tagihan</th>
                      <th style="text-align: right; width: 14%;">Total Dibayar</th>
                      <th style="text-align: right; width: 14%;">Sisa</th>
                      <th style="text-align: center; width: 15%;">Status</th>
                      <th style="text-align: center; width: 20%;">Tanggal Validasi Terakhir</th>
                  </tr>
              </thead>
              <tbody>
                  ${tableRows}
              </tbody>
          </table>

          <div class="signature-section">
              <div class="signature-block">
                  <p>Diterbitkan oleh,</p>
                  <p style="font-weight: bold;">Administrasi Pesantren</p>
                  <div class="signature-line"></div>
                  <p style="text-decoration: underline; font-weight: bold;">( _______________________ )</p>
              </div>
              <div class="signature-block right">
                  <p>Tana Tidung, ${dateStr}</p>
                  <p style="font-weight: bold;">Mengetahui,</p>
                  <p style="font-weight: bold;">Kepala Sekolah</p>
                  <div class="signature-line"></div>
                  <p style="text-decoration: underline; font-weight: bold;">( _______________________ )</p>
              </div>
          </div>
      </body>
      </html>
    `;

    return html;
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    
    try {
      const htmlContent = generatePDFHTML();
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      document.body.appendChild(element);

      const fileName = `Laporan_SPP_Per_Siswa_Tahun_Ajaran_${academicYear.replace('/', '_')}`;

      const opt = {
        margin: 10,
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm', format: 'a4' },
      };

      html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF.');
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-cream-200 shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-brand-cream-100 bg-brand-cream-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-brand-green-950 font-serif text-sm">Rekap SPP Per Tahun Ajaran</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Ringkasan transaksi historis Anda untuk Tahun Ajaran {academicYear}
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
            downloading
              ? 'bg-brand-cream-50 text-brand-green-950 border-brand-cream-200'
              : 'bg-brand-green-900 text-white hover:bg-brand-green-800 hover:shadow-md border-brand-green-950 active:scale-[0.98]'
          }`}
        >
          <FileDown className={`h-4 w-4 ${downloading ? 'animate-bounce' : ''}`} />
          <span>{downloading ? 'Mempersiapkan PDF...' : 'Download Rekap PDF'}</span>
        </button>
      </div>

      {/* Desktop/Tablet */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px] lg:min-w-full">
            <thead>
              <tr className="bg-brand-cream-50/30 border-b border-brand-cream-100 text-[10px] font-bold text-brand-green-950 uppercase tracking-wider">
                <th className="px-6 py-4">Bulan</th>
                <th className="px-6 py-4 text-right">Nominal Tagihan</th>
                <th className="px-6 py-4 text-right">Total Dibayar</th>
                <th className="px-6 py-4 text-right">Sisa</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Tanggal Validasi Terakhir</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-cream-100 text-xs text-slate-700">
              {bills.length > 0 ? (
                bills.map((bill) => {
                  const sisa = bill.amount - bill.paidAmount;
                  const statusLabel = getSppStatusLabel(bill.status);
                  const statusColor = getSppStatusColor(bill.status);
                  const lastValidationDate = getLastValidationDate(bill);

                  return (
                    <tr key={`yearly-${bill.id}`} className="hover:bg-brand-cream-50/10">
                      <td className="px-6 py-3.5 font-bold text-brand-green-950">
                        {bill.month} {bill.year}
                      </td>

                      <td className="px-6 py-3.5 text-right font-bold text-slate-700">
                        {formatCurrency(bill.amount)}
                      </td>

                      <td className="px-6 py-3.5 text-right font-bold text-emerald-600">
                        {formatCurrency(bill.paidAmount)}
                      </td>

                      <td className="px-6 py-3.5 text-right font-black text-rose-600">
                        {sisa > 0 ? formatCurrency(sisa) : 'Lunas'}
                      </td>

                      <td className="px-6 py-3.5 text-center">
                        <StatusBadge label={statusLabel} colorClass={statusColor} />
                      </td>

                      <td className="px-6 py-3.5 font-mono text-slate-500 font-semibold">
                        {lastValidationDate}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">
                    Belum ada rekap tagihan terdaftar untuk tahun ajaran ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden px-4 py-4 space-y-3.5">
        {bills.length > 0 ? (
          bills.map((bill) => {
            const sisa = bill.amount - bill.paidAmount;
            const statusLabel = getSppStatusLabel(bill.status);
            const statusColor = getSppStatusColor(bill.status);
            const lastValidationDate = getLastValidationDate(bill);

            return (
              <div
                key={`yearly-mobile-${bill.id}`}
                className="border border-brand-cream-100 rounded-2xl bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-green-950 text-sm">
                      {bill.month} {bill.year}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Validasi terakhir: {lastValidationDate}
                    </p>
                  </div>
                  <StatusBadge label={statusLabel} colorClass={statusColor} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="text-slate-500">Nominal</p>
                    <p className="font-bold text-slate-700">{formatCurrency(bill.amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Dibayar</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(bill.paidAmount)}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-slate-500">Sisa</p>
                    <p className="font-black text-rose-600">
                      {sisa > 0 ? formatCurrency(sisa) : 'Lunas'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-400 text-sm py-10 font-medium">
            Belum ada rekap tagihan terdaftar untuk tahun ajaran ini.
          </div>
        )}
      </div>
    </div>
  );
};