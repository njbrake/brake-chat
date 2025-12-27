export interface ModelMeta {
	description?: string;
	hidden?: boolean;
	tags?: { name: string }[];
	suggestion_prompts?: { content: string; title: [string, string] }[];
	capabilities?: {
		vision?: boolean;
		[key: string]: boolean | undefined;
	};
	user?: {
		name?: string;
		username?: string;
		community?: boolean;
	};
}

export interface ModelConfig {
	id: string;
	name: string;
	meta?: ModelMeta;
	[key: string]: unknown;
}

type BaseModel = {
	id: string;
	name: string;
	info?: ModelConfig;
	owned_by: 'openai' | 'arena';
	tags?: { name: string }[];
	connection_type?: 'local' | 'external';
	direct?: boolean;
};

export interface OpenAIModel extends BaseModel {
	owned_by: 'openai';
	external: boolean;
	source?: string;
}

export type Model = OpenAIModel;

export type Settings = {
	pinnedModels?: string[];
	toolServers?: unknown[];
	temporaryChatByDefault?: boolean;
	detectArtifacts?: boolean;
	showUpdateToast?: boolean;
	showEmojiInCall?: boolean;
	voiceInterruption?: boolean;
	collapseCodeBlocks?: boolean;
	expandDetails?: boolean;
	notificationSound?: boolean;
	notificationSoundAlways?: boolean;
	stylizedPdfExport?: boolean;
	notifications?: unknown;
	imageCompression?: boolean;
	imageCompressionSize?: unknown;
	textScale?: number;
	widescreenMode?: null;
	largeTextAsFile?: boolean;
	promptAutocomplete?: boolean;
	hapticFeedback?: boolean;
	responseAutoCopy?: unknown;
	richTextInput?: boolean;
	params?: unknown;
	userLocation?: unknown;
	autoTags?: boolean;
	autoFollowUps?: boolean;
	splitLargeChunks?: (body: unknown, splitLargeChunks: unknown) => unknown;
	backgroundImageUrl?: null;
	landingPageMode?: string;
	iframeSandboxAllowForms?: boolean;
	iframeSandboxAllowSameOrigin?: boolean;
	scrollOnBranchChange?: boolean;
	directConnections?: null;
	chatBubble?: boolean;
	copyFormatted?: boolean;
	models?: string[];
	conversationMode?: boolean;
	speechAutoSend?: boolean;
	responseAutoPlayback?: boolean;
	audio?: AudioSettings;
	showUsername?: boolean;
	notificationEnabled?: boolean;
	highContrastMode?: boolean;
	title?: TitleSettings;
	showChatTitleInTab?: boolean;
	splitLargeDeltas?: boolean;
	chatDirection?: 'LTR' | 'RTL' | 'auto';
	ctrlEnterToSend?: boolean;
	system?: string;
	seed?: number;
	temperature?: string;
	repeat_penalty?: string;
	top_k?: string;
	top_p?: string;
	options?: ModelOptions;
};

type ModelOptions = {
	stop?: boolean;
};

type AudioSettings = {
	stt: unknown;
	tts: unknown;
	STTEngine?: string;
	TTSEngine?: string;
	speaker?: string;
	model?: string;
	nonLocalVoices?: boolean;
};

type TitleSettings = {
	auto?: boolean;
	model?: string;
	modelExternal?: string;
	prompt?: string;
};

export type Prompt = {
	command: string;
	user_id: string;
	title: string;
	content: string;
	timestamp: number;
};

export type Document = {
	collection_name: string;
	filename: string;
	name: string;
	title: string;
};

export type Config = {
	license_metadata?: {
		type?: string;
		seats?: number | null;
	};
	user_count?: number;
	default_pinned_models?: string[];
	status: boolean;
	name: string;
	version: string;
	default_locale: string;
	default_models: string;
	default_prompt_suggestions: PromptSuggestion[];
	onboarding?: boolean;
	features: {
		auth: boolean;
		auth_trusted_header: boolean;
		enable_api_keys: boolean;
		enable_signup: boolean;
		enable_signup_password_confirmation?: boolean;
		enable_login_form: boolean;
		enable_ldap?: boolean;
		enable_google_drive_integration: boolean;
		enable_onedrive_integration: boolean;
		enable_image_generation: boolean;
		enable_admin_export: boolean;
		enable_admin_chat_access: boolean;
		enable_community_sharing: boolean;
		enable_autocomplete_generation: boolean;
		enable_direct_connections: boolean;
		enable_version_update_check: boolean;
		enable_channels?: boolean;
		enable_websocket?: boolean;
	};
	oauth: {
		providers: {
			google?: string;
			microsoft?: string;
			github?: string;
			oidc?: string;
			feishu?: string;
			[key: string]: string | undefined;
		};
	};
	metadata?: {
		auth_logo_position?: 'center' | 'left';
		login_footer?: string;
	};
	ui?: {
		pending_user_overlay_title?: string;
		pending_user_overlay_description?: string;
	};
	file?: {
		max_count?: number;
		max_size?: number;
	};
};

type PromptSuggestion = {
	content: string;
	title: [string, string];
};

export type UserPermissions = {
	chat?: {
		delete?: boolean;
		temporary?: boolean;
		temporary_enforced?: boolean;
		controls?: boolean;
		multiple_models?: boolean;
	};
	workspace?: {
		models?: boolean;
		knowledge?: boolean;
		prompts?: boolean;
		tools?: boolean;
	};
};

export type SessionUser = {
	permissions?: UserPermissions;
	id: string;
	email: string;
	name: string;
	role: string;
	profile_image_url: string;
	token?: string;
};

export type Banner = {
	id: string;
	type: 'info' | 'warning' | 'error' | 'success';
	title?: string;
	content: string;
	dismissible?: boolean;
	timestamp?: number;
};

export type Chat = {
	id: string;
	title: string;
	user_id: string;
	created_at: number;
	updated_at: number;
	messages?: Message[];
	archived?: boolean;
	pinned?: boolean;
	folder_id?: string;
	tags?: string[];
	time_range?: string;
};

export type Message = {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
	model?: string;
	files?: FileAttachment[];
	sources?: Source[];
};

export type FileAttachment = {
	id: string;
	name: string;
	type: string;
	size: number;
	url?: string;
};

export type Source = {
	name: string;
	url?: string;
	content?: string;
};

export type Tag = {
	id: string;
	name: string;
	user_id: string;
};

export type Folder = {
	id: string;
	name: string;
	user_id: string;
	parent_id?: string;
	expanded?: boolean;
};

export type Channel = {
	id: string;
	name: string;
	description?: string;
	user_id: string;
	created_at: number;
};

export type Tool = {
	id: string;
	name: string;
	description?: string;
	user_id?: string;
	enabled?: boolean;
};
