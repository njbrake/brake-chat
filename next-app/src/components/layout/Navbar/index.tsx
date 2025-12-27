'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Tooltip } from '@/components/common/Tooltip';
import { Banner, BannerData } from '@/components/common/Banner';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/common/Dropdown';
import {
  Sidebar,
  ChatPlus,
  ChatCheck,
  ChatBubbleDotted,
  ChatBubbleDottedChecked,
  Knobs,
  EllipsisHorizontal,
  Share,
  ArchiveBox,
  FolderOpen,
  Download,
} from '@/components/icons';
import { useAppStore, useChatStore, useUIStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { UserMenu } from '../Sidebar/UserMenu';

interface NavbarProps {
  chat?: { id?: string; title?: string } | null;
  history?: { currentId?: string | null };
  selectedModels?: string[];
  showModelSelector?: boolean;
  shareEnabled?: boolean;
  scrollTop?: number;
  initNewChat: () => void;
  onSaveTempChat?: () => void;
  archiveChatHandler?: (id: string) => void;
  moveChatHandler?: (id: string, folderId: string) => void;
}

export function Navbar({
  chat,
  history = {},
  selectedModels = [],
  showModelSelector = true,
  shareEnabled = false,
  scrollTop = 0,
  initNewChat,
  onSaveTempChat,
  archiveChatHandler,
  moveChatHandler,
}: NavbarProps) {
  const router = useRouter();

  // Store state
  const user = useAppStore((s) => s.user);
  const mobile = useAppStore((s) => s.mobile);
  const config = useAppStore((s) => s.config);
  const banners = useAppStore((s) => s.banners);
  const settings = useAppStore((s) => s.settings);

  const showSidebar = useUIStore((s) => s.showSidebar);
  const setShowSidebar = useUIStore((s) => s.setShowSidebar);
  const showControls = useUIStore((s) => s.showControls);
  const setShowControls = useUIStore((s) => s.setShowControls);
  const setShowArchivedChats = useUIStore((s) => s.setShowArchivedChats);

  const chatId = useChatStore((s) => s.chatId);
  const temporaryChatEnabled = useChatStore((s) => s.temporaryChatEnabled);
  const setTemporaryChatEnabled = useChatStore((s) => s.setTemporaryChatEnabled);

  const [showShareChatModal, setShowShareChatModal] = useState(false);
  const [closedBannerIds, setClosedBannerIds] = useState<string[]>([]);

  const dismissedBannerIds = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('dismissedBannerIds') ?? '[]');
    } catch {
      return [];
    }
  }, []);

  const visibleBanners = useMemo(() => {
    return banners.filter(
      (b) => ![...dismissedBannerIds, ...closedBannerIds].includes(b.id)
    );
  }, [banners, dismissedBannerIds, closedBannerIds]);

  const handleTemporaryChatToggle = async () => {
    const isDefault = settings?.temporaryChatByDefault ?? false;

    if (isDefault && temporaryChatEnabled) {
      setTemporaryChatEnabled(false);
    } else {
      setTemporaryChatEnabled(!temporaryChatEnabled);
    }

    router.push('/');

    if (temporaryChatEnabled) {
      window.history.replaceState(null, '', '?temporary-chat=true');
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleDismissBanner = (bannerId: string, dismissible: boolean) => {
    if (dismissible) {
      const newDismissedIds = [
        bannerId,
        ...dismissedBannerIds,
      ].filter((id) => banners.find((b) => b.id === id));

      localStorage.setItem('dismissedBannerIds', JSON.stringify(newDismissedIds));
    } else {
      setClosedBannerIds((prev) => [...prev, bannerId]);
    }
  };

  const showBannerSection =
    !history.currentId &&
    !chatId &&
    (visibleBanners.length > 0 ||
      config?.license_metadata?.type === 'trial' ||
      (config?.license_metadata?.seats !== null &&
        (config?.user_count ?? 0) > (config?.license_metadata?.seats ?? 0)));

  const canAccessTemporaryChat =
    user?.role === 'user'
      ? (user?.permissions?.chat?.temporary ?? true) &&
        !(user?.permissions?.chat?.temporary_enforced ?? false)
      : true;

  return (
    <>
      <button
        id="new-chat-button"
        className="hidden"
        onClick={initNewChat}
        aria-label="New Chat"
      />

      <nav
        className={`sticky top-0 z-30 w-full ${
          chat?.id ? 'pt-0.5 pb-1' : 'pt-1 pb-1'
        } -mb-12 flex flex-col items-center drag-region`}
      >
        <div className="flex items-center w-full pl-1.5 pr-1">
          <div
            id="navbar-bg-gradient-to-b"
            className={`${
              chat?.id ? 'visible' : 'invisible'
            } bg-gradient-to-b via-40% to-97% from-white/90 via-white/50 to-transparent dark:from-gray-900/90 dark:via-gray-900/50 dark:to-transparent pointer-events-none absolute inset-0 -bottom-10 z-[-1]`}
          />

          <div className="flex max-w-full w-full mx-auto px-1.5 md:px-2 pt-0.5 bg-transparent">
            <div className="flex items-center w-full max-w-full">
              {/* Mobile sidebar toggle */}
              {mobile && !showSidebar && (
                <div className="-translate-x-0.5 mr-1 mt-1 self-start flex flex-none items-center text-gray-600 dark:text-gray-400">
                  <Tooltip content={showSidebar ? 'Close Sidebar' : 'Open Sidebar'}>
                    <button
                      className="cursor-pointer flex rounded-lg hover:bg-gray-100 dark:hover:bg-gray-850 transition"
                      onClick={() => setShowSidebar(!showSidebar)}
                    >
                      <div className="self-center p-1.5">
                        <Sidebar className="size-5" />
                      </div>
                    </button>
                  </Tooltip>
                </div>
              )}

              {/* Model selector area */}
              <div
                className={`flex-1 overflow-hidden max-w-full py-0.5 ${
                  showSidebar ? 'ml-1' : ''
                }`}
              >
                {showModelSelector && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {/* ModelSelector component would go here */}
                    {selectedModels.length > 0 && (
                      <span>{selectedModels.join(', ')}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Right side actions */}
              <div className="self-start flex flex-none items-center text-gray-600 dark:text-gray-400">
                {/* Temporary chat toggle */}
                {canAccessTemporaryChat && (
                  <>
                    {!chat?.id ? (
                      <Tooltip content="Temporary Chat">
                        <button
                          className="flex cursor-pointer px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition"
                          id="temporary-chat-button"
                          onClick={handleTemporaryChatToggle}
                        >
                          <div className="m-auto self-center">
                            {temporaryChatEnabled ? (
                              <ChatBubbleDottedChecked className="size-4.5" strokeWidth={1.5} />
                            ) : (
                              <ChatBubbleDotted className="size-4.5" strokeWidth={1.5} />
                            )}
                          </div>
                        </button>
                      </Tooltip>
                    ) : temporaryChatEnabled ? (
                      <Tooltip content="Save Chat">
                        <button
                          className="flex cursor-pointer px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition"
                          id="save-temporary-chat-button"
                          onClick={onSaveTempChat}
                        >
                          <div className="m-auto self-center">
                            <ChatCheck className="size-4.5" strokeWidth={1.5} />
                          </div>
                        </button>
                      </Tooltip>
                    ) : null}
                  </>
                )}

                {/* New chat button (mobile) */}
                {mobile && !temporaryChatEnabled && chat?.id && (
                  <Tooltip content="New Chat">
                    <button
                      className={`flex ${
                        showSidebar ? 'md:hidden' : ''
                      } cursor-pointer px-2 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850 transition`}
                      onClick={initNewChat}
                      aria-label="New Chat"
                    >
                      <div className="m-auto self-center">
                        <ChatPlus className="size-4.5" strokeWidth={1.5} />
                      </div>
                    </button>
                  </Tooltip>
                )}

                {/* Chat menu */}
                {shareEnabled && chat && (chat.id || temporaryChatEnabled) && (
                  <Dropdown
                    trigger={
                      <button
                        className="flex cursor-pointer px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition"
                        id="chat-context-menu-button"
                      >
                        <div className="m-auto self-center">
                          <EllipsisHorizontal className="size-5" strokeWidth={1.5} />
                        </div>
                      </button>
                    }
                    side="bottom"
                    align="end"
                  >
                    <DropdownItem onClick={() => setShowShareChatModal(true)}>
                      <Share className="size-4" />
                      <span>Share</span>
                    </DropdownItem>
                    <DropdownItem onClick={() => {}}>
                      <Download className="size-4" />
                      <span>Download</span>
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem onClick={() => {}}>
                      <FolderOpen className="size-4" />
                      <span>Move to Folder</span>
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => chat?.id && archiveChatHandler?.(chat.id)}
                    >
                      <ArchiveBox className="size-4" />
                      <span>Archive</span>
                    </DropdownItem>
                  </Dropdown>
                )}

                {/* Controls toggle */}
                {(user?.role === 'admin' || (user?.permissions?.chat?.controls ?? true)) && (
                  <Tooltip content="Controls">
                    <button
                      className="flex cursor-pointer px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition"
                      onClick={() => setShowControls(!showControls)}
                      aria-label="Controls"
                    >
                      <div className="m-auto self-center">
                        <Knobs className="size-5" strokeWidth={1} />
                      </div>
                    </button>
                  </Tooltip>
                )}

                {/* User menu */}
                {user && (
                  <UserMenu
                    className="max-w-[240px]"
                    role={user.role}
                    help={true}
                    onShow={(type) => {
                      if (type === 'archived-chat') {
                        setShowArchivedChats(true);
                      }
                    }}
                  >
                    <div className="select-none flex rounded-xl p-1.5 w-full hover:bg-gray-50 dark:hover:bg-gray-850 transition cursor-pointer">
                      <div className="self-center">
                        <span className="sr-only">User menu</span>
                        <img
                          src={`${WEBUI_API_BASE_URL}/users/${user.id}/profile/image`}
                          className="size-6 object-cover rounded-full"
                          alt=""
                          draggable={false}
                        />
                      </div>
                    </div>
                  </UserMenu>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Temporary chat indicator */}
        {temporaryChatEnabled && (chatId ?? '').startsWith('local:') && (
          <div className="w-full z-30 text-center">
            <div className="text-xs text-gray-500">Temporary Chat</div>
          </div>
        )}

        {/* Banners */}
        <div className="absolute top-[100%] left-0 right-0 h-fit">
          {showBannerSection && (
            <div className="w-full z-30">
              <div className="flex flex-col gap-1 w-full">
                {config?.license_metadata?.type === 'trial' && (
                  <Banner
                    banner={{
                      id: 'trial-license',
                      type: 'info',
                      title: 'Trial License',
                      content:
                        'You are currently using a trial license. Please contact support to upgrade your license.',
                    }}
                  />
                )}

                {config?.license_metadata?.seats !== null &&
                  (config?.user_count ?? 0) > (config?.license_metadata?.seats ?? 0) && (
                    <Banner
                      banner={{
                        id: 'license-error',
                        type: 'error',
                        title: 'License Error',
                        content:
                          'Exceeded the number of seats in your license. Please contact support to increase the number of seats.',
                      }}
                    />
                  )}

                {visibleBanners.map((banner) => (
                  <Banner
                    key={banner.id}
                    banner={banner}
                    onDismiss={() =>
                      handleDismissBanner(banner.id, banner.dismissible ?? false)
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
