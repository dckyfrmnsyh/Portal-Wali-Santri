import React from 'react';

interface ImageBlockProps {
  url: string;
  alt: string;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({ url, alt }) => {
  return (
    <figure>
      <img src={url} alt={alt} className="w-full h-auto rounded-lg" />
    </figure>
  );
};
