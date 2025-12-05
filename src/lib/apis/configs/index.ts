import { WEBUI_BASE_URL } from '$lib/constants';
import type { Banner } from '$lib/types';
import { api } from '$lib/utils/apiClient';

export const importConfig = async (token: string, config) => {
	return api.post('/configs/import', { config }, token);
};

export const exportConfig = async (token: string) => {
	return api.get('/configs/export', token);
};

export const getConnectionsConfig = async (token: string) => {
	return api.get('/configs/connections', token);
};

export const setConnectionsConfig = async (token: string, config: object) => {
	return api.post('/configs/connections', config, token);
};

export const getToolServerConnections = async (token: string) => {
	return api.get('/configs/tool_servers', token);
};

export const setToolServerConnections = async (token: string, connections: object) => {
	return api.post('/configs/tool_servers', connections, token);
};

export const verifyToolServerConnection = async (token: string, connection: object) => {
	return api.post('/configs/tool_servers/verify', connection, token);
};

type RegisterOAuthClientForm = {
	url: string;
	client_id: string;
	client_name?: string;
};

export const registerOAuthClient = async (
	token: string,
	formData: RegisterOAuthClientForm,
	type: null | string = null
) => {
	const searchParams = type ? `?type=${type}` : '';
	return api.post(`/configs/oauth/clients/register${searchParams}`, formData, token);
};

export const getOAuthClientAuthorizationUrl = (clientId: string, type: null | string = null) => {
	const oauthClientId = type ? `${type}:${clientId}` : clientId;
	return `${WEBUI_BASE_URL}/oauth/clients/${oauthClientId}/authorize`;
};

export const getCodeExecutionConfig = async (token: string) => {
	return api.get('/configs/code_execution', token);
};

export const setCodeExecutionConfig = async (token: string, config: object) => {
	return api.post('/configs/code_execution', config, token);
};

export const getModelsConfig = async (token: string) => {
	return api.get('/configs/models', token);
};

export const setModelsConfig = async (token: string, config: object) => {
	return api.post('/configs/models', config, token);
};

export const setDefaultPromptSuggestions = async (token: string, promptSuggestions: string) => {
	return api.post('/configs/suggestions', { suggestions: promptSuggestions }, token);
};

export const getBanners = async (token: string): Promise<Banner[]> => {
	return api.get('/configs/banners', token);
};

export const setBanners = async (token: string, banners: Banner[]) => {
	return api.post('/configs/banners', { banners }, token);
};
