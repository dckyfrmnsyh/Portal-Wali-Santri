import React from 'react';

interface TextBlockEditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

export const TextBlockEditor: React.FC<TextBlockEditorProps> = ({ content, onChange }) => {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
      <label className="text-xs font-bold text-slate-500 uppercase">Blok Teks</label>
      <textarea
        className="w-full p-2 mt-2 text-sm bg-white border border-slate-300 rounded-md"
        rows={5}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tulis konten teks di sini..."
      />
    </div>
  );
};
