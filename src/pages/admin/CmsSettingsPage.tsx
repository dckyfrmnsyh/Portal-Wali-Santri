import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Image as ImageIcon, Divide } from 'lucide-react';

const MediaLibrary = React.lazy(() => import('./MediaLibrary').then(m => ({ default: m.MediaLibrary })));

interface CustomField {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
}

export const CmsSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'about' | 'banners' | 'programs' | 'news' | 'gallery'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selector Modal
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [activeSelectorTarget, setActiveSelectorTarget] = useState<'banners' | 'news' | 'gallery' | null>(null);

  // 1. Config State
  const [config, setConfig] = useState<Record<string, string>>({
    schoolName: '',
    schoolShortName: '',
    location: '',
    locationShort: '',
    adminPhone: '',
    whatsappUrl: '',
    email: '',
    activeStudents: '',
    teachersCount: '',
    narcoticsFree: ''
  });

  // 2. About State
  const [history, setHistory] = useState('');
  const [vision, setVision] = useState('');
  const [missions, setMissions] = useState<string[]>([]);
  const [newMission, setNewMission] = useState('');
  const [valuesList, setValuesList] = useState<any[]>([]);
  const [newValueTitle, setNewValueTitle] = useState('');
  const [newValueDesc, setNewValueDesc] = useState('');

  // 3. Banner State
  const [banners, setBanners] = useState<any[]>([]);
  const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', image_url: '', cta_text: '', cta_url: '', sort_order: 0 });

  // 4. Program State
  const [programsList, setProgramsList] = useState<any[]>([]);
  const [newProgram, setNewProgram] = useState({ title: '', description: '', icon: 'BookOpen', sort_order: 0 });

  // 5. News State
  const [news, setNews] = useState<any[]>([]);
  const [newArticle, setNewArticle] = useState({ title: '', slug: '', content: '', image_url: '', category: 'Pendidikan', status: 'published' });

  // 6. Gallery State
  const [gallery, setGallery] = useState<any[]>([]);
  const [newGalleryItem, setNewGalleryItem] = useState({ title: '', image_url: '', category: 'belajar', sort_order: 0 });

  // 7. Custom Fields State
  const [newsCustomFields, setNewsCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // 8. Editing State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const [
        { data: configData },
        { data: aboutData },
        { data: bannerData },
        { data: programsData },
        { data: newsData },
        { data: galleryData },
        { data: customFieldsData }
      ] = await Promise.all([
        supabase.from('site_config').select('*'),
        supabase.from('about_content').select('*').maybeSingle(),
        supabase.from('hero_banners').select('*').order('sort_order', { ascending: true }),
        supabase.from('programs_data').select('*').order('sort_order', { ascending: true }),
        supabase.from('news_articles').select('*').order('created_at', { ascending: false }),
        supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('custom_fields').select('*').eq('entity_type', 'news_articles').order('sort_order'),
      ]);

      if (configData) {
        const configMap: Record<string, string> = { ...config };
        configData.forEach((item: any) => {
          configMap[item.key] = item.value;
        });
        setConfig(configMap);
      }

      if (aboutData) {
        setHistory(aboutData.history || '');
        setVision(aboutData.vision || '');
        setMissions(Array.isArray(aboutData.mission) ? aboutData.mission : []);
        setValuesList(Array.isArray(aboutData.values) ? aboutData.values : []);
      }

      if (bannerData) setBanners(bannerData);
      if (programsData) setProgramsList(programsData);
      if (newsData) setNews(newsData);
      if (galleryData) setGallery(galleryData);
      if (customFieldsData) setNewsCustomFields(customFieldsData);
    } catch (err: any) {
      setErrorMsg('Gagal memuat data CMS: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const upsertRows = Object.entries(config).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from('site_config').upsert(upsertRows);
      if (error) throw error;
      setSuccessMsg('Konfigurasi web berhasil disimpan!');
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan konfigurasi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      // get existing or insert
      const { data: existing } = await supabase.from('about_content').select('id').maybeSingle();
      
      const payload: any = {
        history,
        vision,
        mission: missions,
        values: valuesList,
        updated_at: new Date().toISOString()
      };

      if (existing?.id) {
        const { error } = await supabase.from('about_content').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('about_content').insert([payload]);
        if (error) throw error;
      }
      setSuccessMsg('Data Visi, Misi & Profil berhasil disimpan!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMission = () => {
    if (!newMission.trim()) return;
    setMissions([...missions, newMission.trim()]);
    setNewMission('');
  };

  const handleDeleteMission = (idx: number) => {
    setMissions(missions.filter((_, i) => i !== idx));
  };

  const handleAddValue = () => {
    if (!newValueTitle.trim() || !newValueDesc.trim()) return;
    setValuesList([...valuesList, { title: newValueTitle.trim(), desc: newValueDesc.trim() }]);
    setNewValueTitle('');
    setNewValueDesc('');
  };

  const handleDeleteValue = (idx: number) => {
    setValuesList(valuesList.filter((_, i) => i !== idx));
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { error } = await supabase.from('hero_banners').insert([newBanner]);
      if (error) throw error;
      setSuccessMsg('Banner baru berhasil ditambahkan!');
      setNewBanner({ title: '', subtitle: '', image_url: '', cta_text: '', cta_url: '', sort_order: 0 });
      loadData();
    } catch (err: any) {
      setErrorMsg('Gagal menambah banner: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Hapus banner ini?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('hero_banners').delete().eq('id', id);
      if (error) throw error;
      setSuccessMsg('Banner berhasil dihapus.');
      loadData();
    } catch (err: any) {
      setErrorMsg('Gagal menghapus: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { error } = await supabase.from('programs_data').insert([newProgram]);
      if (error) throw error;
      setSuccessMsg('Program berhasil ditambahkan!');
      setNewProgram({ title: '', description: '', icon: 'BookOpen', sort_order: 0 });
      loadData();
    } catch (err: any) {
      setErrorMsg('Gagal menambah program: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!window.confirm('Hapus program ini?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('programs_data').delete().eq('id', id);
      if (error) throw error;
      setSuccessMsg('Program berhasil dihapus.');
      loadData();
    } catch (err: any) {
      setErrorMsg('Gagal menghapus: ' + err.message);
      setIsLoading(false);
    }
  };

  const resetNewsForm = () => {
    setNewArticle({ title: '', slug: '', content: '', image_url: '', category: 'Pendidikan', status: 'published' });
    setCustomFieldValues({});
    setEditingArticleId(null);
  };

  const handleEditArticle = async (item: any) => {
    setEditingArticleId(item.id);
    setNewArticle({
      title: item.title || '',
      slug: item.slug || '',
      content: item.content || '',
      image_url: item.image_url || '',
      category: item.category || 'Pendidikan',
      status: item.status || 'published',
    });

    try {
      const { data, error } = await supabase
        .from('custom_field_values')
        .select('value, custom_fields(field_key)')
        .eq('entity_id', item.id);

      if (error) throw error;

      const valuesMap: Record<string, any> = {};
      if (data) {
        data.forEach((val: any) => {
          if (val.custom_fields && val.custom_fields.field_key) {
            valuesMap[val.custom_fields.field_key] = val.value;
          }
        });
      }
      setCustomFieldValues(valuesMap);
    } catch (err: any) {
      setErrorMsg('Gagal memuat nilai custom field: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">CMS Landing Page</h2>
        <p className="text-xs text-slate-500 mt-0.5">Kelola konten informasi umum, visi, misi, program, dan gambar landing page secara dinamis.</p>
      </div>

      {successMsg && <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">{successMsg}</div>}
      {errorMsg && <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">{errorMsg}</div>}

      <div className="flex border-b border-slate-200 gap-2 flex-wrap">
        <button onClick={() => setActiveTab('config')} className={`px-4 py-2 text-xs font-bold ${activeTab === 'config' ? 'border-b-2 border-brand-green-900 text-brand-green-900' : 'text-slate-500'}`}>Konfigurasi Situs</button>
        <button onClick={() => setActiveTab('about')} className={`px-4 py-2 text-xs font-bold ${activeTab === 'about' ? 'border-b-2 border-brand-green-900 text-brand-green-900' : 'text-slate-500'}`}>Profil & Visi Misi</button>
        <button onClick={() => setActiveTab('banners')} className={`px-4 py-2 text-xs font-bold ${activeTab === 'banners' ? 'border-b-2 border-brand-green-900 text-brand-green-900' : 'text-slate-500'}`}>Hero Banner</button>
        <button onClick={() => setActiveTab('programs')} className={`px-4 py-2 text-xs font-bold ${activeTab === 'programs' ? 'border-b-2 border-brand-green-900 text-brand-green-900' : 'text-slate-500'}`}>Program Pendidikan</button>
        <button onClick={() => setActiveTab('news')} className={`px-4 py-2 text-xs font-bold ${activeTab === 'news' ? 'border-b-2 border-brand-green-900 text-brand-green-900' : 'text-slate-500'}`}>Berita</button>
        <button onClick={() => setActiveTab('gallery')} className={`px-4 py-2 text-xs font-bold ${activeTab === 'gallery' ? 'border-b-2 border-brand-green-900 text-brand-green-900' : 'text-slate-500'}`}>Galeri</button>
      </div>

      <div className="bg-white border border-brand-cream-200 rounded-2xl p-6">
        {isLoading && <p className="text-xs text-slate-500 mb-4 animate-pulse">Menghubungkan ke database...</p>}

        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input id="schName" label="Nama Sekolah" value={config.schoolName || ''} onChange={(e) => setConfig({ ...config, schoolName: e.target.value })} required />
              <Input id="schShort" label="Nama Singkat" value={config.schoolShortName || ''} onChange={(e) => setConfig({ ...config, schoolShortName: e.target.value })} required />
              <Input id="loc" label="Alamat Lengkap" value={config.location || ''} onChange={(e) => setConfig({ ...config, location: e.target.value })} required />
              <Input id="locShort" label="Alamat Singkat" value={config.locationShort || ''} onChange={(e) => setConfig({ ...config, locationShort: e.target.value })} required />
              <Input id="phone" label="Humas Phone" value={config.adminPhone || ''} onChange={(e) => setConfig({ ...config, adminPhone: e.target.value })} required />
              <Input id="wa" label="Link WhatsApp" value={config.whatsappUrl || ''} onChange={(e) => setConfig({ ...config, whatsappUrl: e.target.value })} required />
              <Input id="mail" label="Email" type="email" value={config.email || ''} onChange={(e) => setConfig({ ...config, email: e.target.value })} required />
              <Input id="stat-stud" label="Statistik Santri Aktif" value={config.activeStudents || ''} onChange={(e) => setConfig({ ...config, activeStudents: e.target.value })} required />
              <Input id="stat-teach" label="Statistik Guru" value={config.teachersCount || ''} onChange={(e) => setConfig({ ...config, teachersCount: e.target.value })} required />
              <Input id="stat-narc" label="Statistik Bebas Narkoba" value={config.narcoticsFree || ''} onChange={(e) => setConfig({ ...config, narcoticsFree: e.target.value })} required />
            </div>
            <Button type="submit" variant="primary" disabled={isLoading} className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl px-5 text-xs py-2.5">Simpan Konfigurasi</Button>
          </form>
        )}

        {activeTab === 'about' && (
          <form onSubmit={handleSaveAbout} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="history-txt" className="text-xs font-bold text-slate-500">Sejarah Singkat</label>
              <textarea id="history-txt" className="block w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium" rows={4} value={history} onChange={(e) => setHistory(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label htmlFor="vision-txt" className="text-xs font-bold text-slate-500">Visi</label>
              <textarea id="vision-txt" className="block w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium" rows={2} value={vision} onChange={(e) => setVision(e.target.value)} required />
            </div>

            {/* Misi List (Input Berulang) */}
            <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Misi Sekolah</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik misi baru disini..."
                  className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                  value={newMission}
                  onChange={(e) => setNewMission(e.target.value)}
                />
                <button type="button" onClick={handleAddMission} className="bg-brand-green-900 text-white text-xs font-bold px-4 py-2 rounded-xl">Tambah</button>
              </div>
              <ul className="space-y-1 mt-2">
                {missions.map((m, idx) => (
                  <li key={idx} className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                    <span>{m}</span>
                    <button type="button" onClick={() => handleDeleteMission(idx)} className="text-rose-600 font-bold">Hapus</button>
                  </li>
                ))}
                {missions.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada misi ditambahkan.</p>}
              </ul>
            </div>

            {/* Nilai Utama List (Input Berulang) */}
            <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Nilai Utama (Values)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama Nilai (Contoh: Disiplin)"
                  className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                  value={newValueTitle}
                  onChange={(e) => setNewValueTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Keterangan singkat..."
                  className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                  value={newValueDesc}
                  onChange={(e) => setNewValueDesc(e.target.value)}
                />
              </div>
              <button type="button" onClick={handleAddValue} className="bg-brand-green-900 text-white text-xs font-bold px-4 py-2 rounded-xl w-full sm:w-auto">Tambah Nilai</button>
              
              <ul className="space-y-1 mt-2">
                {valuesList.map((v, idx) => (
                  <li key={idx} className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                    <div>
                      <strong className="text-slate-800">{v.title}: </strong>
                      <span>{v.desc || v.description}</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteValue(idx)} className="text-rose-600 font-bold ml-2">Hapus</button>
                  </li>
                ))}
                {valuesList.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada nilai utama ditambahkan.</p>}
              </ul>
            </div>

            <Button type="submit" variant="primary" disabled={isLoading} className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl px-5 text-xs py-2.5">Simpan Profil & Visi Misi</Button>
          </form>
        )}

        {activeTab === 'banners' && (
          <div className="space-y-6">
            <form onSubmit={handleAddBanner} className="space-y-4 border-b border-slate-100 pb-6">
              <h4 className="text-xs font-bold text-brand-green-950 uppercase">Tambah Banner Baru</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input id="b-title" label="Judul Banner" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} />
                <Input id="b-sub" label="Sub Judul Banner" value={newBanner.subtitle} onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })} />
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Gambar Banner</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                      value={newBanner.image_url}
                      onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                      required
                      placeholder="Masukkan URL gambar atau pilih..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSelectorTarget('banners');
                        setIsMediaSelectorOpen(true);
                      }}
                      className="bg-brand-green-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Pilih Media
                    </button>
                  </div>
                </div>
                <Input id="b-cta" label="Teks Tombol CTA" value={newBanner.cta_text} onChange={(e) => setNewBanner({ ...newBanner, cta_text: e.target.value })} />
                <Input id="b-cta-url" label="Link Tombol CTA" value={newBanner.cta_url} onChange={(e) => setNewBanner({ ...newBanner, cta_url: e.target.value })} />
                <Input id="b-order" label="Urutan Tampil" type="number" value={newBanner.sort_order} onChange={(e) => setNewBanner({ ...newBanner, sort_order: Number(e.target.value) })} required />
              </div>
              <Button type="submit" variant="primary" disabled={isLoading} className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl px-5 text-xs py-2.5">Tambah Banner</Button>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-brand-green-950 uppercase">Daftar Banner Aktif</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3">Urutan</th>
                      <th className="p-3">Judul</th>
                      <th className="p-3">Gambar</th>
                      <th className="p-3">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {banners.map((b) => (
                      <tr key={b.id}>
                        <td className="p-3 font-mono">{b.sort_order}</td>
                        <td className="p-3 font-bold">{b.title || 'N/A'}</td>
                        <td className="p-3 truncate max-w-xs">{b.image_url}</td>
                        <td className="p-3">
                          <button type="button" onClick={() => handleDeleteBanner(b.id)} className="text-rose-600 font-bold hover:underline cursor-pointer">Hapus</button>
                        </td>
                      </tr>
                    ))}
                    {banners.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">Tidak ada banner aktif.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="space-y-6">
            <form onSubmit={handleAddProgram} className="space-y-4 border-b border-slate-100 pb-6">
              <h4 className="text-xs font-bold text-brand-green-950 uppercase">Tambah Program Pendidikan Baru</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input id="p-title" label="Nama Program" value={newProgram.title} onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })} required />
                <Input id="p-desc" label="Deskripsi" value={newProgram.description} onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })} required />
                <div className="space-y-1.5">
                  <label htmlFor="p-icon" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Icon</label>
                  <select id="p-icon" className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700" value={newProgram.icon} onChange={(e) => setNewProgram({ ...newProgram, icon: e.target.value })} required>
                    <option value="BookOpen">Al-Kitab (BookOpen)</option>
                    <option value="Layers">Tumpukan (Layers)</option>
                    <option value="Award">Medali/Piala (Award)</option>
                    <option value="Shield">Perisai (Shield)</option>
                    <option value="Compass">Kompas (Compass)</option>
                    <option value="Heart">Hati (Heart)</option>
                  </select>
                </div>
                <Input id="p-order" label="Urutan Tampil" type="number" value={newProgram.sort_order} onChange={(e) => setNewProgram({ ...newProgram, sort_order: Number(e.target.value) })} required />
              </div>
              <Button type="submit" variant="primary" disabled={isLoading} className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl px-5 text-xs py-2.5">Tambah Program</Button>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-brand-green-950 uppercase">Daftar Program Terdaftar</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3">Urutan</th>
                      <th className="p-3">Nama Program</th>
                      <th className="p-3">Ikon</th>
                      <th className="p-3">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {programsList.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-mono">{p.sort_order}</td>
                        <td className="p-3 font-bold">{p.title}</td>
                        <td className="p-3">{p.icon}</td>
                        <td className="p-3">
                          <button type="button" onClick={() => handleDeleteProgram(p.id)} className="text-rose-600 font-bold hover:underline cursor-pointer">Hapus</button>
                        </td>
                      </tr>
                    ))}
                    {programsList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">Tidak ada program pendidikan terdaftar.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-6">
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              try {
                let articleId: string;

                if (editingArticleId) {
                  // Update existing article
                  const { data, error } = await supabase
                    .from('news_articles')
                    .update(newArticle)
                    .eq('id', editingArticleId)
                    .select('id')
                    .single();
                  if (error) throw error;
                  articleId = data.id;
                } else {
                  // Insert new article
                  const { data, error } = await supabase
                    .from('news_articles')
                    .insert([newArticle])
                    .select('id')
                    .single();
                  if (error) throw error;
                  articleId = data.id;
                }

                // Upsert custom field values
                const valuesToUpsert = newsCustomFields.map(field => ({
                  custom_field_id: field.id,
                  entity_id: articleId,
                  value: customFieldValues[field.field_key] || null,
                }));

                if (valuesToUpsert.length > 0) {
                  const { error: valuesError } = await supabase.from('custom_field_values').upsert(valuesToUpsert, { onConflict: 'custom_field_id,entity_id' });
                  if (valuesError) throw valuesError;
                }

                setSuccessMsg(`Artikel berita berhasil ${editingArticleId ? 'diperbarui' : 'diterbitkan'}!`);
                resetNewsForm();
                loadData();
              } catch (err: any) {
                setErrorMsg('Gagal menyimpan berita: ' + err.message);
              } finally {
                setIsLoading(false);
              }
            }} className="space-y-4 border-b border-slate-100 pb-6">
              <h4 className="text-xs font-bold text-brand-green-950 uppercase">{editingArticleId ? 'Edit Berita' : 'Tulis Berita Baru'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input id="n-title" label="Judul Berita" value={newArticle.title} onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} required />
                <Input id="n-slug" label="Slug URL" value={newArticle.slug} onChange={(e) => setNewArticle({ ...newArticle, slug: e.target.value })} required />
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Gambar Cover</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                      value={newArticle.image_url}
                      onChange={(e) => setNewArticle({ ...newArticle, image_url: e.target.value })}
                      required
                      placeholder="Masukkan URL gambar atau pilih..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSelectorTarget('news');
                        setIsMediaSelectorOpen(true);
                      }}
                      className="bg-brand-green-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Pilih Media
                    </button>
                  </div>
                </div>
                <Input id="n-cat" label="Kategori" value={newArticle.category} onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })} required />
              </div>
              {/* Render Custom Fields */}
              {newsCustomFields.map(field => (
                <div key={field.id}>
                  <Input
                    id={`cf-${field.field_key}`}
                    label={field.field_label}
                    type={field.field_type}
                    value={customFieldValues[field.field_key] || ''}
                    onChange={e => setCustomFieldValues({...customFieldValues, [field.field_key]: e.target.value})}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label htmlFor="n-content" className="text-xs font-bold text-slate-500">Isi Berita</label>
                <textarea id="n-content" className="block w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700" rows={4} value={newArticle.content} onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={isLoading} className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl px-5 text-xs py-2.5">
                  {editingArticleId ? 'Simpan Perubahan' : 'Terbitkan Berita'}
                </Button>
                {editingArticleId && <Button type="button" variant="outline" onClick={resetNewsForm}>Batal</Button>}
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-brand-green-950 uppercase">Daftar Artikel Berita</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3">Judul Berita</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Tanggal Dibuat</th>
                      <th className="p-3">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {news.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-bold">{item.title}</td>
                        <td className="p-3">{item.category}</td>
                        <td className="p-3">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditArticle(item)}>Edit</Button>
                          <button type="button" onClick={async () => {
                            if (!window.confirm('Hapus berita ini?')) return;
                            setIsLoading(true);
                            try {
                              await supabase.from('custom_field_values').delete().eq('entity_id', item.id);
                              const { error } = await supabase.from('news_articles').delete().eq('id', item.id);
                              if (error) throw error;
                              setSuccessMsg('Artikel berita berhasil dihapus.');
                              loadData();
                            } catch (err: any) {
                              setErrorMsg('Gagal menghapus: ' + err.message);
                            } finally {
                              setIsLoading(false);
                            }
                          }} className="text-rose-600 font-bold hover:underline cursor-pointer p-2 rounded-md hover:bg-rose-50">Hapus</button>
                        </td>
                      </tr>
                    ))}
                    {news.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">Belum ada berita diterbitkan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              try {
                const { error } = await supabase.from('gallery_items').insert([newGalleryItem]);
                if (error) throw error;
                setSuccessMsg('Foto baru berhasil diunggah ke galeri!');
                setNewGalleryItem({ title: '', image_url: '', category: 'belajar', sort_order: 0 });
                loadData();
              } catch (err: any) {
                setErrorMsg('Gagal menambah galeri: ' + err.message);
              } finally {
                setIsLoading(false);
              }
            }} className="space-y-4 border-b border-slate-100 pb-6">
              <h4 className="text-xs font-bold text-brand-green-950 uppercase">Unggah Foto Galeri Baru</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input id="g-title" label="Keterangan Foto" value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({ ...newGalleryItem, title: e.target.value })} required />
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Gambar</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                      value={newGalleryItem.image_url}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, image_url: e.target.value })}
                      required
                      placeholder="Masukkan URL gambar atau pilih..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSelectorTarget('gallery');
                        setIsMediaSelectorOpen(true);
                      }}
                      className="bg-brand-green-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Pilih Media
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="g-cat" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Kategori Album</label>
                  <select id="g-cat" className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700" value={newGalleryItem.category} onChange={(e) => setNewGalleryItem({ ...newGalleryItem, category: e.target.value })} required>
                    <option value="belajar">Belajar</option>
                    <option value="ibadah">Ibadah</option>
                    <option value="ekstra">Ekstra</option>
                  </select>
                </div>
                <Input id="g-order" label="Urutan Tampil" type="number" value={newGalleryItem.sort_order} onChange={(e) => setNewGalleryItem({ ...newGalleryItem, sort_order: Number(e.target.value) })} required />
              </div>
              <Button type="submit" variant="primary" disabled={isLoading} className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl px-5 text-xs py-2.5">Unggah Foto</Button>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-brand-green-950 uppercase">Daftar Foto Galeri</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3">Urutan</th>
                      <th className="p-3">Keterangan</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gallery.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-mono">{item.sort_order}</td>
                        <td className="p-3 font-bold">{item.title}</td>
                        <td className="p-3 uppercase">{item.category}</td>
                        <td className="p-3">
                          <button type="button" onClick={async () => {
                            if (!window.confirm('Hapus foto ini dari galeri?')) return;
                            setIsLoading(true);
                            try {
                              const { error } = await supabase.from('gallery_items').delete().eq('id', item.id);
                              if (error) throw error;
                              setSuccessMsg('Foto galeri berhasil dihapus.');
                              loadData();
                            } catch (err: any) {
                              setErrorMsg('Gagal menghapus: ' + err.message);
                              setIsLoading(false);
                            }
                          }} className="text-rose-600 font-bold hover:underline cursor-pointer">Hapus</button>
                        </td>
                      </tr>
                    ))}
                    {gallery.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">Belum ada foto galeri diunggah.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isMediaSelectorOpen} onClose={() => setIsMediaSelectorOpen(false)} title="Pilih Media dari Pustaka" size="4xl">
        <React.Suspense fallback={<div className="flex items-center justify-center p-8 text-xs font-semibold text-slate-500">Memuat Pustaka Media...</div>}>
          <MediaLibrary
            isSelectorMode={true}
            onSelectMedia={(url) => {
              if (activeSelectorTarget === 'banners') {
                setNewBanner({ ...newBanner, image_url: url });
              } else if (activeSelectorTarget === 'news') {
                setNewArticle({ ...newArticle, image_url: url });
              } else if (activeSelectorTarget === 'gallery') {
                setNewGalleryItem({ ...newGalleryItem, image_url: url });
              }
              setIsMediaSelectorOpen(false);
              setActiveSelectorTarget(null);
            }}
            onCloseSelector={() => setIsMediaSelectorOpen(false)}
          />
        </React.Suspense>
      </Modal>
    </div>
  );
};
