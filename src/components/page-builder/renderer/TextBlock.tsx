import React from 'react';

interface TextBlockProps {
  content: string;
}

export const TextBlock: React.FC<TextBlockProps> = ({ content }) => {
  return (
    <div className="prose max-w-none">
      <p>{content}</p>
    </div>
  );
};
