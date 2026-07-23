import React, { useState, useMemo, useRef } from 'react';
import { Plus, ArrowDownRight, ArrowUpRight, AlertCircle, Trash2, FileImage, Eye, Upload, Check, PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
import { MealFinance } from '../../types/mealFinance';
import { Student } from '../../types/student';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

interface MealFinanceManagementPageProps {
  mealFinance: MealFinance[];
  students: Student[];
  onAddMealRecord: (record: Omit<MealFinance, 'id'>) => void;
  onDeleteMealRecord: (id: string) => void;
}

export const MealFinanceManagementPage: React.FC<MealFinanceManagementPageProps> = ({
  mealFinance,
  students,
  onAddMealRecord,
  onDeleteMealRecord,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [date, setDate] = useState(todayStr);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('Sayur');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New detailed kitchen inventory fields
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState<string>('');
  const [supplierName, setSupplierName] = useState('');

  // Selected receipt for modal preview
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedReceiptDesc, setSelectedReceiptDesc] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Categories based on Type
  const incomeCategories = ['subscription', 'other'];
  const expenseCategories = ['Beras', 'Sayur', 'Lauk', 'Gas', 'Bumbu dapur', 'Air minum', 'Peralatan dapur', 'Lainnya'];

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    if (newType === 'income') {
      setCategory('subscription');
      setItemName('Iuran Katering Bulanan');
      setUnit('Bulan');
      setQuantity('1');
    } else {
      setCategory('Sayur');
      setItemName('');
      setUnit('kg');
      setQuantity('');
    }
    setPricePerUnit('');
    setAmount('');
  };

  // Auto-calculate total amount when quantity or price per unit changes
  React.useEffect(() => {
    if (type === 'expense' && quantity && pricePerUnit) {
      const q = Number(quantity);
      const p = Number(pricePerUnit);
      if (!isNaN(q) && q >= 0 && !isNaN(p) && p >= 0) {
        setAmount(String(q * p));
      }
    }
  }, [quantity, pricePerUnit, type]);

  // FileReader handler for base64 receipt uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran bukti foto terlalu besar (maksimal 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedAmount = Number(amount);
    if (!date) {
      setError('Tanggal wajib diisi.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Nominal harus berupa angka positif.');
      return;
    }
    if (!description.trim()) {
      setError('Keterangan transaksi wajib diisi.');
      return;
    }

    onAddMealRecord({
      type,
      category: category as any,
      amount: parsedAmount,
      date,
      description: description.trim(),
      status: 'completed',
      receiptImage: receiptImage || undefined,
      adminRecorder: 'Ustadz Ahmad (Katering Dapur)',
      itemName: itemName.trim() || undefined,
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
      pricePerUnit: pricePerUnit ? Number(pricePerUnit) : undefined,
      supplierName: supplierName.trim() || undefined,
    });

    // Reset Form
    setDate(todayStr);
    setAmount('');
    setDescription('');
    setReceiptImage('');
    setItemName('');
    setQuantity('');
    setUnit('kg');
    setPricePerUnit('');
    setSupplierName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSuccess('Transaksi kas dapur berhasil dicatat!');
    
    setTimeout(() => setSuccess(''), 3000);
  };

  // Calculate stats based on active month (June 2026 as default for dummy data)
  const stats = useMemo(() => {
    // Current month is determined based on latest records or current calendar month
    // We filter for active month June (06) and Year 2026 since dummy data centers here
    const activeMonth = '06';
    const activeYear = '2026';

    const monthRecords = mealFinance.filter((r) => {
      const parts = r.date.split('-');
      return parts[0] === activeYear && parts[1] === activeMonth;
    });

    const incomeThisMonth = monthRecords
      .filter((r) => r.type === 'income')
      .reduce((acc, r) => acc + r.amount, 0);

    const expenseThisMonth = monthRecords
      .filter((r) => r.type === 'expense')
      .reduce((acc, r) => acc + r.amount, 0);

    // Calculate all-time cumulative cash balance
    const allIncome = mealFinance.filter((r) => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
    const allExpense = mealFinance.filter((r) => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
    const balance = allIncome - allExpense;

    // Daily expenditure average: sum of expenses divided by count of active expense days
    const expenseDays = new Set(
      monthRecords.filter((r) => r.type === 'expense').map((r) => r.date)
    );
    const activeExpenseDaysCount = expenseDays.size || 1;
    const avgDailyExpense = expenseThisMonth / activeExpenseDaysCount;

    return {
      incomeThisMonth,
      expenseThisMonth,
      balance,
      avgDailyExpense,
      activeExpenseDaysCount,
    };
  }, [mealFinance]);

  // Handle visual trigger for clicking receipt
  const triggerReceiptPreview = (record: MealFinance) => {
    if (record.receiptImage) {
      setSelectedReceiptUrl(record.receiptImage);
    } else {
      // Mockup placeholder receipt for demonstration
      setSelectedReceiptUrl('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60');
    }
    setSelectedReceiptDesc(record.description);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Pengelolaan Uang Makan Harian</h2>
        <p className="text-xs text-slate-500 mt-0.5">Administrasi anggaran katering dapur pondok pesantren, belanja bahan masakan santri, dan iuran makan</p>
      </div>

      {/* SUMMARY STATS WIDGETS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Pemasukan Bulan Ini</span>
          <p className="text-base font-black font-mono text-emerald-600 block">{formatCurrency(stats.incomeThisMonth)}</p>
          <span className="text-[9px] text-slate-400 block">Periode Juni 2026</span>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Pengeluaran Bulan Ini</span>
          <p className="text-base font-black font-mono text-rose-600 block">{formatCurrency(stats.expenseThisMonth)}</p>
          <span className="text-[9px] text-slate-400 block">Periode Juni 2026</span>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Saldo Akhir (Cash)</span>
          <p className={`text-base font-black font-mono block ${stats.balance >= 0 ? 'text-brand-green-950' : 'text-rose-600'}`}>
            {formatCurrency(stats.balance)}
          </p>
          <span className="text-[9px] text-slate-400 block">Total kas sisa saat ini</span>
        </div>

        <div className="bg-white border border-brand-cream-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Rata-rata Pengeluaran Harian</span>
          <p className="text-base font-black font-mono text-amber-600 block">{formatCurrency(stats.avgDailyExpense)}</p>
          <span className="text-[9px] text-slate-400 block">Berdasarkan {stats.activeExpenseDaysCount} hari belanja aktif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* INPUT TRANSACTION FORM CARD */}
        <div className="bg-white border border-brand-cream-200 rounded-2xl p-5 shadow-xs lg:col-span-1 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-black text-brand-green-950 font-serif flex items-center gap-1.5 uppercase">
              <Plus className="h-4 w-4 text-brand-green-800" />
              Catat Arus Kas Baru
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Masukkan data pengeluaran dapur atau penerimaan kas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 border border-emerald-100">
                <Check className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Toggle Income / Expense */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 block">Jenis Transaksi</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    type === 'expense'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ArrowDownRight className="h-3 w-3 inline mr-1" />
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    type === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ArrowUpRight className="h-3 w-3 inline mr-1" />
                  Pemasukan
                </button>
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-1">
              <label htmlFor="meal-form-date" className="text-[11px] font-bold text-slate-500 block">Tanggal Transaksi</label>
              <input
                id="meal-form-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
                required
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <label htmlFor="meal-form-cat" className="text-[11px] font-bold text-slate-500 block">Kategori</label>
              <select
                id="meal-form-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
              >
                {type === 'income' ? (
                  <>
                    <option value="subscription">Uang Makan Langganan</option>
                    <option value="other">Lainnya</option>
                  </>
                ) : (
                  expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                )}
              </select>
            </div>

            {/* Nama Item Master */}
            <div className="space-y-1">
              <label htmlFor="meal-form-item" className="text-[11px] font-bold text-slate-500 block">Nama Komoditas / Item Master</label>
              <input
                id="meal-form-item"
                type="text"
                placeholder={type === 'income' ? 'Contoh: Uang Langganan Aditya' : 'Contoh: Beras Cap Pandan Wangi'}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="block w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
                required
              />
            </div>

            {type === 'expense' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="meal-form-qty" className="text-[11px] font-bold text-slate-500 block">Kuantitas</label>
                    <input
                      id="meal-form-qty"
                      type="number"
                      placeholder="Contoh: 10"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="block w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono text-slate-700 focus:outline-none focus:border-brand-green-900"
                      required={type === 'expense'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="meal-form-unit" className="text-[11px] font-bold text-slate-500 block">Satuan</label>
                    <input
                      id="meal-form-unit"
                      type="text"
                      placeholder="kg, Karung, Tabung, dll"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="block w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
                      required={type === 'expense'}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="meal-form-ppu" className="text-[11px] font-bold text-slate-500 block">Harga Satuan (IDR)</label>
                  <input
                    id="meal-form-ppu"
                    type="number"
                    placeholder="Contoh: 15000"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    className="block w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono text-slate-700 focus:outline-none focus:border-brand-green-900"
                    required={type === 'expense'}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="meal-form-supplier" className="text-[11px] font-bold text-slate-500 block">Supplier / Nama Toko Mitra</label>
                  <input
                    id="meal-form-supplier"
                    type="text"
                    placeholder="Contoh: Toko Sembako Makmur"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="block w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
                    required={type === 'expense'}
                  />
                </div>
              </>
            )}

            {/* Nominal (Amount) */}
            <div className="space-y-1">
              <label htmlFor="meal-form-amt" className="text-[11px] font-bold text-slate-500 block">
                Total Nominal (IDR) {quantity && pricePerUnit && <span className="text-[10px] text-emerald-600 font-semibold">(Auto-calculated)</span>}
              </label>
              <input
                id="meal-form-amt"
                type="number"
                placeholder="Contoh: 150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono text-slate-700 focus:outline-none focus:border-brand-green-900"
                required
              />
            </div>

            {/* Description (Keterangan) */}
            <div className="space-y-1">
              <label htmlFor="meal-form-desc" className="text-[11px] font-bold text-slate-500 block">Keterangan / Deskripsi Ledger</label>
              <textarea
                id="meal-form-desc"
                rows={2}
                placeholder="Rincian belanja beras, sayur, lauk, dll..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-brand-green-900"
                required
              />
            </div>

            {/* Upload Bukti Nota/Struk (Interactive Drag & Drop / Select Mockup) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 block">Bukti Nota / Struk Pembelian</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:bg-slate-50/50 transition-colors relative"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {receiptImage ? (
                  <div className="space-y-1 text-slate-700">
                    <FileImage className="h-5 w-5 text-emerald-600 mx-auto" />
                    <p className="text-[10px] font-bold">Bukti Foto Terlampir</p>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceiptImage('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-[9px] text-rose-600 font-bold underline"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-400">
                    <Upload className="h-5 w-5 mx-auto text-slate-300" />
                    <p className="text-[9px] font-medium leading-none">Pilih atau Drag Bukti Foto Nota</p>
                    <p className="text-[8px] text-slate-400">JPG, PNG (Max 2MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <Button type="submit" variant="primary" className="w-full text-xs font-black py-2 rounded-xl">
              Simpan Transaksi
            </Button>
          </form>
        </div>

        {/* TRANSACTION HISTORY LIST TABLE */}
        <div className="bg-white border border-brand-cream-200 rounded-2xl shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Histori Jurnal Transaksi Harian (Ledger)</h3>
            <span className="text-[10px] font-bold text-slate-500 font-mono">
              Total: {mealFinance.length} Transaksi Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[640px] md:min-w-full">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-4 font-semibold">Tanggal</th>
                  <th className="p-4 text-center font-semibold">Jenis</th>
                  <th className="p-4 font-semibold">Komoditas / Item Master</th>
                  <th className="p-4 font-semibold">Kuantitas</th>
                  <th className="p-4 text-right font-semibold">Harga Satuan</th>
                  <th className="p-4 font-semibold">Supplier / Mitra Penjual</th>
                  <th className="p-4 text-right font-semibold">Pemasukan</th>
                  <th className="p-4 text-right font-semibold">Pengeluaran</th>
                  <th className="p-4 text-center font-semibold">Bukti</th>
                  <th className="p-4 font-semibold">Pencatat</th>
                  <th className="p-4 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {mealFinance.length > 0 ? (
                  mealFinance.map((record) => {
                    const isIncome = record.type === 'income';
                    const displayCategory = record.category === 'subscription' ? 'Uang Langganan' : record.category;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/30">
                        <td className="p-4 font-mono text-[11px] text-slate-500 font-medium">{record.date}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {isIncome ? 'Masuk' : 'Keluar'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">{record.itemName || record.description}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{displayCategory}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-700">
                          {record.quantity ? `${record.quantity} ${record.unit || 'pcs'}` : '-'}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-600">
                          {record.pricePerUnit ? formatCurrency(record.pricePerUnit) : '-'}
                        </td>
                        <td className="p-4 text-slate-600 font-bold font-serif text-xs">
                          {record.supplierName || '-'}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-600">
                          {isIncome ? formatCurrency(record.amount) : '-'}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-rose-600">
                          {!isIncome ? formatCurrency(record.amount) : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => triggerReceiptPreview(record)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            {record.receiptImage ? 'Lihat Nota' : 'Nota'}
                          </button>
                        </td>
                        <td className="p-4 text-slate-500 font-semibold">{record.adminRecorder || 'Ustadz Ahmad'}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus catatan transaksi keuangan ini?')) {
                                onDeleteMealRecord(record.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 font-semibold">
                      Belum ada catatan transaksi keuangan dapur yang tersimpan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full border border-slate-100 shadow-2xl relative">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-bold font-mono tracking-wider uppercase">Lampiran Bukti Nota Pembelian</span>
              <button 
                onClick={() => setSelectedReceiptUrl(null)}
                className="text-slate-400 hover:text-white font-black text-sm"
              >
                ✖
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img 
                  src={selectedReceiptUrl} 
                  alt="Bukti Struk Nota" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="text-slate-400 font-bold uppercase text-[9px]">Detail Deskripsi Pembelian</p>
                <p className="text-slate-700 font-bold mt-1">{selectedReceiptDesc}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button onClick={() => setSelectedReceiptUrl(null)} size="sm" variant="outline" className="text-xs font-bold rounded-xl">
                Tutup Dokumen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
