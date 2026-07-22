import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Upload, Trash2, Copy, Search, Landmark } from 'lucide-react';

interface MediaLibraryProps {
  onSelectMedia?: (url: string) => void;
  onCloseSelector?: () => void;
  isSelectorMode?: boolean;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelectMedia,
  onCloseSelector,
  isSelectorMode = false
}) => {
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('Umum');
  const [altText, setAltText] = useState('');

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMediaItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileToUpload(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setIsUploading(true);
    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `media-${Date.now()}.${fileExt}`;
      const filePath = `library/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts') // ponytail: share receipts bucket for assets in simplified setup
        .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      let fileType = 'document';
      if (fileToUpload.type.startsWith('image/')) fileType = 'image';
      else if (fileToUpload.type.startsWith('video/')) fileType = 'video';

      const { error: dbError } = await supabase.from('media_library').insert([{
        file_name: fileToUpload.name,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileToUpload.size,
        category: uploadCategory,
        alt_text: altText
      }]);

      if (dbError) throw dbError;

      alert('Berkas berhasil diunggah ke Media Library!');
      setFileToUpload(null);
      setAltText('');
      loadMedia();
    } catch (err: any) {
      alert('Gagal mengunggah berkas: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!window.confirm('Hapus media ini secara permanen?')) return;
    try {
      const { error } = await supabase.from('media_library').delete().eq('id', id);
      if (error) throw error;
      
      // ponytail: in storage, we can delete the actual asset if needed
      alert('Media berhasil dihapus.');
      loadMedia();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Tautan media disalin!');
  };

  const filteredMedia = mediaItems.filter((item) => {
    const matchesSearch = item.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'Umum', 'Berita', 'Galeri', 'Banner', 'Dokumen'];

  return (
    <div className={`space-y-6 ${isSelectorMode ? 'p-2' : ''}`}>
      {!isSelectorMode && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-brand-green-950 font-serif">Pustaka Media & Aset</h2>
            <p className="text-xs text-slate-500 mt-0.5">Unggah, kelola, dan dapatkan tautan URL gambar secara real-time untuk pengisian CMS.</p>
          </div>
        </div>
      )}

      {/* UPLOAD FORM (Only visible in normal mode, or collapsed in selector) */}
      {!isSelectorMode && (
        <div className="bg-white border border-brand-cream-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 border border-dashed border-slate-300 rounded-xl p-6 text-center flex flex-col justify-center items-center">
            <input type="file" id="media-upload-file" className="hidden" onChange={handleFileChange} />
            <label htmlFor="media-upload-file" className="cursor-pointer space-y-2">
              <Upload className="h-8 w-8 text-slate-400 mx-auto" />
              <span className="font-semibold text-brand-green-900 block text-xs">Klik untuk memilih file</span>
              <span className="text-[10px] text-slate-400">Ekstensi yang diterima: JPG, PNG, WEBP, PDF (Maksimal 5MB)</span>
            </label>
            {fileToUpload && (
              <p className="text-xs text-emerald-700 font-bold mt-2">Terpilih: {fileToUpload.name}</p>
            )}
          </div>
          <form onSubmit={handleUpload} className="md:col-span-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="upload-cat" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Kategori Media</label>
              <select
                id="upload-cat"
                className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
              >
                <option value="Umum">Umum</option>
                <option value="Berita">Berita</option>
                <option value="Galeri">Galeri</option>
                <option value="Banner">Banner</option>
                <option value="Dokumen">Dokumen</option>
              </select>
            </div>
            <Input id="alt-txt" label="Deskripsi Alternatif (Alt Text)" placeholder="Misal: Foto Siswa Berprestasi" value={altText} onChange={(e) => setAltText(e.target.value)} />
            <Button type="submit" disabled={isUploading || !fileToUpload} className="w-full bg-brand-green-900 text-white text-xs font-bold py-2.5 rounded-xl">
              {isUploading ? 'Mengunggah...' : 'Unggah Media'}
            </Button>
          </form>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari file berdasarkan nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-white"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-emerald-950 border-amber-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* MEDIA GRID */}
      {isLoading ? (
        <p className="text-xs text-slate-400 animate-pulse">Memuat pustaka media...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div key={item.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xs p-2 flex flex-col justify-between group relative">
              <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                {item.file_type === 'image' ? (
                  <img src={item.file_url} alt={item.alt_text || item.file_name} className="w-full h-full object-cover" />
                ) : (
                  <Landmark className="h-10 w-10 text-indigo-300" />
                )}
                <span className="absolute top-1 right-1 text-[8px] font-black uppercase bg-slate-900/60 text-white px-1.5 py-0.5 rounded">
                  {Math.round(item.file_size / 1024)} KB
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-700 truncate" title={item.file_name}>{item.file_name}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</p>
              </div>

              {isSelectorMode ? (
                <button
                  type="button"
                  onClick={() => onSelectMedia?.(item.file_url)}
                  className="w-full mt-2 bg-brand-green-900 text-white text-[10px] font-bold py-1.5 rounded-lg cursor-pointer hover:bg-brand-green-800"
                >
                  Pilih Media
                </button>
              ) : (
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.file_url)}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-500 p-1.5 rounded-lg hover:text-brand-green-900 flex items-center justify-center cursor-pointer"
                    title="Salin Link"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.file_url)}
                    className="bg-slate-50 border border-slate-200 text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredMedia.length === 0 && (
            <p className="text-xs text-slate-400 italic col-span-full text-center py-8">Belum ada aset media terdaftar.</p>
          )}
        </div>
      )}
    </div>
  );
};
