'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { ChevronLeft, ChevronRight, Pencil, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { copyToClipboard } from '@/lib/utils';
import { Markdown } from './Markdown';
import { ProfileImage } from './ProfileImage';
import { Name } from './Name';
import { Tooltip } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Image } from '@/components/common/Image';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

interface HistoryMessage {
  id: string;
  role: string;
  content: string;
  parentId: string | null;
  childrenIds: string[];
  files?: { type: string; url: string; name?: string; size?: number }[];
  timestamp?: number;
  user?: string;
}

interface History {
  messages: Record<string, HistoryMessage>;
  currentId: string | null;
}

interface UserMessageProps {
  user: { id: string; name: string; role?: string };
  chatId: string;
  history: History;
  messageId: string;
  siblings: string[];
  gotoMessage: (message: HistoryMessage, idx: number) => void;
  showPreviousMessage: (message: HistoryMessage) => void;
  showNextMessage: (message: HistoryMessage) => void;
  editMessage: (
    messageId: string,
    data: { content: string; files?: unknown[] },
    submit?: boolean
  ) => void;
  deleteMessage: (messageId: string) => void;
  isFirstMessage?: boolean;
  readOnly?: boolean;
  editCodeBlock?: boolean;
  topPadding?: boolean;
}

export function UserMessage({
  user,
  chatId,
  history,
  messageId,
  siblings,
  gotoMessage,
  showPreviousMessage,
  showNextMessage,
  editMessage,
  deleteMessage,
  isFirstMessage = false,
  readOnly = false,
  editCodeBlock = true,
  topPadding = false,
}: UserMessageProps) {
  const settings = useAppStore((s) => s.settings);
  const currentUser = useAppStore((s) => s.user);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageIndexEdit, setMessageIndexEdit] = useState(false);
  const [edit, setEdit] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedFiles, setEditedFiles] = useState<{ type: string; url: string; name?: string }[]>(
    []
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const message = history.messages[messageId];

  useEffect(() => {
    if (edit && textareaRef.current) {
      textareaRef.current.style.height = '';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [edit]);

  const handleCopyToClipboard = useCallback(async (text: string) => {
    const res = await copyToClipboard(text);
    if (res) {
      toast.success('Copied to clipboard');
    }
  }, []);

  const handleEditMessage = useCallback(() => {
    setEdit(true);
    setEditedContent(message?.content ?? '');
    setEditedFiles(message?.files ?? []);
  }, [message]);

  const handleEditConfirm = useCallback(
    (submit = true) => {
      if (!editedContent && (editedFiles ?? []).length === 0) {
        toast.error('Please enter a message or attach a file.');
        return;
      }

      editMessage(message.id, { content: editedContent, files: editedFiles }, submit);
      setEdit(false);
      setEditedContent('');
      setEditedFiles([]);
    },
    [editedContent, editedFiles, message?.id, editMessage]
  );

  const cancelEdit = useCallback(() => {
    setEdit(false);
    setEditedContent('');
    setEditedFiles([]);
  }, []);

  const chatBubble = settings?.chatBubble ?? true;
  const highContrastMode = settings?.highContrastMode ?? false;
  const siblingIndex = siblings.indexOf(message?.id);

  if (!message) return null;

  return (
    <>
      <ConfirmDialog
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete message?"
        onConfirm={() => deleteMessage(message.id)}
      />

      <div
        className="flex w-full user-message group"
        dir={settings?.chatDirection}
        id={`message-${message.id}`}
      >
        {!chatBubble && (
          <div className="shrink-0 ltr:mr-3 rtl:ml-3 mt-1">
            <ProfileImage
              src={`${WEBUI_API_BASE_URL}/users/${user.id}/profile/image`}
              className="size-8 user-message-profile-image"
            />
          </div>
        )}

        <div className="flex-auto w-0 max-w-full pl-1">
          {!chatBubble ? (
            <div>
              <Name>
                {message.user ? (
                  <>
                    You
                    <span className="text-gray-500 text-sm font-medium">{message.user}</span>
                  </>
                ) : settings?.showUsername || currentUser?.name !== user.name ? (
                  user.name
                ) : (
                  'You'
                )}

                {message.timestamp && (
                  <div
                    className={`self-center text-xs font-medium first-letter:capitalize ml-0.5 translate-y-[1px] ${
                      highContrastMode
                        ? 'dark:text-gray-900 text-gray-100'
                        : 'invisible group-hover:visible transition'
                    }`}
                  >
                    <Tooltip content={dayjs(message.timestamp * 1000).format('LLLL')}>
                      <span className="line-clamp-1">
                        {dayjs(message.timestamp * 1000).fromNow()}
                      </span>
                    </Tooltip>
                  </div>
                )}
              </Name>
            </div>
          ) : (
            message.timestamp && (
              <div className="flex justify-end pr-2 text-xs">
                <div
                  className={`text-[0.65rem] font-medium first-letter:capitalize mb-0.5 ${
                    highContrastMode
                      ? 'dark:text-gray-100 text-gray-900'
                      : 'invisible group-hover:visible transition text-gray-400'
                  }`}
                >
                  <Tooltip content={dayjs(message.timestamp * 1000).format('LLLL')}>
                    <span className="line-clamp-1">
                      {dayjs(message.timestamp * 1000).fromNow()}
                    </span>
                  </Tooltip>
                </div>
              </div>
            )
          )}

          <div className={`chat-${message.role} w-full min-w-full markdown-prose`}>
            {!edit && message.files && (
              <div className="mb-1 w-full flex flex-col justify-end overflow-x-auto gap-1 flex-wrap">
                {message.files.map((file, idx) => (
                  <div key={idx} className={chatBubble ? 'self-end' : ''}>
                    {file.type === 'image' ? (
                      <Image src={file.url} imageClassName="max-h-96 rounded-lg" />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm">{file.name || 'File'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {edit ? (
              <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-3xl px-5 py-3 mb-2">
                {(editedFiles ?? []).length > 0 && (
                  <div className="flex items-center flex-wrap gap-2 -mx-2 mb-1">
                    {editedFiles.map((file, fileIdx) => (
                      <div key={fileIdx} className="relative group">
                        {file.type === 'image' ? (
                          <div className="relative flex items-center">
                            <Image
                              src={file.url}
                              alt="input"
                              imageClassName="size-14 rounded-xl object-cover"
                            />
                            <button
                              className="absolute -top-1 -right-1 bg-white text-black border border-white rounded-full"
                              type="button"
                              onClick={() => {
                                const newFiles = [...editedFiles];
                                newFiles.splice(fileIdx, 1);
                                setEditedFiles(newFiles);
                              }}
                            >
                              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <span className="text-sm">{file.name || 'File'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="max-h-96 overflow-auto">
                  <textarea
                    ref={textareaRef}
                    className="bg-transparent outline-none w-full resize-none"
                    value={editedContent}
                    onChange={(e) => {
                      setEditedContent(e.target.value);
                      e.target.style.height = '';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        cancelEdit();
                      }
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        handleEditConfirm();
                      }
                    }}
                  />
                </div>

                <div className="mt-2 mb-1 flex justify-between text-sm font-medium">
                  <div>
                    <button
                      className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 transition rounded-3xl"
                      onClick={() => handleEditConfirm(false)}
                    >
                      Save
                    </button>
                  </div>

                  <div className="flex space-x-1.5">
                    <button
                      className="px-3.5 py-1.5 bg-white dark:bg-gray-900 hover:bg-gray-100 text-gray-800 dark:text-gray-100 transition rounded-3xl"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>

                    <button
                      className="px-3.5 py-1.5 bg-gray-900 dark:bg-white hover:bg-gray-850 text-gray-100 dark:text-gray-800 transition rounded-3xl"
                      onClick={() => handleEditConfirm(true)}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : message.content !== '' ? (
              <div className="w-full">
                <div className={`flex ${chatBubble ? 'justify-end pb-1' : 'w-full'}`}>
                  <div
                    className={`rounded-3xl ${
                      chatBubble
                        ? `max-w-[90%] px-4 py-1.5 bg-gray-50 dark:bg-gray-850 ${message.files ? 'rounded-tr-lg' : ''}`
                        : 'w-full'
                    }`}
                  >
                    {message.content && (
                      <Markdown
                        id={`${chatId}-${message.id}`}
                        content={message.content}
                        editCodeBlock={editCodeBlock}
                        topPadding={topPadding}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {!edit && (
              <div
                className={`flex ${chatBubble ? 'justify-end' : ''} text-gray-600 dark:text-gray-500`}
              >
                {!chatBubble && siblings.length > 1 && (
                  <div className="flex self-center" dir="ltr">
                    <button
                      className="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition"
                      onClick={() => showPreviousMessage(message)}
                    >
                      <ChevronLeft className="size-3.5" strokeWidth={2.5} />
                    </button>

                    {messageIndexEdit ? (
                      <div className="text-sm flex justify-center font-semibold self-center dark:text-gray-100 min-w-fit">
                        <input
                          type="number"
                          value={siblingIndex + 1}
                          min={1}
                          max={siblings.length}
                          className="bg-transparent font-semibold self-center dark:text-gray-100 min-w-fit outline-none w-8 text-center"
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => {
                            gotoMessage(message, Number(e.target.value) - 1);
                            setMessageIndexEdit(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              gotoMessage(message, Number((e.target as HTMLInputElement).value) - 1);
                              setMessageIndexEdit(false);
                            }
                          }}
                        />
                        /{siblings.length}
                      </div>
                    ) : (
                      <div
                        className="text-sm tracking-widest font-semibold self-center dark:text-gray-100 min-w-fit cursor-pointer"
                        onDoubleClick={() => setMessageIndexEdit(true)}
                      >
                        {siblingIndex + 1}/{siblings.length}
                      </div>
                    )}

                    <button
                      className="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition"
                      onClick={() => showNextMessage(message)}
                    >
                      <ChevronRight className="size-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                )}

                {!readOnly && (
                  <Tooltip content="Edit" side="bottom">
                    <button
                      className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:hover:text-white hover:text-black transition`}
                      onClick={handleEditMessage}
                    >
                      <Pencil className="size-4" strokeWidth={2.3} />
                    </button>
                  </Tooltip>
                )}

                {message.content && (
                  <Tooltip content="Copy" side="bottom">
                    <button
                      className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:hover:text-white hover:text-black transition`}
                      onClick={() => handleCopyToClipboard(message.content)}
                    >
                      <Copy className="size-4" strokeWidth={2.3} />
                    </button>
                  </Tooltip>
                )}

                {(currentUser?.role === 'admin' ||
                  !!(currentUser?.permissions?.chat as Record<string, unknown>)?.delete_message) &&
                  !readOnly &&
                  (!isFirstMessage || siblings.length > 1) && (
                    <Tooltip content="Delete" side="bottom">
                      <button
                        className={`${highContrastMode ? '' : 'invisible group-hover:visible'} p-1 rounded-sm dark:hover:text-white hover:text-black transition`}
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="size-4" strokeWidth={2} />
                      </button>
                    </Tooltip>
                  )}

                {chatBubble && siblings.length > 1 && (
                  <div className="flex self-center" dir="ltr">
                    <button
                      className="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition"
                      onClick={() => showPreviousMessage(message)}
                    >
                      <ChevronLeft className="size-3.5" strokeWidth={2.5} />
                    </button>

                    <div className="text-sm tracking-widest font-semibold self-center dark:text-gray-100 min-w-fit">
                      {siblingIndex + 1}/{siblings.length}
                    </div>

                    <button
                      className="self-center p-1 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:text-white hover:text-black rounded-md transition"
                      onClick={() => showNextMessage(message)}
                    >
                      <ChevronRight className="size-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
