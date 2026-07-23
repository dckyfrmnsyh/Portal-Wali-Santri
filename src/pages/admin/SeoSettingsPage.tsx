import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Edit2, Trash2, Globe } from 'lucide-react';

interface SeoMeta {
  id: string;
  entity_type: string;
  entity_id: string | null;
  meta_title: string;
  meta_description: string;
  keywords: string;
}

interface NewsArticle {
  id: string;
  title: string;
}

export const SeoSettingsPage: React.FC = () => {
  const [seoData, setSeoData] = useState<SeoMeta[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [editingItem, setEditingItem] = useState<SeoMeta | null>(null);
  const [formValues, setFormValues] = useState({
    entity_type: 'news_articles',
    entity_id: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: seo, error: seoError } = await supabase.from('seo_meta').select('*');
      if (seoError) throw seoError;
      setSeoData(seo);

      const { data: news, error: newsError } = await supabase.from('news_articles').select('id, title');
      if (newsError) throw newsError;
      setArticles(news);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingItem(null);
    setFormValues({
      entity_type: 'news_articles',
      entity_id: '',
      meta_title: '',
      meta_description: '',
      keywords: '',
    });
  };

  const handleEdit = (item: SeoMeta) => {
    setEditingItem(item);
    setFormValues({
      entity_type: item.entity_type,
      entity_id: item.entity_id || '',
      meta_title: item.meta_title,
      meta_description: item.meta_description,
      keywords: item.keywords,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const payload = { ...formValues };
      if (!payload.entity_id) { // Handle "Halaman Umum"
        payload.entity_id = null;
      }

      let error;
      if (editingItem) {
        ({ error } = await supabase.from('seo_meta').update(payload).eq('id', editingItem.id));
      } else {
        ({ error } = await supabase.from('seo_meta').insert([payload]));
      }
      
      if (error) throw error;
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data SEO ini?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('seo_meta').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mendapatkan nama entitas untuk ditampilkan di tabel
  const getEntityName = (item: SeoMeta) => {
    if (item.entity_type === 'news_articles') {
      const article = articles.find(a => a.id === item.entity_id);
      return article ? `Berita: ${article.title}` : 'Berita (ID tidak ditemukan)';
    }
    return `Halaman Umum (${item.entity_id || 'Global'})`;
  };

  const columns = [
    {
      key: 'entity_name',
      header: 'Halaman / Konten',
      render: (row: SeoMeta) => <span className="font-bold text-slate-800">{getEntityName(row)}</span>,
    },
    {
      key: 'meta_title',
      header: 'Meta Title',
      render: (row: SeoMeta) => <span className="text-slate-600 font-medium">{row.meta_title}</span>,
    },
    {
      key: 'meta_description',
      header: 'Meta Description',
      render: (row: SeoMeta) => <p className="text-xs text-slate-500 line-clamp-2 max-w-xs">{row.meta_description}</p>,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: SeoMeta) => (
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
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Pengaturan SEO</h2>
        <p className="text-xs text-slate-500 mt-0.5">Kelola meta title, description, dan keywords untuk halaman-halaman penting.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Area */}
        <div className="lg:col-span-1 space-y-6">
          <Card title={editingItem ? 'Edit Data SEO' : 'Tambah Data SEO'}>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="entity_type" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipe Konten</label>
                <select id="entity_type" className="block w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-brand-green-900 transition-colors" value={formValues.entity_type} onChange={(e) => setFormValues({ ...formValues, entity_type: e.target.value, entity_id: '' })} required>
                  <option value="news_articles">Artikel Berita</option>
                  <option value="pages">Halaman Umum</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="entity_id" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Konten Spesifik</label>
                <select id="entity_id" className="block w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-brand-green-900 transition-colors" value={formValues.entity_id || ''} onChange={(e) => setFormValues({ ...formValues, entity_id: e.target.value })} disabled={formValues.entity_type !== 'news_articles'}>
                  <option value="">-- Pilih Artikel --</option>
                  {articles.map(article => (
                    <option key={article.id} value={article.id}>{article.title}</option>
                  ))}
                </select>
              </div>

              <Input id="meta_title" label="Meta Title" value={formValues.meta_title} onChange={(e) => setFormValues({ ...formValues, meta_title: e.target.value })} required />
              <Input id="keywords" label="Keywords (koma)" value={formValues.keywords} onChange={(e) => setFormValues({ ...formValues, keywords: e.target.value })} />
              
              <div className="space-y-1">
                <label htmlFor="meta_description" className="text-xs font-bold text-slate-500">Meta Description</label>
                <textarea id="meta_description" className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-green-900 focus:ring-1 focus:ring-brand-green-900 transition-colors" rows={3} value={formValues.meta_description} onChange={(e) => setFormValues({ ...formValues, meta_description: e.target.value })} required />
              </div>

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

          {/* Google Preview SERP Mockup */}
          <Card title="Pratinjau Hasil Google">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-sans space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                <Globe className="h-3 w-3 text-slate-400" />
                <span className="truncate">https://alkhairaat.sch.id &gt; ...</span>
              </div>
              <h4 className="text-blue-800 font-medium text-base hover:underline leading-tight truncate">
                {formValues.meta_title || 'Judul Meta SEO Halaman'}
              </h4>
              <p className="text-slate-600 text-xs leading-normal break-words line-clamp-2">
                {formValues.meta_description || 'Deskripsi meta SEO halaman akan tampil di sini ketika dicari lewat Google Search...'}
              </p>
            </div>
          </Card>
        </div>

        {/* Data Table */}
        <div className="lg:col-span-2">
          {error && <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">{error}</div>}
          <Card title="Data SEO Tersimpan">
            <DataTable
              columns={columns}
              data={seoData}
              isLoading={isLoading}
              searchPlaceholder="Cari Meta SEO..."
              searchKeys={['meta_title', 'meta_description', 'keywords']}
              emptyMessage="Belum ada data SEO."
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

