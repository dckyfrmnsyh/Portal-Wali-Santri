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

// Page imports
import { LandingAccessPage } from './pages/LandingAccessPage';
import { GuardianPortalPage } from './pages/guardian/GuardianPortalPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { StudentManagementPage } from './pages/admin/StudentManagementPage';
import { SppBillManagementPage } from './pages/admin/SppBillManagementPage';
import { PaymentManagementPage } from './pages/admin/PaymentManagementPage';
import { ManualPaymentValidationPage } from './pages/admin/ManualPaymentValidationPage';
import { MonthlySppReportPage } from './pages/admin/MonthlySppReportPage';
import { StudentYearlyReportPage } from './pages/admin/StudentYearlyReportPage';
import { MealFinanceManagementPage } from './pages/admin/MealFinanceManagementPage';
import { MonthlyMealReportPage } from './pages/admin/MonthlyMealReportPage';

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
        supabase.from('students').select('*'),
        supabase.from('spp_bills').select('*'),
        supabase.from('installments').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('meal_finance').select('*')
      ]);

      if (studentsData) setStudents(studentsData.map(toStudent));
      if (billsData && installmentsData) setBills(billsData.map(b => toBill(b, installmentsData)));
      if (paymentsData) setPayments(paymentsData.map(toPayment));
      if (mealData) setMealFinance(mealData.map(toMeal));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Router & Access Role State ---
  const [role, setRole] = useState<'public' | 'guardian' | 'admin'>('public');
  const [adminPage, setAdminPage] = useState<string>('dashboard');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // Check auth session on mount
  useEffect(() => {
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

  // 2. Admin: Validate/Approve manual transfer confirmation
  const handleApprovePayment = async (paymentId: string) => { // paymentId is UUID
    const { error } = await supabase.rpc('approve_payment', { p_payment_id: paymentId });
    if (error) {
      console.error("Approve payment error:", error);
      alert("Gagal menyetujui pembayaran");
    } else {
      fetchData();
    }
  };

  // 3. Admin: Reject manual transfer confirmation
  const handleRejectPayment = async (paymentId: string, reason: string) => { // paymentId is UUID
    const { error } = await supabase.rpc('reject_payment', { p_payment_id: paymentId, p_reason: reason });
    if (error) {
      console.error("Reject payment error:", error);
      alert("Gagal menolak pembayaran");
    } else {
      fetchData();
    }
  };

  // 4. Admin: Add Student Profile
  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    const { error } = await supabase.from('students').insert([{
      nisn: studentData.nisn,
      nis: studentData.nis,
      name: studentData.name,
      grade: studentData.grade,
      academic_year: studentData.academicYear,
      guardian_name: studentData.guardianName,
      guardian_phone: studentData.guardianPhone,
      address: studentData.address,
      status: studentData.status,
      spp_amount: studentData.sppAmount // Include spp_amount
    }]);
    
    if (error) console.error("Add student error:", error);
    else fetchData();
  };

  // 5. Admin: Update Student Profile
  const handleUpdateStudent = async (updatedStudent: Student) => {
    const { error } = await supabase.from('students').update({
      nis: updatedStudent.nis,
      name: updatedStudent.name,
      grade: updatedStudent.grade,
      academic_year: updatedStudent.academicYear,
      guardian_name: updatedStudent.guardianName,
      guardian_phone: updatedStudent.guardianPhone,
      address: updatedStudent.address,
      status: updatedStudent.status,
      spp_amount: updatedStudent.sppAmount // Include spp_amount
    }).eq('id', updatedStudent.id);
    
    if (error) console.error("Update student error:", error);
    else fetchData();
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

  // --- Render Core Router Engine ---
  const pendingCount = payments.filter((p) => p.status === 'pending_validation').length;

  if (role === 'public') {
    return <LandingAccessPage onSelectRole={setRole} />;
  }

  if (role === 'guardian') {
    return (
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
        />
      </GuardianLayout>
    );
  }

  if (role === 'admin') {
    // Force Authentication if not logged in
    if (!isAdminLoggedIn) {
      return (
        <PublicLayout>
          <AdminLoginPage
            onLoginSuccess={handleAdminLogin}
            onBackToLanding={() => setRole('public')}
          />
        </PublicLayout>
      );
    }

    // Authenticated Admin Dashboard Layout Panel
    return (
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
      </AdminLayout>
    );
  }

  return null;
}
