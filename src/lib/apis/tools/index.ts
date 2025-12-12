import { api } from '$lib/utils/apiClient';

export const getTools = async (token: string = '') => {
	return api.get('/tools/', token);
};
