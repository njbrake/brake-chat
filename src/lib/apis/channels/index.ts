import { api } from '$lib/utils/apiClient';

type ChannelForm = {
	name: string;
	data?: object;
	meta?: object;
	access_control?: object;
};

export const createNewChannel = async (token: string = '', channel: ChannelForm) => {
	return api.post('/channels/create', channel, token);
};

export const getChannels = async (token: string = '') => {
	return api.get('/channels/', token);
};

export const getChannelById = async (token: string = '', channel_id: string) => {
	return api.get(`/channels/${channel_id}`, token);
};

export const getChannelUsersById = async (
	token: string,
	channel_id: string,
	query?: string,
	orderBy?: string,
	direction?: string,
	page = 1
) => {
	const searchParams = new URLSearchParams();
	searchParams.set('page', `${page}`);

	if (query) {
		searchParams.set('query', query);
	}

	if (orderBy) {
		searchParams.set('order_by', orderBy);
	}

	if (direction) {
		searchParams.set('direction', direction);
	}

	return api.get(`/channels/${channel_id}/users?${searchParams.toString()}`, token);
};

export const updateChannelById = async (
	token: string = '',
	channel_id: string,
	channel: ChannelForm
) => {
	return api.post(`/channels/${channel_id}/update`, channel, token);
};

export const deleteChannelById = async (token: string = '', channel_id: string) => {
	return api.delete(`/channels/${channel_id}/delete`, token);
};

export const getChannelMessages = async (
	token: string = '',
	channel_id: string,
	skip: number = 0,
	limit: number = 50
) => {
	return api.get(`/channels/${channel_id}/messages?skip=${skip}&limit=${limit}`, token);
};

export const getChannelThreadMessages = async (
	token: string = '',
	channel_id: string,
	message_id: string,
	skip: number = 0,
	limit: number = 50
) => {
	return api.get(
		`/channels/${channel_id}/messages/${message_id}/thread?skip=${skip}&limit=${limit}`,
		token
	);
};

type MessageForm = {
	reply_to_id?: string;
	parent_id?: string;
	content: string;
	data?: object;
	meta?: object;
};

export const sendMessage = async (token: string = '', channel_id: string, message: MessageForm) => {
	return api.post(`/channels/${channel_id}/messages/post`, message, token);
};

export const updateMessage = async (
	token: string = '',
	channel_id: string,
	message_id: string,
	message: MessageForm
) => {
	return api.post(`/channels/${channel_id}/messages/${message_id}/update`, message, token);
};

export const addReaction = async (
	token: string = '',
	channel_id: string,
	message_id: string,
	name: string
) => {
	return api.post(`/channels/${channel_id}/messages/${message_id}/reactions/add`, { name }, token);
};

export const removeReaction = async (
	token: string = '',
	channel_id: string,
	message_id: string,
	name: string
) => {
	return api.post(
		`/channels/${channel_id}/messages/${message_id}/reactions/remove`,
		{ name },
		token
	);
};

export const deleteMessage = async (token: string = '', channel_id: string, message_id: string) => {
	return api.delete(`/channels/${channel_id}/messages/${message_id}/delete`, token);
};
