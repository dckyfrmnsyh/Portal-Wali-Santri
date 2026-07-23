import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Plus, Edit2, Trash2, Folder, CornerDownRight } from 'lucide-react';

// Tipe data untuk item menu
interface NavMenuItem {
  id: string;
  label: string;
  url: string;
  parent_id: string | null;
  location: 'header' | 'footer';
  sort_order: number;
  is_active: boolean;
  children?: NavMenuItem[];
}

interface NavMenuPageProps {
  onRefresh?: () => void;
}

export const NavMenuPage: React.FC<NavMenuPageProps> = ({ onRefresh }) => {
  const [menuItems, setMenuItems] = useState<NavMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [editingItem, setEditingItem] = useState<NavMenuItem | null>(null);
  const [formValues, setFormValues] = useState({
    label: '',
    url: '',
    location: 'header' as 'header' | 'footer',
    parent_id: null as string | null,
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setEditingItem(null);
    setFormValues({
      label: '',
      url: '',
      location: 'header',
      parent_id: null,
      sort_order: 0,
      is_active: true,
    });
  };

  const handleEdit = (item: NavMenuItem) => {
    setEditingItem(item);
    setFormValues({
      label: item.label,
      url: item.url,
      location: item.location,
      parent_id: item.parent_id,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { ...formValues };
      let error;

      if (editingItem) {
        ({ error } = await supabase.from('nav_menus').update(payload).eq('id', editingItem.id));
      } else {
        ({ error } = await supabase.from('nav_menus').insert([payload]));
      }
      
      if (error) throw error;
      resetForm();
      loadMenus();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus item menu ini?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('nav_menus').delete().eq('id', id);
      if (error) throw error;
      loadMenus();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMenus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('nav_menus')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Proses data untuk membuat struktur parent-child
      const itemsById = new Map(data.map(item => [item.id, { ...item, children: [] }]));
      const rootItems: NavMenuItem[] = [];

      data.forEach(item => {
        if (item.parent_id && itemsById.has(item.parent_id)) {
          itemsById.get(item.parent_id)?.children.push(itemsById.get(item.id)!);
        } else {
          rootItems.push(itemsById.get(item.id)!);
        }
      });

      setMenuItems(rootItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const headerMenus = menuItems.filter(item => item.location === 'header');
  const footerMenus = menuItems.filter(item => item.location === 'footer');

  // Komponen untuk render item menu
  const MenuItem: React.FC<{ item: NavMenuItem; isSub?: boolean }> = ({ item, isSub = false }) => (
    <div className={`p-3 rounded-lg border flex justify-between items-center transition-all ${
      isSub 
        ? 'bg-slate-50 border-slate-200/50 hover:bg-slate-100/50' 
        : 'bg-white border-slate-100 hover:shadow-xs'
    }`}>
      <div className="flex items-center gap-2">
        {isSub ? (
          <CornerDownRight className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-brand-green-800/60 shrink-0" />
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-bold text-xs sm:text-sm text-slate-800">{item.label}</span>
          <span className="text-[10px] text-slate-400 font-mono">{item.url}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge
          label={item.is_active ? 'Aktif' : 'Non-Aktif'}
          colorClass={item.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-650 border-slate-150'}
        />
        <div className="flex gap-1.5 border-l border-slate-100 pl-3">
          <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="p-1.5 hover:bg-slate-50">
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 border-rose-100">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Manajemen Menu Navigasi</h2>
        <p className="text-xs text-slate-500 mt-0.5">Kelola tautan menu yang tampil di bagian header dan footer website publik.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Area */}
        <div className="lg:col-span-1">
          <Card title={editingItem ? 'Edit Item Menu' : 'Tambah Item Menu'}>
            <form onSubmit={handleSave} className="space-y-4">
              <Input id="label" label="Label Menu" value={formValues.label} onChange={(e) => setFormValues({ ...formValues, label: e.target.value })} required />
              <Input id="url" label="URL/Tautan" value={formValues.url} onChange={(e) => setFormValues({ ...formValues, url: e.target.value })} required placeholder="Contoh: /profil atau https://google.com" />
              
              <div className="space-y-1.5">
                <label htmlFor="location" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Lokasi</label>
                <select id="location" className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-750 focus:outline-none focus:border-brand-green-900 transition-colors" value={formValues.location} onChange={(e) => setFormValues({ ...formValues, location: e.target.value as any })} required>
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="parent_id" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Induk Menu (Opsional)</label>
                <select id="parent_id" className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-750 focus:outline-none focus:border-brand-green-900 transition-colors" value={formValues.parent_id || ''} onChange={(e) => setFormValues({ ...formValues, parent_id: e.target.value || null })}>
                  <option value="">-- Tanpa Induk --</option>
                  {menuItems.filter(i => !i.parent_id && i.id !== editingItem?.id).map(item => (
                    <option key={item.id} value={item.id}>{item.label} ({item.location})</option>
                  ))}
                </select>
              </div>

              <Input id="sort_order" label="Urutan" type="number" value={formValues.sort_order} onChange={(e) => setFormValues({ ...formValues, sort_order: Number(e.target.value) })} required />
              
              <div className="flex items-center gap-2.5 py-1">
                <input type="checkbox" id="is_active" checked={formValues.is_active} onChange={(e) => setFormValues({ ...formValues, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-brand-green-800 focus:ring-brand-green-800 cursor-pointer" />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-650 cursor-pointer">Aktifkan menu</label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isLoading} className="flex-1 bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold px-4 py-2 text-xs rounded-xl">
                  {editingItem ? 'Simpan' : 'Tambah'}
                </Button>
                {editingItem && (
                  <Button type="button" variant="outline" onClick={resetForm} className="text-xs font-semibold rounded-xl">Batal</Button>
                )}
              </div>
            </form>
          </Card>
        </div>
        
        {/* Lists Area */}
        <div className="lg:col-span-2 space-y-6">
          {error && <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">{error}</div>}

          {/* Kolom Menu Header */}
          <Card title="Menu Header" subtitle="Menu navigasi bagian atas website">
            {isLoading && menuItems.length === 0 ? (
              <p className="text-xs text-slate-400">Memuat menu...</p>
            ) : (
              <div className="space-y-3">
                {headerMenus.map(item => (
                  <div key={item.id} className="space-y-1.5">
                    <MenuItem item={item} />
                    {item.children && item.children.length > 0 && (
                      <div className="pl-4 border-l-2 border-slate-200/60 ml-5 space-y-1.5 py-1">
                        {item.children.map(child => (
                          <MenuItem key={child.id} item={child} isSub={true} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {headerMenus.length === 0 && !isLoading && <p className="text-xs text-slate-400 italic">Belum ada menu header.</p>}
              </div>
            )}
          </Card>

          {/* Kolom Menu Footer */}
          <Card title="Menu Footer" subtitle="Menu navigasi bagian bawah (kaki halaman) website">
            {isLoading && menuItems.length === 0 ? (
              <p className="text-xs text-slate-400">Memuat menu...</p>
            ) : (
              <div className="space-y-3">
                {footerMenus.map(item => (
                  <div key={item.id} className="space-y-1.5">
                    <MenuItem item={item} />
                    {item.children && item.children.length > 0 && (
                      <div className="pl-4 border-l-2 border-slate-200/60 ml-5 space-y-1.5 py-1">
                        {item.children.map(child => (
                          <MenuItem key={child.id} item={child} isSub={true} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {footerMenus.length === 0 && !isLoading && <p className="text-xs text-slate-400 italic">Belum ada menu footer.</p>}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
