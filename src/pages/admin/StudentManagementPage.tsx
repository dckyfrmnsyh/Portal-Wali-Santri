import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, AlertCircle, Search, SlidersHorizontal, CheckSquare, XCircle } from 'lucide-react';
import { Student } from '../../types/student';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ExportButton } from '../../components/ui/ExportButton';
import { getStudentStatusLabel, getStudentStatusColor } from '../../utils/statusHelper';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface StudentManagementPageProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export const StudentManagementPage: React.FC<StudentManagementPageProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nisn, setNisn] = useState('');
  const [nis, setNis] = useState('');
  const [grade, setGrade] = useState('10-A SMA');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'graduated' | 'inactive'>('active');
  const [error, setError] = useState('');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<'all' | 'SMP' | 'SMA'>('all');
  const [filterKelas, setFilterKelas] = useState<string>('all');

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setNisn('');
    setNis('');
    setGrade('10-A SMA');
    setGuardianName('');
    setGuardianPhone('');
    setAddress('');
    setStatus('active');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setNisn(student.nisn);
    setNis(student.nis || '');
    setGrade(student.grade);
    setGuardianName(student.guardianName);
    setGuardianPhone(student.guardianPhone);
    setAddress(student.address);
    setStatus(student.status);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !nisn.trim() || !nis.trim() || !guardianName.trim() || !guardianPhone.trim()) {
      setError('Mohon lengkapi semua kolom yang wajib diisi.');
      return;
    }

    if (nisn.trim().length !== 10 || isNaN(Number(nisn.trim()))) {
      setError('NISN harus tepat 10 digit angka.');
      return;
    }

    if (isNaN(Number(nis.trim()))) {
      setError('NIS harus berupa angka.');
      return;
    }

    // Check duplicate NISN, excluding current editing student
    const dupNisn = students.find((s) => s.nisn === nisn.trim() && s.id !== editingStudent?.id);
    if (dupNisn) {
      setError('NISN tersebut sudah terdaftar untuk siswa lain.');
      return;
    }

    // Check duplicate NIS, excluding current editing student
    const dupNis = students.find((s) => s.nis === nis.trim() && s.id !== editingStudent?.id);
    if (dupNis) {
      setError('NIS tersebut sudah terdaftar untuk siswa lain.');
      return;
    }

    const payload = {
      name: name.trim(),
      nisn: nisn.trim(),
      nis: nis.trim(),
      grade,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      address: address.trim(),
      status,
    };

    if (editingStudent) {
      onUpdateStudent({
        id: editingStudent.id,
        ...payload,
      });
    } else {
      onAddStudent(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menonaktifkan santri "${name}"?`)) {
      onDeleteStudent(id);
    }
  };

  const handleToggleStatus = (student: Student) => {
    const nextStatus: 'active' | 'inactive' = student.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = nextStatus === 'active' 
      ? `Aktifkan kembali santri "${student.name}"?`
      : `Nonaktifkan santri "${student.name}"?`;
      
    if (window.confirm(confirmMessage)) {
      onUpdateStudent({
        ...student,
        status: nextStatus
      });
    }
  };

  // Helper to determine school level (Jenjang)
  const getJenjang = (g: string) => {
    const gl = g.toLowerCase();
    if (gl.includes('smp') || gl.includes('vii') || gl.includes('viii') || gl.includes('ix')) {
      return 'SMP';
    }
    return 'SMA';
  };

  // Filter students programmatically
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        student.name.toLowerCase().includes(q) ||
        student.nisn.includes(q) ||
        (student.nis && student.nis.includes(q)) ||
        student.guardianName.toLowerCase().includes(q) ||
        student.guardianPhone.includes(q);

      // 2. Filter Jenjang
      const jenjang = getJenjang(student.grade);
      const matchesJenjang = filterJenjang === 'all' || jenjang === filterJenjang;

      // 3. Filter Kelas
      const matchesKelas = filterKelas === 'all' || student.grade === filterKelas;

      return matchesSearch && matchesJenjang && matchesKelas;
    });
  }, [students, searchQuery, filterJenjang, filterKelas]);

  // Extract unique classes/grades for filter dropdown
  const uniqueGrades = useMemo(() => {
    const gradesSet = new Set(students.map((s) => s.grade));
    return Array.from(gradesSet).sort();
  }, [students]);

  // Define table columns matching user's exact specification:
  // Nama Santri, NISN, NIS, Jenjang, Kelas, Nama Wali, Nomor WA Wali, Status Santri, Aksi.
  const columns = [
    {
      key: 'name',
      header: 'Nama Santri',
      render: (row: Student) => (
        <div className="font-bold text-brand-green-950 flex flex-col">
          <span>{row.name}</span>
          <span className="text-[10px] text-slate-400 font-medium font-mono">{row.id}</span>
        </div>
      ),
    },
    {
      key: 'nisn',
      header: 'NISN',
      render: (row: Student) => <span className="font-mono font-bold text-slate-600">{row.nisn}</span>,
    },
    {
      key: 'nis',
      header: 'NIS',
      render: (row: Student) => (
        <span className="font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
          {row.nis || '1234'}
        </span>
      ),
    },
    {
      key: 'jenjang',
      header: 'Jenjang',
      render: (row: Student) => {
        const j = getJenjang(row.grade);
        return (
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${
            j === 'SMP' 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
              : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}>
            {j}
          </span>
        );
      },
    },
    {
      key: 'grade',
      header: 'Kelas',
      render: (row: Student) => <span className="font-bold text-slate-700">{row.grade}</span>,
    },
    {
      key: 'guardianName',
      header: 'Nama Wali',
      render: (row: Student) => <span className="font-medium text-slate-800">{row.guardianName}</span>,
    },
    {
      key: 'guardianPhone',
      header: 'Nomor WA Wali',
      render: (row: Student) => (
        <a 
          href={`https://wa.me/${row.guardianPhone.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-brand-green-800 hover:underline flex items-center gap-1 font-mono"
        >
          <span>{row.guardianPhone}</span>
        </a>
      ),
    },
    {
      key: 'status',
      header: 'Status Santri',
      render: (row: Student) => {
        const label = getStudentStatusLabel(row.status);
        const color = getStudentStatusColor(row.status);
        return <StatusBadge label={label} colorClass={color} />;
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: Student) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditModal(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer"
            title="Edit Profil"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(row)}
            className={`p-1.5 cursor-pointer border transition-colors ${
              row.status === 'active' 
                ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 border-rose-100 hover:border-rose-300' 
                : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-300'
            }`}
            title={row.status === 'active' ? 'Nonaktifkan Santri' : 'Aktifkan Santri'}
          >
            {row.status === 'active' ? <XCircle className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ),
    },
  ];

  // Export structure
  const exportHeaders = [
    { key: 'name', label: 'Nama Santri' },
    { key: 'nisn', label: 'NISN' },
    { key: 'nis', label: 'NIS' },
    { key: 'grade', label: 'Kelas' },
    { key: 'guardianName', label: 'Nama Wali' },
    { key: 'guardianPhone', label: 'Nomor WA Wali' },
    { key: 'address', label: 'Alamat' },
    { key: 'status', label: 'Status Santri' },
  ];

  const gradeOptions = [
    { value: '7-A SMP', label: 'Kelas 7-A SMP' },
    { value: '7-B SMP', label: 'Kelas 7-B SMP' },
    { value: '8-A SMP', label: 'Kelas 8-A SMP' },
    { value: '8-B SMP', label: 'Kelas 8-B SMP' },
    { value: '9-A SMP', label: 'Kelas 9-A SMP' },
    { value: '10-A SMA', label: 'Kelas 10-A SMA' },
    { value: '10-B SMA', label: 'Kelas 10-B SMA' },
    { value: '11 SMA', label: 'Kelas 11 SMA' },
    { value: '12 SMA', label: 'Kelas 12 SMA' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Aktif' },
    { value: 'graduated', label: 'Lulus' },
    { value: 'inactive', label: 'Tidak Aktif' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-green-950 font-serif">Data Registrasi & Manajemen Santri</h2>
          <p className="text-xs text-slate-500 mt-0.5">Kelola seluruh profil santri, nomor NISN/NIS, serta nomor WhatsApp wali santri</p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton data={filteredStudents} filename="data-santri.csv" headers={exportHeaders} />
          
          <Button variant="primary" size="sm" onClick={openAddModal} className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold px-4 py-2 rounded-xl">
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Santri
          </Button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white border border-brand-cream-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        
        {/* Search */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-500">Cari Santri</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan Nama, NISN, NIS, atau Wali..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-green-900 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Filter Jenjang */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">Jenjang Pendidikan</label>
          <select
            value={filterJenjang}
            onChange={(e) => setFilterJenjang(e.target.value as any)}
            className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-green-900 bg-slate-50/50 text-slate-700 font-medium"
          >
            <option value="all">Semua Jenjang</option>
            <option value="SMP">Tingkat SMP</option>
            <option value="SMA">Tingkat SMA</option>
          </select>
        </div>

        {/* Filter Kelas */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">Kelas</label>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-green-900 bg-slate-50/50 text-slate-700 font-medium"
          >
            <option value="all">Semua Kelas</option>
            {uniqueGrades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

      </div>

      <DataTable
        columns={columns}
        data={filteredStudents}
        emptyMessage="Tidak ada data santri ditemukan dengan filter terpilih."
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Profil Santri' : 'Registrasi Santri Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              id="student-name"
              label="Nama Lengkap Santri"
              placeholder="Contoh: Muhammad Farhan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="student-nisn"
                label="NISN (10 Digit)"
                placeholder="Contoh: 0091234567"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                maxLength={10}
                required
                disabled={!!editingStudent}
              />
              <Input
                id="student-nis"
                label="NIS (Nomor Induk Santri)"
                placeholder="Contoh: 3412"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="student-grade"
                label="Kelas"
                options={gradeOptions}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
              <Select
                id="student-status"
                label="Status Akademik"
                options={statusOptions}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="student-guardian"
                label="Nama Wali Santri"
                placeholder="Contoh: Ahmad Yani"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                required
              />
              <Input
                id="student-guardian-phone"
                label="No. WhatsApp Wali"
                placeholder="Contoh: 0812345678"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                required
              />
            </div>

            <Input
              id="student-address"
              label="Alamat Rumah"
              placeholder="Tulis alamat rumah lengkap..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">
              Batal
            </Button>
            <Button type="submit" variant="primary" className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl px-5">
              {editingStudent ? 'Simpan Perubahan' : 'Daftarkan Santri'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
