import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Check, X, Eye, GraduationCap } from 'lucide-react';

export const PpdbRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Enrollment fields
  const [classesList, setClassesList] = useState<any[]>([]);
  const [academicYearsList, setAcademicYearsList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedAyId, setSelectedAyId] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ppdb_registrations')
        .select(`
          id,
          registration_number,
          full_name,
          birth_place,
          birth_date,
          gender,
          address,
          previous_school,
          program_id,
          created_at,
          programs_data (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch parent data (phone, guardian) in parallel and decrypt it
      if (data) {
        const mapped = await Promise.all(data.map(async (reg: any) => {
          const { data: parentData } = await supabase
            .from('ppdb_parents')
            .select('father_name, mother_name, parent_phone, guardian_name')
            .eq('registration_id', reg.id)
            .maybeSingle();

          let decryptedPhone = '-';
          if (parentData?.parent_phone) {
            const { data: decrypted } = await supabase.rpc('get_decrypted_guardian_phone', {
              p_phone: parentData.parent_phone
            });
            if (decrypted) decryptedPhone = decrypted;
          }

          // Get latest status from ppdb_reviews
          const { data: latestReview } = await supabase
            .from('ppdb_reviews')
            .select('status, notes')
            .eq('registration_id', reg.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...reg,
            programTitle: reg.programs_data?.title || 'Umum',
            fatherName: parentData?.father_name || '-',
            motherName: parentData?.mother_name || '-',
            guardianName: parentData?.guardian_name || '-',
            parentPhone: decryptedPhone,
            status: latestReview?.status || 'submitted',
            reviewNotes: latestReview?.notes || ''
          };
        }));
        setRegistrations(mapped);
      }
    } catch (err) {
      console.error("Error loading PPDB registrations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [{ data: cData }, { data: ayData }] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('academic_years').select('*').order('name', { ascending: false })
      ]);
      if (cData) {
        setClassesList(cData);
        if (cData.length > 0) setSelectedClassId(cData[0].id);
      }
      if (ayData) {
        setAcademicYearsList(ayData);
        if (ayData.length > 0) setSelectedAyId(ayData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    loadDropdownData();
  }, []);

  const handleUpdateStatus = async (regId: string, nextStatus: 'verified' | 'accepted' | 'rejected', notes: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from('ppdb_reviews').insert([{
        registration_id: regId,
        status: nextStatus,
        notes: notes.trim() || `Di-update ke status ${nextStatus} oleh admin.`
      }]);

      if (error) throw error;
      alert(`Pendaftaran sukses diubah ke status: ${nextStatus}`);
      setIsDetailModalOpen(false);
      setSelectedReg(null);
      loadData();
    } catch (err: any) {
      alert("Gagal update status: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg || !selectedClassId || !selectedAyId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('enroll_ppdb_student', {
        p_registration_id: selectedReg.id,
        p_class_id: selectedClassId,
        p_academic_year_id: selectedAyId
      });

      if (error) throw error;

      if (data && data.success) {
        alert("Sukses mengesahkan santri baru ke database santri aktif!");
        setIsEnrollModalOpen(false);
        setSelectedReg(null);
        loadData();
      } else {
        alert("Gagal enroll: " + (data?.error || "Error tidak diketahui."));
      }
    } catch (err: any) {
      alert("Gagal enroll santri: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'verified': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'enrolled': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const columns = [
    {
      key: 'registration_number',
      header: 'No. Pendaftaran',
      render: (row: any) => <span className="font-mono font-bold text-brand-green-950">{row.registration_number}</span>
    },
    {
      key: 'full_name',
      header: 'Nama Calon Santri',
      render: (row: any) => <span className="font-bold text-slate-800">{row.full_name}</span>
    },
    {
      key: 'parentPhone',
      header: 'No. WA Orang Tua',
      render: (row: any) => <span className="font-mono font-medium">{row.parentPhone}</span>
    },
    {
      key: 'programTitle',
      header: 'Pilihan Program',
      render: (row: any) => <span className="font-semibold text-slate-600">{row.programTitle}</span>
    },
    {
      key: 'status',
      header: 'Status Seleksi',
      render: (row: any) => (
        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedReg(row);
              setReviewNotes(row.reviewNotes || '');
              setIsDetailModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-brand-green-900 border-slate-200 cursor-pointer"
            title="Lihat Detail & Review"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {row.status === 'accepted' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedReg(row);
                setIsEnrollModalOpen(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold p-1.5 rounded-xl cursor-pointer"
              title="Sahkan Jadi Santri Aktif"
            >
              <GraduationCap className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Penerimaan Santri Baru (PSB / PPDB)</h2>
        <p className="text-xs text-slate-500 mt-0.5">Kelola verifikasi berkas pendaftaran online, seleksi penerimaan, serta pengesahan (enrollment) santri baru.</p>
      </div>

      <DataTable
        columns={columns}
        data={registrations}
        emptyMessage="Belum ada pendaftar santri baru yang masuk."
      />

      {/* Detail & Review Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Detail Pendaftaran - ${selectedReg?.registration_number}`}>
        {selectedReg && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Nama Lengkap</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedReg.full_name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Pilihan Program</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedReg.programTitle}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Tempat, Tgl Lahir</p>
                <p className="font-semibold text-slate-700 mt-0.5">{selectedReg.birth_place || '-'}, {selectedReg.birth_date || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Gender</p>
                <p className="font-semibold text-slate-700 mt-0.5">{selectedReg.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Nama Ayah</p>
                <p className="font-semibold text-slate-700 mt-0.5">{selectedReg.fatherName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">No. WhatsApp Wali</p>
                <p className="font-semibold text-slate-700 mt-0.5 font-mono">{selectedReg.parentPhone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Alamat Lengkap</p>
                <p className="font-semibold text-slate-700 mt-0.5">{selectedReg.address || 'Belum diinput'}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label htmlFor="review-notes" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan Review/Alasan Penolakan</label>
              <textarea
                id="review-notes"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                rows={3}
                placeholder="Tulis alasan jika ditolak atau catatan tambahan..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)} className="rounded-xl text-xs font-semibold">Tutup</Button>
              {selectedReg.status !== 'enrolled' && (
                <>
                  <Button
                    onClick={() => handleUpdateStatus(selectedReg.id, 'rejected', reviewNotes)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Tolak Pendaftaran
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedReg.id, 'verified', reviewNotes)}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Verifikasi Dokumen
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedReg.id, 'accepted', reviewNotes)}
                    className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Terima Calon Santri
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Enroll Modal */}
      <Modal isOpen={isEnrollModalOpen} onClose={() => setIsEnrollModalOpen(false)} title="Sahkan Calon Santri Baru">
        {selectedReg && (
          <form onSubmit={handleEnrollStudent} className="space-y-4">
            <p className="text-xs text-slate-500">Pendaftaran santri <strong>{selectedReg.full_name}</strong> telah diterima. Pilih kelas dan tahun ajaran aktif untuk mengesahkannya menjadi santri resmi pondok.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="enroll-class" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Kelas Penempatan</label>
                <select
                  id="enroll-class"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  required
                >
                  {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="enroll-ay" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Tahun Ajaran Masuk</label>
                <select
                  id="enroll-ay"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
                  value={selectedAyId}
                  onChange={(e) => setSelectedAyId(e.target.value)}
                  required
                >
                  {academicYearsList.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsEnrollModalOpen(false)} className="rounded-xl text-xs font-semibold">Batal</Button>
              <Button type="submit" className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl text-xs">Mulai Pengesahan</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
