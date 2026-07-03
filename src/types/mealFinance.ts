export interface MealFinance {
  id: string;
  type: 'income' | 'expense';
  category: 
    | 'subscription' 
    | 'raw_material' 
    | 'vendor' 
    | 'operational' 
    | 'other'
    | 'Beras'
    | 'Sayur'
    | 'Lauk'
    | 'Gas'
    | 'Bumbu dapur'
    | 'Air minum'
    | 'Peralatan dapur'
    | 'Lainnya';
  amount: number;
  date: string;
  description: string;
  studentId?: string; // Optional: associated student if type is subscription income
  status: 'completed' | 'pending';
  receiptImage?: string; // base64 or mockup image url/status
  adminRecorder?: string; // admin user who recorded this
  itemName?: string;      // e.g. "Beras Sentra Ramos"
  quantity?: number;      // e.g. 25
  unit?: string;          // e.g. "kg", "karung", "tabung"
  pricePerUnit?: number;  // e.g. 12000
  supplierName?: string;  // e.g. "Toko Sembako Haji Jaya"
}

