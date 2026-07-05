export function getSppStatusLabel(status: 'paid' | 'pending' | 'unpaid' | 'partial'): string {
  switch (status) {
    case 'paid':
      return 'Lunas';
    case 'pending':
      return 'Menunggu Validasi';
    case 'unpaid':
      return 'Belum Bayar';
    case 'partial':
      return 'Cicilan Sebagian';
    default:
      return status;
  }
}

export function getSppStatusColor(status: 'paid' | 'pending' | 'unpaid' | 'partial'): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'unpaid':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'partial':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function getPaymentStatusLabel(status: 'pending_validation' | 'approved' | 'rejected'): string {
  switch (status) {
    case 'pending_validation':
      return 'Menunggu Verifikasi';
    case 'approved':
      return 'Disetujui';
    case 'rejected':
      return 'Ditolak';
    default:
      return status;
  }
}

export function getPaymentStatusColor(status: 'pending_validation' | 'approved' | 'rejected'): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending_validation':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function getStudentStatusLabel(status: 'active' | 'graduated' | 'inactive'): string {
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'graduated':
      return 'Lulus';
    case 'inactive':
      return 'Tidak Aktif';
    default:
      return status;
  }
}

export function getStudentStatusColor(status: 'active' | 'graduated' | 'inactive'): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'graduated':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'inactive':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}
