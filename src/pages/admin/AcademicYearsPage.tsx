import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Edit2, Trash2 } from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  is_active: boolean;
}

interface AcademicYearsPageProps {
  onRefresh?: () => void;
}

export const AcademicYearsPage: React.FC<AcademicYearsPageProps> = ({ onRefresh }) => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formValues, setFormValues] = useState({ name: '', is_active: false });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadYears = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('academic_years').select('*').order('name', { ascending: false });
    if (error) setError(error.message);
    else setYears(data);
    setIsLoading(false);
  };

  useEffect(() => { loadYears(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormValues({ name: '', is_active: false });
  };

  const handleEdit = (year: AcademicYear) => {
    setEditingId(year.id);
    setFormValues({ name: year.name, is_active: year.is_active });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    let error;

    if (editingId) {
      ({ error } = await supabase.from('academic_years').update(formValues).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('academic_years').insert([formValues]));
    }

    if (error) setError(error.message);
    else {
      resetForm();
      loadYears();
      if (onRefresh) onRefresh();
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus tahun ajaran ini?')) return;
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.from('academic_years').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        setError('Gagal menghapus tahun ajaran. Tahun ajaran ini masih digunakan oleh satu atau beberapa santri aktif.');
      } else {
        setError(error.message);
      }
    } else {
      loadYears();
      if (onRefresh) onRefresh();
    }
    setIsLoading(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Tahun Ajaran',
      render: (row: AcademicYear) => <span className="font-bold text-slate-800">{row.name}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row: AcademicYear) => (
        <StatusBadge
          label={row.is_active ? 'Aktif' : 'Non-Aktif'}
          colorClass={row.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: AcademicYear) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)} className="p-1.5 hover:bg-slate-50">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDelete(row.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 border-rose-100">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Manajemen Tahun Ajaran</h2>
        <p className="text-xs text-slate-500 mt-0.5">Kelola daftar tahun ajaran dan status aktifnya.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card title={editingId ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}>
            <form onSubmit={handleSave} className="space-y-4">
              <Input id="name" label="Nama (Contoh: 2023/2024)" value={formValues.name} onChange={e => setFormValues({...formValues, name: e.target.value})} required />
              <div className="flex items-center gap-2.5 py-2">
                <input type="checkbox" id="is_active" checked={formValues.is_active} onChange={e => setFormValues({...formValues, is_active: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-brand-green-800 focus:ring-brand-green-800 cursor-pointer" />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-600 cursor-pointer">Jadikan Aktif</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isLoading} className="flex-1 bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold px-4 py-2 text-xs rounded-xl">
                  {editingId ? 'Simpan' : 'Tambah'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm} className="text-xs font-semibold rounded-xl">
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {error && <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">{error}</div>}
          <Card title="Daftar Tahun Ajaran">
            <DataTable
              columns={columns}
              data={years}
              isLoading={isLoading}
              searchPlaceholder="Cari Tahun Ajaran..."
              searchKeys={['name']}
              emptyMessage="Belum ada tahun ajaran."
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

