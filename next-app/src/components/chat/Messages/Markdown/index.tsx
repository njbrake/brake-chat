'use client';

import { useMemo } from 'react';
import { marked } from 'marked';
import { replaceTokens, processResponseContent } from '@/lib/utils';
import { useAppStore } from '@/store';
import { MarkdownTokens } from './MarkdownTokens';

interface MarkdownProps {
  id?: string;
  content: string;
  done?: boolean;
  model?: { name?: string } | null;
  save?: boolean;
  preview?: boolean;
  editCodeBlock?: boolean;
  topPadding?: boolean;
  sourceIds?: string[];
  onSave?: (data: { raw: string; oldContent: string; newContent: string }) => void;
  onUpdate?: (token: unknown) => void;
  onPreview?: (code: string) => void;
  onSourceClick?: (params: unknown) => void;
  onTaskClick?: (params: unknown) => void;
}

export function Markdown({
  id = '',
  content,
  done = true,
  model = null,
  save = false,
  preview = false,
  editCodeBlock = true,
  topPadding = false,
  sourceIds = [],
  onSave,
  onUpdate,
  onPreview,
  onSourceClick,
  onTaskClick,
}: MarkdownProps) {
  const user = useAppStore((s) => s.user);

  const tokens = useMemo(() => {
    if (!content) return [];

    const processedContent = replaceTokens(
      processResponseContent(content),
      model?.name || null,
      user?.name || null
    );

    return marked.lexer(processedContent);
  }, [content, model?.name, user?.name]);

  return (
    <MarkdownTokens
      id={id}
      tokens={tokens}
      done={done}
      save={save}
      preview={preview}
      editCodeBlock={editCodeBlock}
      sourceIds={sourceIds}
      topPadding={topPadding}
      onTaskClick={onTaskClick}
      onSourceClick={onSourceClick}
      onSave={onSave}
      onUpdate={onUpdate}
      onPreview={onPreview}
    />
  );
}

export { MarkdownTokens } from './MarkdownTokens';
export { MarkdownInlineTokens } from './MarkdownInlineTokens';
export { KatexRenderer } from './KatexRenderer';
