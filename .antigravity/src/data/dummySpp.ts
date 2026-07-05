import { SppBill } from '../types/spp';

export const dummySppBills: SppBill[] = [
  // Student: Ahmad Fauzan (std-fauzan) - 2026/2027 Academic Year
  {
    id: 'bill-fauzan-jul',
    studentId: 'std-fauzan',
    month: 'Juli',
    year: 2026,
    amount: 600000,
    paidAmount: 600000,
    status: 'paid',
    dueDate: '2026-07-10',
    installments: [
      {
        id: 'inst-f-1',
        amount: 600000,
        paymentDate: '2026-07-08',
        referenceNumber: 'REF-JUL-991',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-fauzan-agt',
    studentId: 'std-fauzan',
    month: 'Agustus',
    year: 2026,
    amount: 600000,
    paidAmount: 300000,
    status: 'partial',
    dueDate: '2026-08-10',
    installments: [
      {
        id: 'inst-f-2',
        amount: 300000,
        paymentDate: '2026-08-09',
        referenceNumber: 'REF-AGT-992',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-fauzan-sep',
    studentId: 'std-fauzan',
    month: 'September',
    year: 2026,
    amount: 600000,
    paidAmount: 0,
    status: 'unpaid',
    dueDate: '2026-09-10',
    installments: [],
  },

  // Student: Aisyah Zahira (std-zahira) - 2026/2027 Academic Year
  {
    id: 'bill-zahira-jul',
    studentId: 'std-zahira',
    month: 'Juli',
    year: 2026,
    amount: 750000,
    paidAmount: 750000,
    status: 'paid',
    dueDate: '2026-07-10',
    installments: [
      {
        id: 'inst-z-1',
        amount: 750000,
        paymentDate: '2026-07-05',
        referenceNumber: 'REF-JUL-881',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-zahira-agt',
    studentId: 'std-zahira',
    month: 'Agustus',
    year: 2026,
    amount: 750000,
    paidAmount: 750000,
    status: 'paid',
    dueDate: '2026-08-10',
    installments: [
      {
        id: 'inst-z-2',
        amount: 750000,
        paymentDate: '2026-08-07',
        referenceNumber: 'REF-AGT-882',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-zahira-sep',
    studentId: 'std-zahira',
    month: 'September',
    year: 2026,
    amount: 750000,
    paidAmount: 0,
    status: 'unpaid',
    dueDate: '2026-09-10',
    installments: [],
  },

  // Student 1 (Aditya Pratama / Muhammad Farhan)
  {
    id: 'bill-1-jan',
    studentId: 'std-1',
    month: 'Januari',
    year: 2026,
    amount: 500000,
    paidAmount: 500000,
    status: 'paid',
    dueDate: '2026-01-10',
    installments: [
      {
        id: 'inst-1',
        amount: 500000,
        paymentDate: '2026-01-08',
        referenceNumber: 'REF-JAN-001',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-1-feb',
    studentId: 'std-1',
    month: 'Februari',
    year: 2026,
    amount: 500000,
    paidAmount: 500000,
    status: 'paid',
    dueDate: '2026-02-10',
    installments: [
      {
        id: 'inst-2',
        amount: 500000,
        paymentDate: '2026-02-09',
        referenceNumber: 'REF-FEB-002',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-1-mar',
    studentId: 'std-1',
    month: 'Maret',
    year: 2026,
    amount: 500000,
    paidAmount: 250000,
    status: 'partial',
    dueDate: '2026-03-10',
    installments: [
      {
        id: 'inst-3',
        amount: 250000,
        paymentDate: '2026-03-10',
        referenceNumber: 'REF-MAR-003',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-1-apr',
    studentId: 'std-1',
    month: 'April',
    year: 2026,
    amount: 500000,
    paidAmount: 0,
    status: 'unpaid',
    dueDate: '2026-04-10',
    installments: [],
  },
  {
    id: 'bill-1-mei',
    studentId: 'std-1',
    month: 'Mei',
    year: 2026,
    amount: 500000,
    paidAmount: 0,
    status: 'unpaid',
    dueDate: '2026-05-10',
    installments: [],
  },

  // Student 2 (Siti Rahmawati)
  {
    id: 'bill-2-jan',
    studentId: 'std-2',
    month: 'Januari',
    year: 2026,
    amount: 500000,
    paidAmount: 500000,
    status: 'paid',
    dueDate: '2026-01-10',
    installments: [
      {
        id: 'inst-4',
        amount: 500000,
        paymentDate: '2026-01-05',
        referenceNumber: 'REF-JAN-004',
        method: 'cash',
      }
    ],
  },
  {
    id: 'bill-2-feb',
    studentId: 'std-2',
    month: 'Februari',
    year: 2026,
    amount: 500000,
    paidAmount: 500000,
    status: 'paid',
    dueDate: '2026-02-10',
    installments: [
      {
        id: 'inst-5',
        amount: 500000,
        paymentDate: '2026-02-10',
        referenceNumber: 'REF-FEB-005',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-2-mar',
    studentId: 'std-2',
    month: 'Maret',
    year: 2026,
    amount: 500000,
    paidAmount: 0,
    status: 'unpaid',
    dueDate: '2026-03-10',
    installments: [],
  },

  // Student 3 (Rian Hidayat)
  {
    id: 'bill-3-jan',
    studentId: 'std-3',
    month: 'Januari',
    year: 2026,
    amount: 550000,
    paidAmount: 550000,
    status: 'paid',
    dueDate: '2026-01-10',
    installments: [
      {
        id: 'inst-6',
        amount: 550000,
        paymentDate: '2026-01-09',
        referenceNumber: 'REF-JAN-006',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-3-feb',
    studentId: 'std-3',
    month: 'Februari',
    year: 2026,
    amount: 550000,
    paidAmount: 0,
    status: 'unpaid',
    dueDate: '2026-02-10',
    installments: [],
  },

  // Student 4 (Dewi Lestari)
  {
    id: 'bill-4-jan',
    studentId: 'std-4',
    month: 'Januari',
    year: 2026,
    amount: 500000,
    paidAmount: 500000,
    status: 'paid',
    dueDate: '2026-01-10',
    installments: [
      {
        id: 'inst-7',
        amount: 500000,
        paymentDate: '2026-01-07',
        referenceNumber: 'REF-JAN-007',
        method: 'transfer',
      }
    ],
  },
  {
    id: 'bill-4-feb',
    studentId: 'std-4',
    month: 'Februari',
    year: 2026,
    amount: 500000,
    paidAmount: 0,
    status: 'unpaid',
    dueDate: '2026-02-10',
    installments: [],
  },
];
