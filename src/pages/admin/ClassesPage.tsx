import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Edit2, Trash2 } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  level: string;
}

interface ClassesPageProps {
  onRefresh?: () => void;
}

export const ClassesPage: React.FC<ClassesPageProps> = ({ onRefresh }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formValues, setFormValues] = useState({ name: '', level: 'SMP' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadClasses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) setError(error.message);
    else setClasses(data);
    setIsLoading(false);
  };

  useEffect(() => { loadClasses(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormValues({ name: '', level: 'SMP' });
  };

  const handleEdit = (item: Class) => {
    setEditingId(item.id);
    setFormValues({ name: item.name, level: item.level });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    let error;

    if (editingId) {
      ({ error } = await supabase.from('classes').update(formValues).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('classes').insert([formValues]));
    }

    if (error) setError(error.message);
    else {
      resetForm();
      loadClasses();
      if (onRefresh) onRefresh();
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus kelas ini?')) return;
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        setError('Gagal menghapus kelas. Kelas ini masih digunakan oleh satu atau beberapa santri aktif.');
      } else {
        setError(error.message);
      }
    } else {
      loadClasses();
      if (onRefresh) onRefresh();
    }
    setIsLoading(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Nama Kelas',
      render: (row: Class) => <span className="font-bold text-slate-800">{row.name}</span>,
    },
    {
      key: 'level',
      header: 'Jenjang',
      render: (row: Class) => (
        <StatusBadge
          label={row.level}
          colorClass={row.level === 'SMP' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: Class) => (
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
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Manajemen Kelas</h2>
        <p className="text-xs text-slate-500 mt-0.5">Kelola daftar kelas dan jenjangnya (SMP/SMA).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card title={editingId ? 'Edit Kelas' : 'Tambah Kelas'}>
            <form onSubmit={handleSave} className="space-y-4">
              <Input id="name" label="Nama Kelas (Contoh: VII A)" value={formValues.name} onChange={e => setFormValues({...formValues, name: e.target.value})} required />
              <div className="space-y-1.5">
                <label htmlFor="level" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Jenjang</label>
                <select id="level" value={formValues.level} onChange={e => setFormValues({...formValues, level: e.target.value})} className="block w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-brand-green-900 transition-colors">
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
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
          <Card title="Daftar Kelas">
            <DataTable
              columns={columns}
              data={classes}
              isLoading={isLoading}
              searchPlaceholder="Cari Kelas..."
              searchKeys={['name', 'level']}
              emptyMessage="Belum ada data kelas."
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

