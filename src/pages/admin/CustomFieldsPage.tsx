import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Edit2, Trash2 } from 'lucide-react';

interface CustomField {
  id: string;
  entity_type: string;
  field_key: string;
  field_label: string;
  field_type: string;
  sort_order: number;
}

interface CustomFieldsPageProps {
  onRefresh?: () => void;
}

export const CustomFieldsPage: React.FC<CustomFieldsPageProps> = ({ onRefresh }) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [editingItem, setEditingItem] = useState<CustomField | null>(null);
  const [formValues, setFormValues] = useState({
    entity_type: 'news_articles',
    field_key: '',
    field_label: '',
    field_type: 'text',
    sort_order: 0,
  });

  const loadFields = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('custom_fields').select('*').order('sort_order');
      if (error) throw error;
      setFields(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);
  
  const resetForm = () => {
    setEditingItem(null);
    setFormValues({
      entity_type: 'news_articles',
      field_key: '',
      field_label: '',
      field_type: 'text',
      sort_order: 0,
    });
  };

  const handleEdit = (item: CustomField) => {
    setEditingItem(item);
    setFormValues({
      entity_type: item.entity_type,
      field_key: item.field_key,
      field_label: item.field_label,
      field_type: item.field_type,
      sort_order: item.sort_order,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { 
        ...formValues,
        field_key: formValues.field_label.toLowerCase().replace(/\s+/g, '_'), // Auto-generate key
      };
      let error;

      if (editingItem) {
        ({ error } = await supabase.from('custom_fields').update(payload).eq('id', editingItem.id));
      } else {
        ({ error } = await supabase.from('custom_fields').insert([payload]));
      }
      
      if (error) throw error;
      resetForm();
      loadFields();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus field ini?')) return;
    setIsLoading(true);
    try {
      // Perlu menghapus semua value terkait terlebih dahulu
      await supabase.from('custom_field_values').delete().eq('custom_field_id', id);
      const { error } = await supabase.from('custom_fields').delete().eq('id', id);
      if (error) throw error;
      loadFields();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'textarea':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'date':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-650 border-slate-200';
    }
  };

  const getFieldTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Teks Singkat';
      case 'textarea':
        return 'Teks Panjang';
      case 'date':
        return 'Tanggal';
      default:
        return type;
    }
  };

  const getEntityTypeLabel = (type: string) => {
    if (type === 'news_articles') return 'Artikel Berita';
    return type;
  };

  const columns = [
    {
      key: 'field_label',
      header: 'Label Field',
      render: (row: CustomField) => <span className="font-bold text-slate-800">{row.field_label}</span>,
    },
    {
      key: 'field_key',
      header: 'Key / Nama Kolom (DB)',
      render: (row: CustomField) => <code className="text-xs bg-slate-50 px-2 py-1 rounded-sm border border-slate-100 font-mono text-brand-green-800">{row.field_key}</code>,
    },
    {
      key: 'entity_type',
      header: 'Tipe Konten',
      render: (row: CustomField) => <span className="text-slate-600 font-medium">{getEntityTypeLabel(row.entity_type)}</span>,
    },
    {
      key: 'field_type',
      header: 'Tipe Input',
      render: (row: CustomField) => (
        <StatusBadge
          label={getFieldTypeLabel(row.field_type)}
          colorClass={getFieldTypeBadgeColor(row.field_type)}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: CustomField) => (
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
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Custom Fields</h2>
        <p className="text-xs text-slate-500 mt-0.5">Kelola kolom data tambahan untuk berbagai tipe konten.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card title={editingItem ? 'Edit Custom Field' : 'Tambah Custom Field'}>
            <form onSubmit={handleSave} className="space-y-4">
              <Input id="field_label" label="Label Field" value={formValues.field_label} onChange={e => setFormValues({...formValues, field_label: e.target.value})} required placeholder="Contoh: Tanggal Event" />
              
              <div className="space-y-1.5">
                <label htmlFor="entity_type" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipe Konten</label>
                <select id="entity_type" value={formValues.entity_type} onChange={e => setFormValues({...formValues, entity_type: e.target.value})} className="block w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-brand-green-900 transition-colors">
                  <option value="news_articles">Artikel Berita</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="field_type" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipe Input</label>
                <select id="field_type" value={formValues.field_type} onChange={e => setFormValues({...formValues, field_type: e.target.value})} className="block w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-brand-green-900 transition-colors">
                  <option value="text">Teks Singkat</option>
                  <option value="textarea">Teks Panjang</option>
                  <option value="date">Tanggal</option>
                </select>
              </div>

              <Input id="sort_order" label="Urutan Tampil" type="number" value={formValues.sort_order} onChange={e => setFormValues({...formValues, sort_order: Number(e.target.value)})} />
              
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isLoading} className="flex-1 bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold px-4 py-2 text-xs rounded-xl">
                  {editingItem ? 'Simpan' : 'Tambah'}
                </Button>
                {editingItem && (
                  <Button type="button" variant="outline" onClick={resetForm} className="text-xs font-semibold rounded-xl">
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* Table */}
        <div className="lg:col-span-2">
          {error && <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">{error}</div>}
          <Card title="Daftar Custom Fields">
            <DataTable
              columns={columns}
              data={fields}
              isLoading={isLoading}
              searchPlaceholder="Cari Custom Field..."
              searchKeys={['field_label', 'field_key', 'field_type']}
              emptyMessage="Belum ada custom field."
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

