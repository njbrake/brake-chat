'use client';

import { decode } from 'html-entities';
import { marked, type Token } from 'marked';
import { copyToClipboard, unescapeHtml } from '@/lib/utils';
import { WEBUI_BASE_URL } from '@/lib/constants';
import { useAppStore } from '@/store';
import { CodeBlock } from '../CodeBlock';
import { MarkdownInlineTokens } from './MarkdownInlineTokens';
import { KatexRenderer } from './KatexRenderer';
import { Collapsible } from '@/components/common/Collapsible';
import { Tooltip } from '@/components/common/Tooltip';
import { Clipboard, Download } from 'lucide-react';

interface SaveEventData {
  raw: string;
  oldContent: string;
  newContent: string;
}

interface TaskClickEventData {
  id: string;
  token: Token;
  tokenIdx: number;
  item: ListItem;
  itemIdx: number;
  checked: boolean;
}

interface ListItem {
  task?: boolean;
  checked?: boolean;
  tokens?: Token[];
}

type ExtendedToken = Token & {
  depth?: number;
  text?: string;
  tokens?: Token[];
  header?: { text: string; tokens: Token[] }[];
  rows?: { tokens: Token[] }[][];
  align?: (string | null)[];
  items?: ListItem[];
  ordered?: boolean;
  start?: number;
  summary?: string;
  attributes?: Record<string, unknown>;
  fileId?: string;
  displayMode?: boolean;
  lang?: string;
  raw?: string;
  loose?: boolean;
};

interface MarkdownTokensProps {
  id: string;
  tokens: Token[];
  top?: boolean;
  attributes?: Record<string, unknown>;
  sourceIds?: string[];
  done?: boolean;
  save?: boolean;
  preview?: boolean;
  editCodeBlock?: boolean;
  topPadding?: boolean;
  onSave?: (data: SaveEventData) => void;
  onUpdate?: (token: unknown) => void;
  onPreview?: (code: string) => void;
  onTaskClick?: (data: TaskClickEventData) => void;
  onSourceClick?: (params: unknown) => void;
}

