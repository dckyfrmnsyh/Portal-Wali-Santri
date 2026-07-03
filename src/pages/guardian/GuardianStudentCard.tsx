import React from 'react';
import { User, ShieldCheck, GraduationCap, Phone, MapPin, Calendar, Award } from 'lucide-react';
import { Student } from '../../types/student';
import { getStudentStatusLabel, getStudentStatusColor } from '../../utils/statusHelper';
import { Card } from '../../components/ui/Card';

interface GuardianStudentCardProps {
  student: Student;
}

export const GuardianStudentCard: React.FC<GuardianStudentCardProps> = ({ student }) => {
  const statusLabel = getStudentStatusLabel(student.status);
  const statusColor = getStudentStatusColor(student.status);

  // Derive jenjang and kelas from grade
  const isSma = student.grade.toLowerCase().includes('sma') || student.grade.toLowerCase().includes('x') || student.grade.toLowerCase().includes('xi') || student.grade.toLowerCase().includes('xii');
  const jenjang = isSma ? 'SMA' : 'SMP';
  const kelas = student.grade;

  return (
    <Card className="bg-gradient-to-br from-brand-green-900 to-brand-green-950 text-white border-0 shadow-md relative overflow-hidden p-6">
      {/* Decorative background visual */}
      <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
        <GraduationCap className="h-64 w-64 text-brand-gold-500" />
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl text-brand-gold-400 border border-white/10">
              <User className="h-6 w-6 text-brand-gold-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-gold-400 uppercase tracking-widest flex items-center gap-1">
                <Award className="h-3 w-3" />
                SANTRI AKTIF TERREGISTRASI
              </p>
              <h2 className="text-2xl font-bold tracking-tight font-serif mt-0.5">{student.name}</h2>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border border-white/20 ${statusColor} bg-white/10`}>
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] text-brand-gold-400 uppercase tracking-wider font-semibold">Nama Santri</p>
            <p className="text-sm font-bold mt-1">{student.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-gold-400 uppercase tracking-wider font-semibold">NISN</p>
            <p className="text-sm font-mono font-bold mt-1">{student.nisn}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-gold-400 uppercase tracking-wider font-semibold">NIS (Nomor Induk Santri)</p>
            <p className="text-sm font-mono font-bold mt-1">{student.nis || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-gold-400 uppercase tracking-wider font-semibold">Jenjang Pendidikan</p>
            <p className="text-sm font-bold mt-1">{jenjang}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-gold-400 uppercase tracking-wider font-semibold">Kelas</p>
            <p className="text-sm font-bold mt-1">{kelas}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-gold-400 uppercase tracking-wider font-semibold">Tahun Ajaran</p>
            <p className="text-sm font-bold mt-1 flex items-center gap-1 text-brand-gold-300">
              <Calendar className="h-3.5 w-3.5" />
              {student.academicYear || '2026/2027'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-brand-gold-400 uppercase tracking-wider font-semibold">Nama Wali Santri</p>
            <p className="text-sm font-bold mt-1">{student.guardianName}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-gold-400 uppercase tracking-wider font-semibold">Kontak Wali</p>
            <p className="text-sm font-bold mt-1 flex items-center gap-1">
              <Phone className="h-3 w-3 text-brand-gold-400" />
              {student.guardianPhone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-100 bg-white/5 p-3 rounded-lg border border-white/5">
          <MapPin className="h-3.5 w-3.5 text-brand-gold-400 shrink-0" />
          <span className="truncate">Alamat Domisili: {student.address}</span>
        </div>
      </div>
    </Card>
  );
};
