import React, { useState } from 'react';
import { ArrowLeft, BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';
import { Student } from '../../types/student';
import { SppBill } from '../../types/spp';
import { GuardianSearchForm } from './GuardianSearchForm';
import { GuardianStudentCard } from './GuardianStudentCard';
import { GuardianSppSummary } from './GuardianSppSummary';
import { GuardianSppTable } from './GuardianSppTable';
import { BankAccountCard } from './BankAccountCard';
import { GuardianYearlyReport } from './GuardianYearlyReport';
import { ContactAdminCard } from './ContactAdminCard';
import { InstallmentDetailModal } from './InstallmentDetailModal';
import { PaymentConfirmationModal } from './PaymentConfirmationModal';

interface GuardianPortalPageProps {
  students: Student[];
  bills: SppBill[];
  onAddPayment: (data: {
    studentId: string;
    billId: string;
    amount: number;
    paymentDate: string;
    method: 'transfer' | 'cash';
    bankName: string;
    accountNumber: string;
    accountName: string;
    receiptImage: string;
    notes: string;
  }) => void;
  onBackToLanding: () => void;
  onSearchLookup?: (identifier: string, guardianPhone: string, academicYear: string) => Promise<{ success: boolean; student?: Student; bills?: SppBill[]; error?: string }>;
}

export const GuardianPortalPage: React.FC<GuardianPortalPageProps> = ({
  students,
  bills,
  onAddPayment,
  onBackToLanding,
  onSearchLookup,
}) => {
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [studentBills, setStudentBills] = useState<SppBill[]>([]);
  const [searchError, setSearchError] = useState<string>('');
  const [lastSearchedIdentifier, setLastSearchedIdentifier] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2026/2027');

  // Modals state
  const [selectedBillForInstallments, setSelectedBillForInstallments] = useState<SppBill | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<SppBill | null>(null);
  const [isInstallmentsOpen, setIsInstallmentsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Success indicator
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleSearch = async (identifier: string, guardianPhone: string, academicYear: string) => {
    setLastSearchedIdentifier(identifier);
    setSelectedYear(academicYear);
    setSearchError('');

    if (onSearchLookup) {
      const res = await onSearchLookup(identifier, guardianPhone, academicYear);
      if (res.success && res.student) {
        setActiveStudent(res.student);
        setStudentBills(res.bills || []);
        setSearchError('');
      } else {
        setActiveStudent(null);
        setStudentBills([]);
        setSearchError(res.error || 'Santri dengan NISN/NIS dan nomor telepon wali tersebut tidak ditemukan.');
      }
    } else {
      // Fallback
      const found = students.find((s) => {
        const matchId = s.nisn === identifier || s.nis === identifier;
        const matchYear = !s.academicYear || s.academicYear === academicYear;
        return matchId && matchYear && s.status === 'active';
      });

      if (found) {
        setActiveStudent(found);
        setStudentBills(bills.filter((b) => b.studentId === found.id));
        setSearchError('');
      } else {
        setActiveStudent(null);
        setStudentBills([]);
        setSearchError('Santri dengan NISN/NIS tersebut tidak ditemukan di Tahun Ajaran yang dipilih.');
      }
    }
  };

  const handleConfirmPaymentSubmit = (formData: {
    amount: number;
    paymentDate: string;
    method: 'transfer' | 'cash';
    bankName: string;
    accountNumber: string;
    accountName: string;
    receiptImage: string;
    notes: string;
  }) => {
    if (!activeStudent || !selectedBillForPayment) return;

    onAddPayment({
      studentId: activeStudent.id,
      billId: selectedBillForPayment.id,
      ...formData,
    });

    setIsPaymentOpen(false);
    setSelectedBillForPayment(null);
    setSuccessMessage(
      'Konfirmasi pembayaran berhasil dikirim. Admin akan memeriksa dan memvalidasi pembayaran secara manual.'
    );

    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setSuccessMessage('');
    }, 7000);
  };

  // Filter bills for selected student
  const displayBills = studentBills.length > 0 ? studentBills : (activeStudent ? bills.filter((b) => b.studentId === activeStudent.id) : []);

  return (
    <div id="guardian-portal-main" className="space-y-8 animate-fade-in px-4 sm:px-6">
      {/* Alert Notification Success Message */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-950 text-xs sm:text-sm font-bold rounded-xl border border-emerald-200 flex items-start gap-3 shadow-md max-w-4xl mx-auto animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {!activeStudent ? (
        <div className="space-y-12">
          {/* Hero Portal Wali */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-green-950 via-brand-green-900 to-emerald-950 text-white p-6 sm:p-10 border border-brand-green-800 shadow-lg text-center max-w-4xl mx-auto">
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-5 pointer-events-none">
              <GraduationCap className="h-44 w-44 sm:h-72 sm:w-72 text-brand-gold-400" />
            </div>

            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-brand-gold-400 text-xs font-bold tracking-wider uppercase">
                <BookOpen className="h-3.5 w-3.5" />
                Sistem Layanan Mandiri Wali Santri
              </div>
              <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight leading-tight">
                Portal Wali Santri
              </h1>
              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
                Cek tagihan SPP, cicilan pembayaran, dan rekap administrasi santri melalui NISN atau NIS.
              </p>
            </div>
          </div>

          {/* Form Cek Santri */}
          <div className="py-2">
            <GuardianSearchForm onSearch={handleSearch} error={searchError} />
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
          {/* Back button to search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <button
              onClick={() => {
                setActiveStudent(null);
                setStudentBills([]);
                setSuccessMessage('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green-900 hover:text-brand-green-950 transition-all uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Pencarian Data
            </button>

            <span className="text-[10px] bg-brand-cream-50 text-brand-green-950 border border-brand-cream-200 px-3 py-1.5 rounded-full font-bold text-center">
              Tahun Ajaran: {activeStudent.academicYear || selectedYear}
            </span>
          </div>

          {/* Card Profil Santri */}
          <GuardianStudentCard student={activeStudent} />

          {/* Ringkasan SPP */}
          <GuardianSppSummary bills={displayBills} />

          {/* Main Work Area Split Layout (RESPONSIVE: stack di mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Tables & History Reports */}
            <div className="lg:col-span-2 space-y-8">
              <GuardianSppTable
                bills={displayBills}
                academicYear={activeStudent.academicYear || selectedYear}
                onOpenInstallments={(bill) => {
                  setSelectedBillForInstallments(bill);
                  setIsInstallmentsOpen(true);
                }}
                onOpenConfirmPayment={(bill) => {
                  setSelectedBillForPayment(bill);
                  setIsPaymentOpen(true);
                }}
              />

              <GuardianYearlyReport
                bills={displayBills}
                academicYear={activeStudent.academicYear || selectedYear}
              />
            </div>

            {/* Right Column: Bank Details & Whatsapp Contact */}
            <div className="lg:col-span-1 space-y-6">
              <BankAccountCard />

              <ContactAdminCard
                studentName={activeStudent.name}
                academicYear={activeStudent.academicYear || selectedYear}
              />
            </div>
          </div>

          {/* Modal overlays */}
          <InstallmentDetailModal
            isOpen={isInstallmentsOpen}
            onClose={() => {
              setIsInstallmentsOpen(false);
              setSelectedBillForInstallments(null);
            }}
            bill={selectedBillForInstallments}
          />

          <PaymentConfirmationModal
            isOpen={isPaymentOpen}
            onClose={() => {
              setIsPaymentOpen(false);
              setSelectedBillForPayment(null);
            }}
            bill={selectedBillForPayment}
            onConfirm={handleConfirmPaymentSubmit}
          />
        </div>
      )}
    </div>
  );
};