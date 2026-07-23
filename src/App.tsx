import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// Type imports
import { Student } from './types/student';
import { SppBill, Installment } from './types/spp';
import { Payment } from './types/payment';
import { MealFinance } from './types/mealFinance';

// Layout imports
import { PublicLayout } from './components/layout/PublicLayout';
import { GuardianLayout } from './components/layout/GuardianLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Page imports (Lazy-loaded for optimization)
const LandingAccessPage = React.lazy(() => import('./pages/LandingAccessPage').then(m => ({ default: m.LandingAccessPage })));
const GuardianPortalPage = React.lazy(() => import('./pages/guardian/GuardianPortalPage').then(m => ({ default: m.GuardianPortalPage })));
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const StudentManagementPage = React.lazy(() => import('./pages/admin/StudentManagementPage').then(m => ({ default: m.StudentManagementPage })));
const SppBillManagementPage = React.lazy(() => import('./pages/admin/SppBillManagementPage').then(m => ({ default: m.SppBillManagementPage })));
const PaymentManagementPage = React.lazy(() => import('./pages/admin/PaymentManagementPage').then(m => ({ default: m.PaymentManagementPage })));
const ManualPaymentValidationPage = React.lazy(() => import('./pages/admin/ManualPaymentValidationPage').then(m => ({ default: m.ManualPaymentValidationPage })));
const MonthlySppReportPage = React.lazy(() => import('./pages/admin/MonthlySppReportPage').then(m => ({ default: m.MonthlySppReportPage })));
const StudentYearlyReportPage = React.lazy(() => import('./pages/admin/StudentYearlyReportPage').then(m => ({ default: m.StudentYearlyReportPage })));
const MealFinanceManagementPage = React.lazy(() => import('./pages/admin/MealFinanceManagementPage').then(m => ({ default: m.MealFinanceManagementPage })));
const MonthlyMealReportPage = React.lazy(() => import('./pages/admin/MonthlyMealReportPage').then(m => ({ default: m.MonthlyMealReportPage })));
const CmsSettingsPage = React.lazy(() => import('./pages/admin/CmsSettingsPage').then(m => ({ default: m.CmsSettingsPage })));
const PpdbRegistrationsPage = React.lazy(() => import('./pages/admin/PpdbRegistrationsPage').then(m => ({ default: m.PpdbRegistrationsPage })));
const MediaLibrary = React.lazy(() => import('./pages/admin/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const ContactMessagesPage = React.lazy(() => import('./pages/admin/ContactMessagesPage').then(m => ({ default: m.ContactMessagesPage })));
const FaqManagementPage = React.lazy(() => import('./pages/admin/FaqManagementPage').then(m => ({ default: m.FaqManagementPage })));
const NavMenuPage = React.lazy(() => import('./pages/admin/NavMenuPage').then(m => ({ default: m.NavMenuPage })));
const SeoSettingsPage = React.lazy(() => import('./pages/admin/SeoSettingsPage').then(m => ({ default: m.SeoSettingsPage })));
const RbacPage = React.lazy(() => import('./pages/admin/RbacPage').then(m => ({ default: m.RbacPage })));
const PageBuilderPage = React.lazy(() => import('./pages/admin/PageBuilderPage').then(m => ({ default: m.PageBuilderPage })));
const PageEditor = React.lazy(() => import('./pages/admin/PageEditor').then(m => ({ default: m.PageEditor })));
const DynamicPage = React.lazy(() => import('./pages/public/DynamicPage').then(m => ({ default: m.DynamicPage })));
const CustomFieldsPage = React.lazy(() => import('./pages/admin/CustomFieldsPage').then(m => ({ default: m.CustomFieldsPage })));
const AcademicYearsPage = React.lazy(() => import('./pages/admin/AcademicYearsPage').then(m => ({ default: m.AcademicYearsPage })));
const ClassesPage = React.lazy(() => import('./pages/admin/ClassesPage').then(m => ({ default: m.ClassesPage })));

// Helper to convert snake_case DB objects to camelCase frontend models
const toStudent = (db: any): Student => ({
  id: db.id, nisn: db.nisn, nis: db.nis, name: db.name, grade: db.grade,
  academicYear: db.academic_year, guardianName: db.guardian_name,
  guardianPhone: db.guardian_phone, address: db.address, status: db.status,
  sppAmount: db.spp_amount // Map spp_amount from DB to sppAmount in frontend
});

const toInstallment = (db: any): Installment => ({
  id: db.id, amount: Number(db.amount), paymentDate: db.payment_date, referenceNumber: db.reference_number, method: db.method
});

const toBill = (db: any, installmentsDb: any[]): SppBill => ({
  id: db.id, studentId: db.student_id, month: db.month, year: db.year, amount: Number(db.amount),
  paidAmount: Number(db.paid_amount), status: db.status, dueDate: db.due_date,
  installments: installmentsDb.filter(i => i.bill_id === db.id).map(toInstallment)
});

const toPayment = (db: any): Payment => ({
  id: db.id, studentId: db.student_id, billId: db.bill_id, amount: Number(db.amount),
  paymentDate: db.payment_date, method: db.method, bankName: db.bank_name,
  accountNumber: db.account_number, accountName: db.account_name, receiptImage: db.receipt_image,
  status: db.status, referenceNumber: db.reference_number, notes: db.notes
});

const toMeal = (db: any): MealFinance => ({
  id: db.id, type: db.type, category: db.category, amount: Number(db.amount), date: db.date,
  description: db.description, studentId: db.student_id, status: db.status, receiptImage: db.receipt_image,
  adminRecorder: db.admin_recorder, itemName: db.item_name, quantity: Number(db.quantity),
  unit: db.unit, pricePerUnit: Number(db.price_per_unit), supplierName: db.supplier_name
});

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [bills, setBills] = useState<SppBill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [mealFinance, setMealFinance] = useState<MealFinance[]>([]);

  // CMS state
  const [webConfig, setWebConfig] = useState<Record<string, string>>({});
  const [aboutContent, setAboutContent] = useState<any>(null);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [galleryList, setGalleryList] = useState<any[]>([]);

  // Fetch public CMS data from Supabase
  const fetchPublicCMSData = async () => {
    try {
      const [
        { data: configData },
        { data: aboutData },
        { data: bannerData },
        { data: programsData },
        { data: articlesData },
        { data: galleryData },
        { data: cfValuesData }
      ] = await Promise.all([
        supabase.from('site_config').select('*'),
        supabase.from('about_content').select('*').maybeSingle(),
        supabase.from('hero_banners').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('programs_data').select('*').order('sort_order', { ascending: true }),
        supabase.from('news_articles').select('*').eq('status', 'published').order('created_at', { ascending: false }),
        supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('custom_field_values').select('entity_id, value, custom_fields(field_key)'),
      ]);

      if (configData) {
        const configMap: Record<string, string> = {};
        configData.forEach((item: any) => {
          configMap[item.key] = item.value;
        });
        setWebConfig(configMap);
      }
      if (aboutData) setAboutContent(aboutData);
      if (bannerData) setHeroBanners(bannerData);
      if (programsData) setPrograms(programsData);
      if (articlesData) setNewsList(articlesData);
      if (galleryData) setGalleryList(galleryData);
    } catch (err) {
      console.error("Error fetching public CMS data:", err);
    }
  };

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      const [
        { data: studentsData },
        { data: billsData },
        { data: installmentsData },
        { data: paymentsData },
        { data: mealData }
      ] = await Promise.all([
        supabase.from('students').select('id, nisn, nis, name, class_id, academic_year_id, guardian_name, guardian_phone_last4, address, status, spp_amount'),
        supabase.from('spp_bills').select('*'),
        supabase.from('installments').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('meal_finance').select('*')
      ]);

      // Fetch classes and academic_years to map grade and academicYear
      const [
        { data: classesData },
        { data: academicYearsData }
      ] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('academic_years').select('*')
      ]);

      const classMap = new Map((classesData || []).map(c => [c.id, c.name]));
      const ayMap = new Map((academicYearsData || []).map(ay => [ay.id, ay.name]));

      if (studentsData) {
        const mappedStudents = studentsData.map((db: any) => ({
          id: db.id,
          nisn: db.nisn,
          nis: db.nis,
          name: db.name,
          grade: classMap.get(db.class_id) || 'Tidak Diketahui',
          academicYear: ayMap.get(db.academic_year_id) || 'Tidak Diketahui',
          guardianName: db.guardian_name,
          guardianPhone: db.guardian_phone_last4 || '',
          address: db.address,
          status: db.status,
          sppAmount: db.spp_amount
        }));
        setStudents(mappedStudents);
      }
      if (billsData && installmentsData) setBills(billsData.map(b => toBill(b, installmentsData)));
      if (paymentsData) setPayments(paymentsData.map(toPayment));
      if (mealData) setMealFinance(mealData.map(toMeal));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchPublicCMSData();
    fetchData();
  }, []);

  // --- Router & Access Role State ---
  const [role, setRole] = useState<'public' | 'guardian' | 'admin' | 'page'>('public');
  const [pageSlug, setPageSlug] = useState<string>('');
  const [adminPage, setAdminPage] = useState<string>('dashboard');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  const handleNavigateToPageEditor = (pageId: string | null) => {
    setEditingPageId(pageId);
    setAdminPage('page-editor');
  };


  // Check auth session on mount & Handle routing
  useEffect(() => {
    const path = window.location.pathname;
    const knownPaths = ['/', '/admin', '/guardian']; // TODO: Sesuaikan jika ada path lain

    if (!knownPaths.includes(path) && path.length > 1) {
      // Asumsikan ini adalah slug halaman dinamis
      setPageSlug(path.substring(1)); // Hapus '/' di depan
      setRole('page');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdminLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Handlers for State Modifiers ---

  // 1. Guardian: Submit manual payment confirmation
  const handleAddPaymentConfirmation = async (data: {
    studentId: string; // UUID
    billId: string;     // UUID
    amount: number;
    paymentDate: string;
    method: 'transfer' | 'cash';
    bankName: string;
    accountNumber: string;
    accountName: string;
    receiptImage: string;
    notes: string;
  }) => {
    let receiptUrl = data.receiptImage;
    
    // Upload image to Supabase Storage if it's a base64 string
    if (data.receiptImage && data.receiptImage.startsWith('data:image')) {
      try {
        // Base64 to Blob
        const response = await fetch(data.receiptImage);
        const blob = await response.blob();
        const fileName = `receipt-${Date.now()}.jpg`;
        
        const { data: uploadData, error } = await supabase.storage
          .from('receipts')
          .upload(fileName, blob, { contentType: 'image/jpeg' });
          
        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);
          
        receiptUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error("Failed to upload receipt", err);
        alert("Gagal mengunggah bukti pembayaran.");
        return;
      }
    }

    const { error } = await supabase.rpc('submit_payment', {
      p_student_id: data.studentId, // Pass as UUID
      p_bill_id: data.billId,       // Pass as UUID
      p_amount: data.amount,
      p_payment_date: data.paymentDate,
      p_method: data.method,
      p_bank_name: data.bankName,
      p_account_number: data.accountNumber,
      p_account_name: data.accountName,
      p_receipt_image: receiptUrl,
      p_reference_number: `REF-CON-${Date.now().toString().slice(-4)}`,
      p_notes: data.notes
    });

    if (error) {
      console.error("Submit payment error:", error);
      alert("Gagal mengirim pembayaran");
    } else {
      fetchData(); // Refresh data
    }
  };

  // 2. Admin: Validate/Approve manual transfer confirmation (secured with is_admin check)
  const handleApprovePayment = async (paymentId: string) => {
    const { data, error } = await supabase.rpc('approve_payment', { p_payment_id: paymentId });
    if (error) {
      console.error("Approve payment error:", error);
      alert("Gagal menyetujui pembayaran: " + error.message);
      return;
    }
    if (data && !data.success) {
      const code = data.code || '';
      if (code === 'ADMIN_ONLY') {
        alert("Anda tidak memiliki izin untuk menyetujui pembayaran.");
      } else if (code === 'INVALID_STATUS') {
        alert(`Tidak dapat menyetujui pembayaran dengan status: ${data.current_status}`);
      } else if (code === 'NOT_FOUND') {
        alert("Pembayaran tidak ditemukan.");
      } else {
        alert(data.error || "Gagal menyetujui pembayaran");
      }
      return;
    }
    fetchData();
  };

  // 3. Admin: Reject manual transfer confirmation (secured with is_admin check)
  const handleRejectPayment = async (paymentId: string, reason: string) => {
    const { data, error } = await supabase.rpc('reject_payment', { p_payment_id: paymentId, p_reason: reason });
    if (error) {
      console.error("Reject payment error:", error);
      alert("Gagal menolak pembayaran: " + error.message);
      return;
    }
    if (data && !data.success) {
      const code = data.code || '';
      if (code === 'ADMIN_ONLY') {
        alert("Anda tidak memiliki izin untuk menolak pembayaran.");
      } else if (code === 'REASON_REQUIRED') {
        alert("Alasan penolakan wajib diisi (minimal 3 karakter).");
      } else if (code === 'NOT_FOUND') {
        alert("Pembayaran tidak ditemukan.");
      } else {
        alert(data.error || "Gagal menolak pembayaran");
      }
      return;
    }
    fetchData();
  };

  // 4. Admin: Add Student Profile
  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      // Encrypt phone via secure database RPC
      const { data: encryptedPhone, error: encError } = await supabase.rpc('encrypt_val', {
        p_val: studentData.guardianPhone
      });
      if (encError) throw encError;

      const { error } = await supabase.from('students').insert([{
        nisn: studentData.nisn,
        nis: studentData.nis,
        name: studentData.name,
        class_id: studentData.grade, // Sekarang langsung memuat UUID kelas
        academic_year_id: studentData.academicYear, // Sekarang langsung memuat UUID tahun ajaran
        guardian_name: studentData.guardianName,
        guardian_phone: encryptedPhone,
        guardian_phone_last4: studentData.guardianPhone.slice(-4),
        address: studentData.address,
        status: studentData.status,
        spp_amount: studentData.sppAmount || 500000
      }]);
      
      if (error) console.error("Add student error:", error);
      else fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Admin: Update Student Profile
  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      // Encrypt phone via secure database RPC
      const { data: encryptedPhone, error: encError } = await supabase.rpc('encrypt_val', {
        p_val: updatedStudent.guardianPhone
      });
      if (encError) throw encError;

      const { error } = await supabase.from('students').update({
        nis: updatedStudent.nis,
        name: updatedStudent.name,
        class_id: updatedStudent.grade, // Sekarang langsung memuat UUID kelas
        academic_year_id: updatedStudent.academicYear, // Sekarang langsung memuat UUID tahun ajaran
        guardian_name: updatedStudent.guardianName,
        guardian_phone: encryptedPhone,
        guardian_phone_last4: updatedStudent.guardianPhone.slice(-4),
        address: updatedStudent.address,
        status: updatedStudent.status,
        spp_amount: updatedStudent.sppAmount || 500000
      }).eq('id', updatedStudent.id);
      
      if (error) console.error("Update student error:", error);
      else fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Admin: Soft-Deactivate Student Profile
  const handleDeleteStudent = async (studentId: string) => {
    const { error } = await supabase.from('students').update({ status: 'inactive' }).eq('id', studentId);
    if (error) console.error("Delete student error:", error);
    else fetchData();
  };

  // 7. Admin: Bulk Generate Monthly Bills with Filters
  const handleGenerateBulkBills = async (
    month: string,
    year: number,
    amount: number,
    academicYear: string = "2026/2027",
    dueDate: string = "",
    jenjang: 'all' | 'SMP' | 'SMA' = 'all',
    grade: string = 'all',
    useIndividualSpp: boolean = false // New parameter
  ) => {
    const activeStudents = students.filter((s) => {
      if (s.status !== 'active') return false;
      const gl = s.grade.toLowerCase();
      const sj = (gl.includes('smp') || gl.includes('vii') || gl.includes('viii') || gl.includes('ix')) ? 'SMP' : 'SMA';
      if (jenjang !== 'all' && sj !== jenjang) return false;
      if (grade !== 'all' && s.grade !== grade) return false;
      return true;
    });

    const newBillsToInsert = [];

    for (const student of activeStudents) {
      const exists = bills.some((b) => b.studentId === student.id && b.month === month && b.year === year);
      if (!exists) {
        const monthMap: Record<string, string> = {
          Januari: '01', Februari: '02', Maret: '03', April: '04', Mei: '05', Juni: '06', Juli: '07', Agustus: '08', September: '09', Oktober: '10', November: '11', Desember: '12'
        };
        const mCode = monthMap[month] || '01';
        const finalDueDate = dueDate || `${year}-${mCode}-10`;
        const billAmount = useIndividualSpp && student.sppAmount !== undefined && student.sppAmount !== null
          ? student.sppAmount
          : amount;

        newBillsToInsert.push({
          student_id: student.id,
          month,
          year,
          amount: billAmount,
          paid_amount: 0,
          status: 'unpaid',
          due_date: finalDueDate
        });
      }
    }

    if (newBillsToInsert.length > 0) {
      const { error } = await supabase.from('spp_bills').upsert(newBillsToInsert, { onConflict: 'student_id,month,year' });
      if (error) console.error("Generate bills error:", error);
      else fetchData();
    }
  };

  // 8. Admin: Record cash payment received at counter
  const handleRecordCashPayment = async (
    billId: string, // UUID
    amount: number,
    reference: string,
    date: string
  ) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    const { data: paymentIdData, error: payError } = await supabase.from('payments').insert([{
      student_id: bill.studentId,
      bill_id: bill.id,
      amount: amount,
      payment_date: date,
      method: 'cash',
      status: 'pending_validation',
      reference_number: reference,
      notes: 'Pembayaran tunai langsung di loket kasir sekolah'
    }]).select('id').single();

    if (payError) {
      console.error("Record cash payment error:", payError);
      return;
    }

    if (paymentIdData) {
      await supabase.rpc('approve_payment', { p_payment_id: paymentIdData.id });
      fetchData();
    }
  };

  // 8b. Admin: Record general payment from payment page
  const handleRecordAdminPayment = async (
    billId: string, // UUID
    amount: number,
    method: 'cash' | 'transfer',
    reference: string,
    date: string,
    notes: string
  ) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    const { data: paymentIdData, error: payError } = await supabase.from('payments').insert([{
      student_id: bill.studentId,
      bill_id: bill.id,
      amount: amount,
      payment_date: date,
      method: method,
      status: 'pending_validation',
      reference_number: reference,
      notes: notes || `Pencatatan manual oleh admin via ${method === 'cash' ? 'Tunai Loket' : 'Transfer Bank'}`
    }]).select('id').single();

    if (payError) {
      console.error("Record admin payment error:", payError);
      return;
    }

    if (paymentIdData) {
      await supabase.rpc('approve_payment', { p_payment_id: paymentIdData.id });
      fetchData();
    }
  };

  // 9. Admin: Add Catering/Meal financial log
  const handleAddMealRecord = async (record: Omit<MealFinance, 'id'>) => {
    const { error } = await supabase.from('meal_finance').insert([{
      type: record.type,
      category: record.category,
      amount: record.amount,
      date: record.date,
      description: record.description,
      student_id: record.studentId,
      status: record.status,
      receipt_image: record.receiptImage,
      admin_recorder: record.adminRecorder,
      item_name: record.itemName,
      quantity: record.quantity,
      unit: record.unit,
      price_per_unit: record.pricePerUnit,
      supplier_name: record.supplierName
    }]);
    
    if (error) console.error("Add meal record error:", error);
    else fetchData();
  };

  const handleDeleteMealRecord = async (id: string) => { // UUID
    const { error } = await supabase.from('meal_finance').delete().eq('id', id);
    if (error) console.error("Delete meal record error:", error);
    else fetchData();
  };

  // --- Admin Login/Logout ---
  const handleAdminLogin = () => {
    // Session is handled by Supabase Auth listener
    setAdminPage('dashboard');
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setRole('public');
  };

  // 1b. Guardian: RPC Search Lookup (NISN/NIS + Phone + Academic Year)
  const handleGuardianSearchLookup = async (identifier: string, guardianPhone: string, academicYear: string) => {
    try {
      // Find academic year ID if it matches the string
      let ayId: string | null = null;
      const { data: ayData } = await supabase.from('academic_years').select('id').eq('name', academicYear).maybeSingle();
      if (ayData) ayId = ayData.id;

      const { data, error } = await supabase.rpc('guardian_lookup', {
        p_identifier: identifier,
        p_guardian_phone: guardianPhone,
        p_academic_year_id: ayId
      });

      if (error) {
        console.error("guardian_lookup rpc error:", error);
        return { success: false, error: error.message };
      }

      if (data && data.success) {
        // Map to student type
        const mappedStudent: Student = {
          id: data.student.id,
          nisn: data.student.nisn,
          nis: data.student.nis,
          name: data.student.name,
          grade: data.student.grade,
          academicYear: data.student.academicYear,
          guardianName: data.student.guardianName,
          guardianPhone: guardianPhone,
          address: data.student.address || '',
          status: data.student.status,
          sppAmount: data.student.sppAmount
        };

        // Map bills
        const mappedBills: SppBill[] = (data.bills || []).map((b: any) => ({
          id: b.id,
          studentId: data.student.id,
          month: b.month,
          year: b.year,
          amount: Number(b.amount),
          paidAmount: Number(b.paid_amount),
          status: b.status,
          dueDate: b.due_date,
          installments: (b.installments || []).map((inst: any) => ({
            id: inst.id,
            amount: Number(inst.amount),
            paymentDate: inst.payment_date,
            referenceNumber: inst.reference_number,
            method: inst.method
          }))
        }));

        return { success: true, student: mappedStudent, bills: mappedBills };
      } else {
        return { success: false, error: data?.error || 'Data tidak ditemukan.' };
      }
    } catch (err: any) {
      console.error("Guardian lookup catch error:", err);
      return { success: false, error: 'Terjadi kesalahan sistem.' };
    }
  };

  // --- Render Core Router Engine ---
  const pendingCount = payments.filter((p) => p.status === 'pending_validation').length;

  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[50vh] w-full bg-slate-50/50 rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-brand-green-900 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Memuat...</p>
      </div>
    </div>
  );

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      {role === 'public' && (
        <LandingAccessPage
          onSelectRole={setRole}
          webConfig={webConfig}
          aboutContent={aboutContent}
          heroBanners={heroBanners}
          programs={programs}
          newsList={newsList}
          galleryList={galleryList}
        />
      )}

      {role === 'guardian' && (
        <GuardianLayout
          onBackToLanding={() => setRole('public')}
          guardianName={
            students.length > 0 ? "Orang Tua / Wali Santri" : undefined
          }
        >
          <GuardianPortalPage
            students={students}
            bills={bills}
            onAddPayment={handleAddPaymentConfirmation}
            onBackToLanding={() => setRole('public')}
            onSearchLookup={handleGuardianSearchLookup}
          />
        </GuardianLayout>
      )}

      {role === 'admin' && (
        !isAdminLoggedIn ? (
          <PublicLayout>
            <AdminLoginPage
              onLoginSuccess={handleAdminLogin}
              onBackToLanding={() => setRole('public')}
            />
          </PublicLayout>
        ) : (
          <AdminLayout
            currentPage={adminPage}
            onPageChange={setAdminPage}
            onLogout={handleAdminLogout}
            pendingValidationCount={pendingCount}
          >
            {adminPage === 'dashboard' && (
              <AdminDashboardPage
                students={students}
                bills={bills}
                payments={payments}
                mealFinance={mealFinance}
                onNavigateTo={setAdminPage}
              />
            )}
            
            {adminPage === 'students' && (
              <StudentManagementPage
                students={students}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
              />
            )}

            {adminPage === 'bills' && (
              <SppBillManagementPage
                students={students}
                bills={bills}
                onGenerateBulkBills={handleGenerateBulkBills}
                onRecordCashPayment={handleRecordCashPayment}
              />
            )}

            {adminPage === 'payments' && (
              <PaymentManagementPage
                students={students}
                payments={payments}
                bills={bills}
                onRecordPayment={handleRecordAdminPayment}
              />
            )}

            {adminPage === 'validations' && (
              <ManualPaymentValidationPage
                students={students}
                payments={payments}
                bills={bills}
                onApprovePayment={handleApprovePayment}
                onRejectPayment={handleRejectPayment}
              />
            )}

            {adminPage === 'report-spp-monthly' && (
              <MonthlySppReportPage students={students} bills={bills} />
            )}

            {adminPage === 'report-spp-yearly' && (
              <StudentYearlyReportPage students={students} bills={bills} payments={payments} />
            )}

            {adminPage === 'meal-finance' && (
              <MealFinanceManagementPage
                mealFinance={mealFinance}
                students={students}
                onAddMealRecord={handleAddMealRecord}
                onDeleteMealRecord={handleDeleteMealRecord}
              />
            )}

            {adminPage === 'report-meal-monthly' && (
              <MonthlyMealReportPage mealFinance={mealFinance} />
            )}

            {adminPage === 'ppdb-registrations' && (
              <PpdbRegistrationsPage />
            )}

            {adminPage === 'media-library' && (
              <MediaLibrary />
            )}

            {adminPage === 'cms-settings' && (
              <CmsSettingsPage />
            )}

            {adminPage === 'contact-messages' && (
              <ContactMessagesPage />
            )}

            {adminPage === 'faq-management' && (
              <FaqManagementPage />
            )}

            {adminPage === 'nav-menu' && (
              <NavMenuPage onRefresh={fetchPublicCMSData} />
            )}

            {adminPage === 'seo-settings' && (
              <SeoSettingsPage />
            )}

            {adminPage === 'rbac' && (
              <RbacPage />
            )}

            {adminPage === 'page-builder' && (
              <PageBuilderPage onNavigateToEditor={handleNavigateToPageEditor} />
            )}

            {adminPage === 'page-editor' && (
              <PageEditor pageId={editingPageId} onBack={() => setAdminPage('page-builder')} />
            )}

            {adminPage === 'custom-fields' && (
              <CustomFieldsPage onRefresh={fetchPublicCMSData} />
            )}

            {adminPage === 'academic-years' && (
              <AcademicYearsPage onRefresh={fetchData} />
            )}

            {adminPage === 'classes' && (
              <ClassesPage onRefresh={fetchData} />
            )}
          </AdminLayout>
        )
      )}

      {role === 'page' && <DynamicPage slug={pageSlug} />}
    </React.Suspense>
  );
}
