import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import { X } from 'lucide-react';

interface MarkdownViewerProps {
  markdown: string;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  markdown,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Highlight any code blocks parsed in markdown
      Prism.highlightAllUnder(containerRef.current);

      // Attach click handlers to images for lightbox zoom
      const images = containerRef.current.querySelectorAll('img');
      images.forEach(img => {
        img.style.cursor = 'zoom-in';
        img.onclick = () => {
          setLightboxImg({
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || 'Image Preview',
          });
        };
      });
    }
  }, [markdown]);

  // Configure marked for GitHub flavored markdown
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const rawHtml = marked.parse(markdown || '') as string;
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'pre', 'code', 'em', 'strong', 'del', 'b', 'i',
      'a', 'img', 'span', 'div', 'input'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'type', 'checked', 'disabled', 'style', 'width', 'height'],
  });

  return (
    <>
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        className={`markdown-body text-slate-700 dark:text-slate-300 text-sm leading-relaxed ${className}`}
      />

      {/* Lightbox Modal for Image Inspection */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImg.src}
              alt={lightboxImg.alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            {lightboxImg.alt && (
              <p className="mt-2 text-xs text-slate-300 italic text-center">
                {lightboxImg.alt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
