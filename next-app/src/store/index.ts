import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
	Config,
	SessionUser,
	Settings,
	Model,
	Prompt,
	Document,
	Chat,
	Tag,
	Folder,
	Channel,
	Banner,
	Tool
} from '@/types';
import type { Socket } from 'socket.io-client';
import { APP_NAME } from '@/lib/constants';

// App Store - Core app state
interface AppState {
	// Backend
	WEBUI_NAME: string;
	setWEBUI_NAME: (name: string) => void;
	WEBUI_VERSION: string | null;
	setWEBUI_VERSION: (version: string | null) => void;
	WEBUI_DEPLOYMENT_ID: string | null;
	setWEBUI_DEPLOYMENT_ID: (id: string | null) => void;

	// Config & User
	config: Config | undefined;
	setConfig: (config: Config | undefined) => void;
	user: SessionUser | undefined;
	setUser: (user: SessionUser | undefined) => void;

	// Electron App
	isApp: boolean;
	setIsApp: (isApp: boolean) => void;
	appInfo: unknown;
	setAppInfo: (appInfo: unknown) => void;
	appData: unknown;
	setAppData: (appData: unknown) => void;

	// Theme
	theme: string;
	setTheme: (theme: string) => void;

	// Settings
	settings: Settings;
	setSettings: (settings: Settings) => void;

	// Banners
	banners: Banner[];
	setBanners: (banners: Banner[]) => void;

	// Mobile
	mobile: boolean;
	setMobile: (mobile: boolean) => void;
}

export const useAppStore = create<AppState>()(
	devtools(
		(set) => ({
			WEBUI_NAME: APP_NAME,
			setWEBUI_NAME: (name) => set({ WEBUI_NAME: name }),
			WEBUI_VERSION: null,
			setWEBUI_VERSION: (version) => set({ WEBUI_VERSION: version }),
			WEBUI_DEPLOYMENT_ID: null,
			setWEBUI_DEPLOYMENT_ID: (id) => set({ WEBUI_DEPLOYMENT_ID: id }),

			config: undefined,
			setConfig: (config) => set({ config }),
			user: undefined,
			setUser: (user) => set({ user }),

			isApp: false,
			setIsApp: (isApp) => set({ isApp }),
			appInfo: null,
			setAppInfo: (appInfo) => set({ appInfo }),
			appData: null,
			setAppData: (appData) => set({ appData }),

			theme: 'system',
			setTheme: (theme) => set({ theme }),

			settings: {},
			setSettings: (settings) => set({ settings }),

			banners: [],
			setBanners: (banners) => set({ banners }),

			mobile: false,
			setMobile: (mobile) => set({ mobile })
		}),
		{ name: 'app-store' }
	)
);

// UI Store - UI state
interface UIState {
	showSidebar: boolean;
	toggleSidebar: () => void;
	setShowSidebar: (show: boolean) => void;

	showSearch: boolean;
	setShowSearch: (show: boolean) => void;

	showSettings: boolean;
	setShowSettings: (show: boolean) => void;

	showShortcuts: boolean;
	setShowShortcuts: (show: boolean) => void;

	showArchivedChats: boolean;
	setShowArchivedChats: (show: boolean) => void;

	showControls: boolean;
	setShowControls: (show: boolean) => void;

	showEmbeds: boolean;
	setShowEmbeds: (show: boolean) => void;

	showOverview: boolean;
	setShowOverview: (show: boolean) => void;

	showArtifacts: boolean;
	setShowArtifacts: (show: boolean) => void;

	showCallOverlay: boolean;
	setShowCallOverlay: (show: boolean) => void;

	artifactCode: string | null;
	setArtifactCode: (code: string | null) => void;

	artifactContents: unknown;
	setArtifactContents: (contents: unknown) => void;

	embed: unknown;
	setEmbed: (embed: unknown) => void;
}

export const useUIStore = create<UIState>()(
	devtools(
		(set) => ({
			showSidebar: false,
			toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
			setShowSidebar: (show) => set({ showSidebar: show }),

			showSearch: false,
			setShowSearch: (show) => set({ showSearch: show }),

			showSettings: false,
			setShowSettings: (show) => set({ showSettings: show }),

			showShortcuts: false,
			setShowShortcuts: (show) => set({ showShortcuts: show }),

			showArchivedChats: false,
			setShowArchivedChats: (show) => set({ showArchivedChats: show }),

			showControls: false,
			setShowControls: (show) => set({ showControls: show }),

			showEmbeds: false,
			setShowEmbeds: (show) => set({ showEmbeds: show }),

			showOverview: false,
			setShowOverview: (show) => set({ showOverview: show }),

			showArtifacts: false,
			setShowArtifacts: (show) => set({ showArtifacts: show }),

			showCallOverlay: false,
			setShowCallOverlay: (show) => set({ showCallOverlay: show }),

			artifactCode: null,
			setArtifactCode: (code) => set({ artifactCode: code }),

			artifactContents: null,
			setArtifactContents: (contents) => set({ artifactContents: contents }),

			embed: null,
			setEmbed: (embed) => set({ embed })
		}),
		{ name: 'ui-store' }
	)
);

// Chat Store - Chat-related state
interface ChatState {
	chatId: string;
	setChatId: (id: string) => void;

	chatTitle: string;
	setChatTitle: (title: string) => void;

	chats: Chat[] | null;
	setChats: (chats: Chat[] | null) => void;

