export interface Payment {
  id: string;
  studentId: string;
  billId: string; // The associated SPP bill
  amount: number;
  paymentDate: string;
  method: 'transfer' | 'cash';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  receiptImage?: string; // base64 or file placeholder
  status: 'pending_validation' | 'approved' | 'rejected';
  referenceNumber: string;
  notes?: string;
}
