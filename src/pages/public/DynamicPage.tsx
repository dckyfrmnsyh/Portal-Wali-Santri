import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TextBlock } from '../../components/page-builder/renderer/TextBlock';
import { ImageBlock } from '../../components/page-builder/renderer/ImageBlock';
import { PublicLayout } from '../../components/layout/PublicLayout';

interface DynamicPageProps {
  slug: string;
}

type ContentBlock = 
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'image'; url: string; alt: string };

interface PageData {
  title: string;
  sections: ContentBlock[];
}

export const DynamicPage: React.FC<DynamicPageProps> = ({ slug }) => {
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('title, sections')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        setError('Halaman tidak ditemukan atau terjadi kesalahan.');
        console.error(error);
      } else {
        setPage(data);
      }
      setIsLoading(false);
    };

    fetchPage();
  }, [slug]);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        {isLoading && <p>Memuat halaman...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {page && (
          <article>
            <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
            <div className="space-y-4">
              {page.sections.map(block => {
                switch (block.type) {
                  case 'text':
                    return <TextBlock key={block.id} content={block.content} />;
                  case 'image':
                    return <ImageBlock key={block.id} url={block.url} alt={block.alt} />;
                  default:
                    return null;
                }
              })}
            </div>
          </article>
        )}
      </div>
    </PublicLayout>
  );
};