	pinnedChats: Chat[];
	setPinnedChats: (chats: Chat[]) => void;

	channels: Channel[];
	setChannels: (channels: Channel[]) => void;

	tags: Tag[];
	setTags: (tags: Tag[]) => void;

	folders: Folder[];
	setFolders: (folders: Folder[]) => void;

	selectedFolder: string | null;
	setSelectedFolder: (folder: string | null) => void;

	temporaryChatEnabled: boolean;
	setTemporaryChatEnabled: (enabled: boolean) => void;

	scrollPaginationEnabled: boolean;
	setScrollPaginationEnabled: (enabled: boolean) => void;

	currentChatPage: number;
	setCurrentChatPage: (page: number) => void;
}

export const useChatStore = create<ChatState>()(
	devtools(
		(set) => ({
			chatId: '',
			setChatId: (id) => set({ chatId: id }),

			chatTitle: '',
			setChatTitle: (title) => set({ chatTitle: title }),

			chats: null,
			setChats: (chats) => set({ chats }),

			pinnedChats: [],
			setPinnedChats: (chats) => set({ pinnedChats: chats }),

			channels: [],
			setChannels: (channels) => set({ channels }),

			tags: [],
			setTags: (tags) => set({ tags }),

			folders: [],
			setFolders: (folders) => set({ folders }),

			selectedFolder: null,
			setSelectedFolder: (folder) => set({ selectedFolder: folder }),

			temporaryChatEnabled: false,
			setTemporaryChatEnabled: (enabled) => set({ temporaryChatEnabled: enabled }),

			scrollPaginationEnabled: false,
			setScrollPaginationEnabled: (enabled) => set({ scrollPaginationEnabled: enabled }),

			currentChatPage: 1,
			setCurrentChatPage: (page) => set({ currentChatPage: page })
		}),
		{ name: 'chat-store' }
	)
);

// Data Store - Models, prompts, knowledge, tools
interface DataState {
	models: Model[];
	setModels: (models: Model[]) => void;

	prompts: Prompt[] | null;
	setPrompts: (prompts: Prompt[] | null) => void;

	knowledge: Document[] | null;
	setKnowledge: (knowledge: Document[] | null) => void;

	tools: Tool[] | null;
	setTools: (tools: Tool[] | null) => void;

	toolServers: unknown[];
	setToolServers: (servers: unknown[]) => void;

	MODEL_DOWNLOAD_POOL: Record<string, unknown>;
	setMODEL_DOWNLOAD_POOL: (pool: Record<string, unknown>) => void;
}

export const useDataStore = create<DataState>()(
	devtools(
		(set) => ({
			models: [],
			setModels: (models) => set({ models }),

			prompts: null,
			setPrompts: (prompts) => set({ prompts }),

			knowledge: null,
			setKnowledge: (knowledge) => set({ knowledge }),

			tools: null,
			setTools: (tools) => set({ tools }),

			toolServers: [],
			setToolServers: (servers) => set({ toolServers: servers }),

			MODEL_DOWNLOAD_POOL: {},
			setMODEL_DOWNLOAD_POOL: (pool) => set({ MODEL_DOWNLOAD_POOL: pool })
		}),
		{ name: 'data-store' }
	)
);

// Socket Store - Real-time connection state
interface SocketState {
	socket: Socket | null;
	setSocket: (socket: Socket | null) => void;

	activeUserIds: string[] | null;
	setActiveUserIds: (ids: string[] | null) => void;

	USAGE_POOL: string[] | null;
	setUSAGE_POOL: (pool: string[] | null) => void;

	isLastActiveTab: boolean;
	setIsLastActiveTab: (isActive: boolean) => void;

	playingNotificationSound: boolean;
	setPlayingNotificationSound: (playing: boolean) => void;
}

export const useSocketStore = create<SocketState>()(
	devtools(
		(set) => ({
			socket: null,
			setSocket: (socket) => set({ socket }),

			activeUserIds: null,
			setActiveUserIds: (ids) => set({ activeUserIds: ids }),

			USAGE_POOL: null,
			setUSAGE_POOL: (pool) => set({ USAGE_POOL: pool }),

			isLastActiveTab: true,
			setIsLastActiveTab: (isActive) => set({ isLastActiveTab: isActive }),

			playingNotificationSound: false,
			setPlayingNotificationSound: (playing) => set({ playingNotificationSound: playing })
		}),
		{ name: 'socket-store' }
	)
);

// Audio Store - Audio-related state
interface AudioState {
	TTSWorker: unknown;
	setTTSWorker: (worker: unknown) => void;

	audioQueue: unknown;
	setAudioQueue: (queue: unknown) => void;
}

export const useAudioStore = create<AudioState>()(
	devtools(
		(set) => ({
			TTSWorker: null,
			setTTSWorker: (worker) => set({ TTSWorker: worker }),

			audioQueue: null,
			setAudioQueue: (queue) => set({ audioQueue: queue })
		}),
		{ name: 'audio-store' }
	)
);

// Persisted settings store (for localStorage persistence)
interface PersistedSettingsState {
	token: string | null;
	setToken: (token: string | null) => void;
	theme: string;
	setTheme: (theme: string) => void;
}

export const usePersistedSettingsStore = create<PersistedSettingsState>()(
	persist(
		(set) => ({
			token: null,
			setToken: (token) => set({ token }),
			theme: 'system',
			setTheme: (theme) => set({ theme })
		}),
		{
			name: 'brake-chat-settings'
		}
	)
);
