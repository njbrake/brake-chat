import { getTimeRange } from '$lib/utils';
import { api } from '$lib/utils/apiClient';

export const createNewChat = async (token: string, chat: object, folderId: string | null) => {
	return api.post('/chats/new', { chat, folder_id: folderId ?? null }, token);
};

export const unarchiveAllChats = async (token: string) => {
	return api.post('/chats/unarchive/all', undefined, token);
};

export const importChats = async (token: string, chats: object[]) => {
	return api.post('/chats/import', { chats }, token);
};

export const getChatList = async (
	token: string = '',
	page: number | null = null,
	include_pinned: boolean = false,
	include_folders: boolean = false
) => {
	const searchParams = new URLSearchParams();

	if (page !== null) {
		searchParams.append('page', `${page}`);
	}

	if (include_folders) {
		searchParams.append('include_folders', 'true');
	}

	if (include_pinned) {
		searchParams.append('include_pinned', 'true');
	}

	const res = await api.get(`/chats/?${searchParams.toString()}`, token);
	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const getChatListByUserId = async (
	token: string = '',
	userId: string,
	page: number = 1,
	filter?: object
) => {
	const searchParams = new URLSearchParams();
	searchParams.append('page', `${page}`);

	if (filter) {
		Object.entries(filter).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, value.toString());
			}
		});
	}

	const res = await api.get(`/chats/list/user/${userId}?${searchParams.toString()}`, token);
	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const getChatById = async (token: string, id: string) => {
	return api.get(`/chats/${id}`, token);
};

export const getChatByShareId = async (token: string, share_id: string) => {
	return api.get(`/chats/share/${share_id}`, token);
};

export const getChatByIdWithPagination = async (
	token: string = '',
	id: string,
	page: number = 1
) => {
	const searchParams = new URLSearchParams();
	searchParams.append('page', `${page}`);

	return api.get(`/chats/${id}?${searchParams.toString()}`, token);
};

export const updateChatById = async (token: string, id: string, chat: object) => {
	return api.post(`/chats/${id}`, { chat }, token);
};

export const deleteChatById = async (token: string, id: string) => {
	return api.delete(`/chats/${id}`, token);
};

export const deleteChatsByIds = async (token: string, chatIds: string[]) => {
	const results = await Promise.allSettled(chatIds.map((id) => deleteChatById(token, id)));

	const deleted = results.filter((r) => r.status === 'fulfilled').length;
	const failed = chatIds.filter((_, i) => results[i].status === 'rejected');

	return { deleted, failed, total: chatIds.length };
};

export const cloneChatById = async (token: string, id: string) => {
	return api.get(`/chats/${id}/clone`, token);
};

export const archiveChatById = async (token: string, id: string) => {
	return api.get(`/chats/${id}/archive`, token);
};

export const shareChatById = async (token: string, id: string) => {
	return api.post(`/chats/${id}/share`, undefined, token);
};

export const deleteChatShareById = async (token: string, id: string) => {
	return api.delete(`/chats/${id}/share`, token);
};

export const getAllChatTags = async (token: string) => {
	return api.get('/chats/tags', token);
};

export const getAllChatTagsById = async (token: string, id: string) => {
	return api.get(`/chats/${id}/tags`, token);
};

export const addChatTagById = async (token: string, id: string, tagName: string) => {
	return api.post(`/chats/${id}/tags`, { tag_name: tagName, chat_id: id }, token);
};

export const deleteChatTagById = async (token: string, id: string, tagName: string) => {
	return api.delete(`/chats/${id}/tags`, token);
};

export const deleteAllChats = async (token: string) => {
	return api.delete('/chats/', token);
};

export const getAllChats = async (token: string) => {
	const res = await api.get('/chats/all', token);
	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const getAllUserChats = async (token: string) => {
	const res = await api.get('/chats/all/db', token);
	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const getAllArchivedChats = async (token: string) => {
	const res = await api.get('/chats/archived', token);
	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const deleteArchivedChats = async (token: string) => {
	return api.delete('/chats/archived', token);
};

export const getPinnedChats = async (token: string) => {
	const res = await api.get('/chats/pinned', token);
	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};

export const pinChatById = async (token: string, id: string) => {
	return api.post(`/chats/${id}/pin`, undefined, token);
};

export const unpinChatById = async (token: string, id: string) => {
	return api.post(`/chats/${id}/unpin`, undefined, token);
};

export const searchChats = async (token: string, text: string, page: number = 1) => {
	const res = await api.post('/chats/search', { text, page }, token);
	return res.map((chat) => ({
		...chat,
		time_range: getTimeRange(chat.updated_at)
	}));
};
