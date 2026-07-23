import React from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ImageIcon } from 'lucide-react';

interface ImageBlockEditorProps {
  url: string;
  alt: string;
  onUrlChange: (newUrl: string) => void;
  onAltChange: (newAlt: string) => void;
  onSelectImage: () => void;
}

export const ImageBlockEditor: React.FC<ImageBlockEditorProps> = ({ url, alt, onUrlChange, onAltChange, onSelectImage }) => {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
      <label className="text-xs font-bold text-slate-500 uppercase">Blok Gambar</label>
      
      <div className="flex gap-2">
        <Input
          id={`img-url-${url}`}
          label="URL Gambar"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="Pilih dari pustaka media..."
        />
        <Button onClick={onSelectImage} variant="outline" className="mt-5 shrink-0">
          <ImageIcon className="h-4 w-4 mr-2" />
          Pilih Media
        </Button>
      </div>

      <Input
        id={`img-alt-${alt}`}
        label="Teks Alternatif (Alt Text)"
        value={alt}
        onChange={(e) => onAltChange(e.target.value)}
        placeholder="Deskripsi singkat gambar untuk SEO & aksesibilitas"
      />

      {url && <img src={url} alt={alt || 'Preview'} className="mt-2 rounded-md max-h-40 object-contain" />}
    </div>
  );
};
