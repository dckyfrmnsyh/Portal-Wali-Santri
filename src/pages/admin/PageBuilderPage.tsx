import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Page {
  id: string;
  slug: string;
  title: string;
  status: string;
  updated_at: string;
}

interface PageBuilderPageProps {
  onNavigateToEditor: (pageId: string | null) => void;
}

export const PageBuilderPage: React.FC<PageBuilderPageProps> = ({ onNavigateToEditor }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('id, slug, title, status, updated_at')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setPages(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus halaman ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
      loadPages(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Judul Halaman',
      render: (row: Page) => <span className="font-bold text-slate-800">{row.title}</span>,
    },
    {
      key: 'slug',
      header: 'Slug URL',
      render: (row: Page) => <span className="font-mono text-brand-green-800">/{row.slug}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Page) => (
        <StatusBadge
          label={row.status}
          colorClass={row.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}
        />
      ),
    },
    {
      key: 'updated_at',
      header: 'Terakhir Diperbarui',
      render: (row: Page) => <span className="text-slate-500">{new Date(row.updated_at).toLocaleString('id-ID')}</span>,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: Page) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigateToEditor(row.id)} className="p-1.5 hover:bg-slate-50">
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-brand-green-950 font-serif">Page Builder</h2>
          <p className="text-xs text-slate-500 mt-0.5">Buat dan kelola halaman kustom dengan konten dinamis.</p>
        </div>
        <Button
          onClick={() => onNavigateToEditor(null)}
          className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold text-xs rounded-xl flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Halaman Baru
        </Button>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">{error}</div>}

      <Card title="Daftar Halaman Kustom">
        <DataTable
          columns={columns}
          data={pages}
          isLoading={isLoading}
          searchPlaceholder="Cari Halaman..."
          searchKeys={['title', 'slug', 'status']}
          emptyMessage="Belum ada halaman kustom."
        />
      </Card>
    </div>
  );
};

