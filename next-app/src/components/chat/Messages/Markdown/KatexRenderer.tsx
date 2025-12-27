'use client';

import { useEffect, useState } from 'react';
import type { renderToString as katexRenderToString } from 'katex';

interface KatexRendererProps {
  content: string;
  displayMode?: boolean;
}

export function KatexRenderer({ content, displayMode = false }: KatexRendererProps) {
  const [renderToString, setRenderToString] = useState<typeof katexRenderToString | null>(null);
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    const loadKatex = async () => {
      const [katex] = await Promise.all([
        import('katex'),
        import('katex/contrib/mhchem'),
      ]);
      await import('katex/dist/katex.min.css');
      setRenderToString(() => katex.renderToString);
    };
    loadKatex();
  }, []);

  useEffect(() => {
    if (renderToString && content) {
      try {
        const rendered = renderToString(content, { displayMode, throwOnError: false });
        setHtml(rendered);
      } catch {
        setHtml(content);
      }
    }
  }, [renderToString, content, displayMode]);

  if (!html) return null;

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
