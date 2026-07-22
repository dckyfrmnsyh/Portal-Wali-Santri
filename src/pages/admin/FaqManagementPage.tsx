import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const FaqManagementPage: React.FC = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('Umum');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadFaqs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) setFaqs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const resetForm = () => {
    setQuestion('');
    setAnswer('');
    setCategory('Umum');
    setSortOrder(0);
    setEditingId(null);
  };

  const handleEdit = (faq: any) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category);
    setSortOrder(faq.sort_order);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      question,
      answer,
      category,
      sort_order: sortOrder,
      is_active: true
    };

    try {
      let error;
      if (editingId) {
        ({ error } = await supabase.from('faqs').update(payload).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('faqs').insert([payload]));
      }
      if (error) throw error;
      resetForm();
      loadFaqs();
    } catch (err: any) {
      alert("Gagal menyimpan FAQ: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus FAQ ini?')) return;
    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      loadFaqs();
    } catch (err: any) {
      alert("Gagal menghapus FAQ: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Kelola Pertanyaan Umum (FAQ)</h2>
        <p className="text-xs text-slate-500 mt-0.5">Tambah, ubah, atau hapus daftar FAQ yang ditampilkan di landing page.</p>
      </div>

      <div className="bg-white border border-brand-cream-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-brand-green-950">{editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="faq-q" label="Pertanyaan" value={question} onChange={(e) => setQuestion(e.target.value)} required />
            <Input id="faq-cat" label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label htmlFor="faq-a" className="text-xs font-bold text-slate-500">Jawaban</label>
            <textarea id="faq-a" className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl" rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} required />
          </div>
          <Input id="faq-order" label="Urutan Tampil" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} required />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={isLoading} className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold px-4 py-2 text-xs rounded-xl">
              {editingId ? 'Simpan Perubahan' : 'Tambah FAQ'}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} className="text-xs font-semibold rounded-xl">Batal</Button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white border border-brand-cream-200 rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-brand-green-950">Daftar FAQ Aktif</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <th className="p-3">Urutan</th>
                <th className="p-3">Pertanyaan</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {faqs.map((faq) => (
                <tr key={faq.id}>
                  <td className="p-3 font-mono">{faq.sort_order}</td>
                  <td className="p-3 font-bold">{faq.question}</td>
                  <td className="p-3">{faq.category}</td>
                  <td className="p-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(faq)} className="p-1.5"><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(faq.id)} className="p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">Belum ada FAQ.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
