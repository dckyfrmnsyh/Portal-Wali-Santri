import React, { useState } from 'react';
import { Search, HelpCircle, Calendar } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';

interface GuardianSearchFormProps {
  onSearch: (identifier: string, guardianPhone: string, academicYear: string) => void;
  error?: string;
}

export const GuardianSearchForm: React.FC<GuardianSearchFormProps> = ({
  onSearch,
  error,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [validationError, setValidationError] = useState('');

  const academicYearOptions = [
    { value: '', label: '-- Pilih Tahun Ajaran --' },
    { value: '2026/2027', label: 'Tahun Ajaran 2026/2027' },
    { value: '2025/2026', label: 'Tahun Ajaran 2025/2026' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanIdentifier = identifier.trim();
    const cleanPhone = guardianPhone.trim();

    if (!cleanIdentifier) {
      setValidationError('NISN / NIS tidak boleh kosong.');
      return;
    }

    if (!/^\d+$/.test(cleanIdentifier)) {
      setValidationError('NISN / NIS hanya boleh berisi angka.');
      return;
    }

    if (!cleanPhone) {
      setValidationError('Nomor Telepon Wali tidak boleh kosong.');
      return;
    }

    if (!academicYear) {
      setValidationError('Tahun Ajaran wajib dipilih.');
      return;
    }

    onSearch(cleanIdentifier, cleanPhone, academicYear);
  };

  return (
    <div className="max-w-md mx-auto w-full bg-white rounded-2xl border border-brand-cream-200/60 shadow-md p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-xl bg-brand-green-50 flex items-center justify-center border border-brand-green-100">
          <Search className="h-6 w-6 text-brand-green-700" />
        </div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Cek Tagihan Santri</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Silakan masukkan NISN (10 digit) atau NIS (7 digit) serta memilih tahun ajaran aktif santri.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(error || validationError) && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs font-semibold">
            {validationError || error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            id="guardian-identifier"
            label="NISN atau NIS Santri"
            placeholder="Contoh: 1234567890 / 2026001"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setValidationError('');
            }}
            className="font-mono tracking-widest text-center text-lg font-bold py-2.5 text-brand-green-950 border-brand-cream-200 focus:border-brand-green-800"
          />

          <Input
            id="guardian-phone"
            label="Nomor Telepon Wali (Terdaftar)"
            placeholder="Contoh: 081234567890"
            value={guardianPhone}
            onChange={(e) => {
              setGuardianPhone(e.target.value);
              setValidationError('');
            }}
            className="text-center font-semibold text-brand-green-950 border-brand-cream-200 focus:border-brand-green-800"
          />

          <Select
            id="guardian-academic-year"
            label="Tahun Ajaran"
            options={academicYearOptions}
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value);
              setValidationError('');
            }}
            className="border-brand-cream-200 focus:border-brand-green-800 text-sm font-semibold"
          />
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full font-bold py-3 bg-brand-green-900 hover:bg-brand-green-800 text-white flex items-center justify-center gap-2 rounded-xl"
        >
          <Search className="h-4 w-4" />
          Cari Rincian Tagihan
        </Button>
      </form>

      {/* Info Tip */}
      <div className="pt-4 border-t border-brand-cream-100 flex items-start gap-2.5 text-xs text-slate-500">
        <HelpCircle className="h-4 w-4 text-brand-gold-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-600 font-semibold">Butuh Bantuan?</strong> Jika data tidak ditemukan atau status santri belum aktif, silakan hubungi Bendahara Pondok Pesantren Khairaat via WhatsApp Layanan.
        </p>
      </div>
    </div>
  );
};
