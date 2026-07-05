import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './Button';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  headers: { key: string; label: string }[];
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename = 'export.csv',
  headers,
  label = 'Ekspor CSV',
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        if (data.length === 0) {
          alert('Tidak ada data untuk diekspor.');
          setIsExporting(false);
          return;
        }

        // Generate CSV rows
        const csvRows = [];
        
        // Header Row
        csvRows.push(headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','));
        
        // Data Rows
        data.forEach(row => {
          const values = headers.map(h => {
            const val = row[h.key];
            const cleanVal = val === undefined || val === null ? '' : String(val);
            return `"${cleanVal.replace(/"/g, '""')}"`;
          });
          csvRows.push(values.join(','));
        });

        const csvContent = '\uFEFF' + csvRows.join('\n'); // Add UTF-8 BOM
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Gagal mengekspor data:', err);
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="text-xs shrink-0"
    >
      <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
      {isExporting ? 'Mengekspor...' : label}
    </Button>
  );
};