export function MarkdownTokens({
  id,
  tokens,
  top = true,
  sourceIds = [],
  done = true,
  save = false,
  preview = false,
  editCodeBlock = true,
  topPadding = false,
  onSave,
  onUpdate,
  onPreview,
  onTaskClick,
  onSourceClick,
}: MarkdownTokensProps) {
  const settings = useAppStore((s) => s.settings);

  const exportTableToCSV = (token: ExtendedToken, tokenIdx: number) => {
    const header =
      token.header?.map((headerCell) => `"${headerCell.text.replace(/"/g, '""')}"`) || [];
    const rows =
      token.rows?.map((row) =>
        row.map((cell) => {
          const cellContent = (cell.tokens as ExtendedToken[])
            .map((t) => t.text || '')
            .join('');
          return `"${cellContent.replace(/"/g, '""')}"`;
        })
      ) || [];

    const csvData = [header, ...rows];
    const csvContent = csvData.map((row) => row.join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=UTF-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-${id}-${tokenIdx}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const HeaderComponent = ({ depth, children }: { depth: number; children: React.ReactNode }) => {
    switch (depth) {
      case 1:
        return <h1 dir="auto">{children}</h1>;
      case 2:
        return <h2 dir="auto">{children}</h2>;
      case 3:
        return <h3 dir="auto">{children}</h3>;
      case 4:
        return <h4 dir="auto">{children}</h4>;
      case 5:
        return <h5 dir="auto">{children}</h5>;
      default:
        return <h6 dir="auto">{children}</h6>;
    }
  };

  const renderToken = (token: ExtendedToken, tokenIdx: number) => {
    const key = `${id}-${tokenIdx}`;

    switch (token.type) {
      case 'hr':
        return <hr key={key} className="border-gray-100 dark:border-gray-850" />;

      case 'heading':
        return (
          <HeaderComponent key={key} depth={token.depth || 1}>
            <MarkdownInlineTokens
              id={`${id}-${tokenIdx}-h`}
              tokens={token.tokens || []}
              done={done}
              sourceIds={sourceIds}
              onSourceClick={onSourceClick}
            />
          </HeaderComponent>
        );

      case 'code':
        if ((token.raw || '').includes('```')) {
          return (
            <CodeBlock
              key={key}
              id={`${id}-${tokenIdx}`}
              collapsed={settings?.collapseCodeBlocks ?? false}
              token={token}
              lang={token.lang || ''}
              code={token.text || ''}
              save={save}
              preview={preview}
              edit={editCodeBlock}
              stickyButtonsClassName={topPadding ? 'top-10' : 'top-0'}
              onSave={(value) => {
                onSave?.({
                  raw: token.raw || '',
                  oldContent: token.text || '',
                  newContent: value,
                });
              }}
              onUpdate={onUpdate}
              onPreview={onPreview}
            />
          );
        }
        return <span key={key}>{token.text}</span>;

      case 'table':
        return (
          <div key={key} className="relative w-full group mb-2">
            <div className="scrollbar-hidden relative overflow-x-auto max-w-full">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 max-w-full rounded-xl">
                <thead className="text-xs text-gray-700 uppercase bg-white dark:bg-gray-900 dark:text-gray-400 border-none">
                  <tr>
                    {token.header?.map((header, headerIdx) => (
                      <th
                        key={headerIdx}
                        scope="col"
                        className="px-2.5! py-2! cursor-pointer border-b border-gray-100! dark:border-gray-800!"
                        style={
                          token.align?.[headerIdx]
                            ? { textAlign: token.align[headerIdx] as 'left' | 'center' | 'right' }
                            : undefined
                        }
                      >
                        <div className="gap-1.5 text-left">
                          <div className="shrink-0 break-normal">
                            <MarkdownInlineTokens
                              id={`${id}-${tokenIdx}-header-${headerIdx}`}
                              tokens={header.tokens}
                              done={done}
                              sourceIds={sourceIds}
                              onSourceClick={onSourceClick}
                            />
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {token.rows?.map((row, rowIdx) => (
                    <tr key={rowIdx} className="bg-white dark:bg-gray-900 text-xs">
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className={`px-3! py-2! text-gray-900 dark:text-white w-max ${
                            (token.rows?.length || 0) - 1 === rowIdx
                              ? ''
                              : 'border-b border-gray-50! dark:border-gray-850!'
                          }`}
                          style={
                            token.align?.[cellIdx]
                              ? { textAlign: token.align[cellIdx] as 'left' | 'center' | 'right' }
                              : undefined
                          }
                        >
                          <div className="break-normal">
                            <MarkdownInlineTokens
                              id={`${id}-${tokenIdx}-row-${rowIdx}-${cellIdx}`}
                              tokens={cell.tokens}
                              done={done}
                              sourceIds={sourceIds}
                              onSourceClick={onSourceClick}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="absolute top-1 right-1.5 z-20 invisible group-hover:visible flex gap-0.5">
              <Tooltip content="Copy">
                <button
                  className="p-1 rounded-lg bg-transparent transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(
                      (token.raw || '').trim(),
                      null,
                      settings?.copyFormatted ?? false
                    );
                  }}
                >
                  <Clipboard className="size-3.5" strokeWidth={1.5} />
                </button>
              </Tooltip>

              <Tooltip content="Export to CSV">
                <button
                  className="p-1 rounded-lg bg-transparent transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportTableToCSV(token, tokenIdx);
                  }}
                >
                  <Download className="size-3.5" strokeWidth={1.5} />
                </button>
              </Tooltip>
            </div>
          </div>
        );

      case 'blockquote':
        return (
          <blockquote key={key} dir="auto">
            <MarkdownTokens
              id={`${id}-${tokenIdx}`}
              tokens={token.tokens || []}
              done={done}
              editCodeBlock={editCodeBlock}
              onTaskClick={onTaskClick}
              sourceIds={sourceIds}
              onSourceClick={onSourceClick}
            />
          </blockquote>
        );

      case 'list':
        if (token.ordered) {
          return (
            <ol key={key} start={token.start || 1} dir="auto">
              {token.items?.map((item, itemIdx) => (
                <li key={itemIdx} className="text-start">
                  {item.task && (
                    <input
                      className="translate-y-[1px] -translate-x-1"
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => {
                        onTaskClick?.({
                          id,
                          token,
                          tokenIdx,
                          item,
                          itemIdx,
                          checked: e.target.checked,
                        });
                      }}
                    />
                  )}
                  <MarkdownTokens
                    id={`${id}-${tokenIdx}-${itemIdx}`}
                    tokens={item.tokens || []}
                    top={token.loose}
                    done={done}
                    editCodeBlock={editCodeBlock}
                    onTaskClick={onTaskClick}
                    sourceIds={sourceIds}
                    onSourceClick={onSourceClick}
                  />
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={key} dir="auto">
            {token.items?.map((item, itemIdx) => (
              <li
                key={itemIdx}
                className={`text-start ${item.task ? 'flex -translate-x-6.5 gap-3' : ''}`}
              >
                {item.task ? (
                  <>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => {
                        onTaskClick?.({
                          id,
                          token,
                          tokenIdx,
                          item,
                          itemIdx,
                          checked: e.target.checked,
                        });
                      }}
                    />
                    <div>
                      <MarkdownTokens
                        id={`${id}-${tokenIdx}-${itemIdx}`}
                        tokens={item.tokens || []}
                        top={token.loose}
                        done={done}
                        editCodeBlock={editCodeBlock}
                        onTaskClick={onTaskClick}
                        sourceIds={sourceIds}
                        onSourceClick={onSourceClick}
                      />
                    </div>
                  </>
                ) : (
                  <MarkdownTokens
                    id={`${id}-${tokenIdx}-${itemIdx}`}
                    tokens={item.tokens || []}
                    top={token.loose}
                    done={done}
                    editCodeBlock={editCodeBlock}
                    onTaskClick={onTaskClick}
                    sourceIds={sourceIds}
                    onSourceClick={onSourceClick}
                  />
                )}
              </li>
            ))}
          </ul>
        );

      case 'details':
        return (
          <Collapsible
            key={key}
            title={token.summary}
            defaultOpen={settings?.expandDetails ?? false}
            className="w-full space-y-1"
          >
            <div className="mb-1.5">
              <MarkdownTokens
                id={`${id}-${tokenIdx}-d`}
                tokens={marked.lexer(decode(token.text || ''))}
                done={done}
                editCodeBlock={editCodeBlock}
                onTaskClick={onTaskClick}
                sourceIds={sourceIds}
                onSourceClick={onSourceClick}
              />
            </div>
          </Collapsible>
        );

      case 'iframe':
        return (
          <iframe
            key={key}
            src={`${WEBUI_BASE_URL}/api/v1/files/${token.fileId}/content`}
            title={token.fileId}
            width="100%"
            frameBorder="0"
            onLoad={(e) => {
              try {
                const iframe = e.currentTarget;
                if (iframe.contentWindow) {
                  iframe.style.height =
                    iframe.contentWindow.document.body.scrollHeight + 20 + 'px';
                }
              } catch {
                // Ignore cross-origin errors
              }
            }}
          />
        );

      case 'paragraph':
        return (
          <p key={key} dir="auto">
            <MarkdownInlineTokens
              id={`${id}-${tokenIdx}-p`}
              tokens={token.tokens || []}
              done={done}
              sourceIds={sourceIds}
              onSourceClick={onSourceClick}
            />
          </p>
        );

      case 'text':
        if (top) {
          return (
            <p key={key}>
              {token.tokens ? (
                <MarkdownInlineTokens
                  id={`${id}-${tokenIdx}-t`}
                  tokens={token.tokens}
                  done={done}
                  sourceIds={sourceIds}
                  onSourceClick={onSourceClick}
                />
              ) : (
                unescapeHtml(token.text || '')
              )}
            </p>
          );
        }
        if (token.tokens) {
          return (
            <MarkdownInlineTokens
              key={key}
              id={`${id}-${tokenIdx}-p`}
              tokens={token.tokens}
              done={done}
              sourceIds={sourceIds}
              onSourceClick={onSourceClick}
            />
          );
        }
        return <span key={key}>{unescapeHtml(token.text || '')}</span>;

      case 'inlineKatex':
      case 'blockKatex':
        return token.text ? (
          <KatexRenderer key={key} content={token.text} displayMode={token.displayMode ?? false} />
        ) : null;

      case 'space':
        return <div key={key} className="my-2" />;

      default:
        return null;
    }
  };

  return <>{tokens.map((token, idx) => renderToken(token as ExtendedToken, idx))}</>;
}
