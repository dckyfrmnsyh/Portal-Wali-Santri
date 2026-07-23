import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, Save, Plus, Trash2, ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { TextBlockEditor } from '../../components/page-builder/editor/TextBlockEditor';
import { ImageBlockEditor } from '../../components/page-builder/editor/ImageBlockEditor';
import { Modal } from '../../components/ui/Modal';

const MediaLibrary = React.lazy(() => import('../admin/MediaLibrary').then(m => ({ default: m.MediaLibrary })));

// Tipe untuk Blok Konten
type ContentBlock = 
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'image'; url: string; alt: string };

interface PageEditorProps {
  pageId: string | null;
  onBack: () => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({ pageId, onBack }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [sections, setSections] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk Media Library
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [activeImageBlockId, setActiveImageBlockId] = useState<string | null>(null);


  useEffect(() => {
    if (pageId) {
      const loadPage = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('pages')
          .select('title, slug, status, sections')
          .eq('id', pageId)
          .single();
        
        if (error) {
          setError(error.message);
        } else if (data) {
          setTitle(data.title);
          setSlug(data.slug);
          setStatus(data.status);
          setSections(data.sections || []);
        }
        setIsLoading(false);
      };
      loadPage();
    }
  }, [pageId]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    const payload = {
      title,
      slug,
      status,
      sections: sections,
      updated_at: new Date().toISOString(),
    };

    try {
      let error;
      if (pageId) {
        // Update
        ({ error } = await supabase.from('pages').update(payload).eq('id', pageId));
      } else {
        // Insert
        ({ error } = await supabase.from('pages').insert([payload]));
      }

      if (error) throw error;
      alert('Halaman berhasil disimpan!');
      onBack();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addTextBlock = () => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: 'text',
      content: '',
    };
    setSections([...sections, newBlock]);
  };

  const addImageBlock = () => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: 'image',
      url: '',
      alt: '',
    };
    setSections([...sections, newBlock]);
  };

  const updateBlock = (id: string, newContent: Partial<ContentBlock>) => {
    setSections(sections.map(block => 
      block.id === id ? ({ ...block, ...newContent } as ContentBlock) : block
    ));
  };

  const removeBlock = (id: string) => {
    setSections(sections.filter(block => block.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    setSections(newSections);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Halaman
          </button>
          <h2 className="text-xl font-bold text-brand-green-950 font-serif">{pageId ? 'Edit Halaman' : 'Buat Halaman Baru'}</h2>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="bg-brand-green-900 text-white font-bold text-xs rounded-xl flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? 'Menyimpan...' : 'Simpan Halaman'}
        </Button>
      </div>

      {error && <p className="text-rose-500 bg-rose-50 p-3 rounded-lg">{error}</p>}

      <div className="bg-white border border-brand-cream-200 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input id="title" label="Judul Halaman" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Tentang Kami" />
          <Input id="slug" label="Slug URL" value={slug} onChange={e => setSlug(e.target.value)} placeholder="contoh: tentang-kami" />
          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</label>
            <select id="status" className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-brand-cream-200 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-brand-green-950">Konten Halaman</h3>
          <div className="flex gap-2">
            <Button onClick={addTextBlock} variant="outline" size="sm" className="text-xs font-bold">
              <Plus className="h-4 w-4 mr-1" />
              Teks
            </Button>
            <Button onClick={addImageBlock} variant="outline" size="sm" className="text-xs font-bold">
              <ImageIcon className="h-4 w-4 mr-1" />
              Gambar
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {sections.map((block, index) => (
            <div key={block.id} className="relative group/block border border-transparent hover:border-slate-200 rounded-xl transition-all p-1">
              {block.type === 'text' && (
                <TextBlockEditor 
                  content={block.content}
                  onChange={(newContent) => updateBlock(block.id, { content: newContent })}
                />
              )}
              {block.type === 'image' && (
                <ImageBlockEditor
                  url={block.url}
                  alt={block.alt}
                  onUrlChange={(newUrl) => updateBlock(block.id, { url: newUrl })}
                  onAltChange={(newAlt) => updateBlock(block.id, { alt: newAlt })}
                  onSelectImage={() => {
                    setActiveImageBlockId(block.id);
                    setIsMediaSelectorOpen(true);
                  }}
                />
              )}

              <div className="absolute top-2 right-2 flex gap-1 bg-white/80 backdrop-blur-xs p-1 rounded-lg border border-slate-100 opacity-0 group-hover/block:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveBlock(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Pindahkan ke atas"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, 'down')}
                  disabled={index === sections.length - 1}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Pindahkan ke bawah"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <div className="w-px bg-slate-200 my-0.5 mx-1" />
                <button 
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="p-1 rounded-md text-rose-500 hover:bg-rose-50"
                  title="Hapus blok"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {sections.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada konten. Klik "Tambah Blok" untuk memulai.</p>
          )}
        </div>
      </div>

      <Modal isOpen={isMediaSelectorOpen} onClose={() => setIsMediaSelectorOpen(false)} title="Pilih Media dari Pustaka" size="4xl">
        <React.Suspense fallback={<div className="flex items-center justify-center p-8 text-xs font-semibold text-slate-500">Memuat Pustaka Media...</div>}>
          <MediaLibrary
            isSelectorMode={true}
            onSelectMedia={(url) => {
              if (activeImageBlockId) {
                updateBlock(activeImageBlockId, { url });
              }
              setIsMediaSelectorOpen(false);
              setActiveImageBlockId(null);
            }}
            onCloseSelector={() => setIsMediaSelectorOpen(false)}
          />
        </React.Suspense>
      </Modal>
    </div>
  );
};

