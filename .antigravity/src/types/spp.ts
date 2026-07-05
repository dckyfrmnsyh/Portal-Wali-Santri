export interface Installment {
  id: string;
  amount: number;
  paymentDate: string;
  referenceNumber: string;
  method: 'transfer' | 'cash';
}

export interface SppBill {
  id: string;
  studentId: string;
  month: string; // e.g. "Januari", "Februari"
  year: number;
  amount: number;
  paidAmount: number;
  status: 'paid' | 'pending' | 'unpaid' | 'partial';
  dueDate: string;
  installments: Installment[];
}
