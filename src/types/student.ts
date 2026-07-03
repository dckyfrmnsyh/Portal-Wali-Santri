export interface Student {
  id: string;
  nisn: string;
  nis?: string;
  name: string;
  grade: string; // e.g. "10-A", "11-B"
  academicYear?: string; // e.g. "2026/2027"
  guardianName: string;
  guardianPhone: string;
  address: string;
  status: 'active' | 'graduated' | 'inactive';
}
