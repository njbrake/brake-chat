import { api } from '$lib/utils/apiClient';

export const createNewFunction = async (token: string, func: object) => {
	return api.post('/functions/create', func, token);
};

export const getFunctions = async (token: string = '') => {
	return api.get('/functions/', token);
};

export const getFunctionList = async (token: string = '') => {
	return api.get('/functions/list', token);
};

export const loadFunctionByUrl = async (token: string = '', url: string) => {
	return api.post('/functions/load/url', { url }, token);
};

export const exportFunctions = async (token: string = '') => {
	return api.get('/functions/export', token);
};

export const getFunctionById = async (token: string, id: string) => {
	return api.get(`/functions/id/${id}`, token);
};

export const updateFunctionById = async (token: string, id: string, func: object) => {
	return api.post(`/functions/id/${id}/update`, func, token);
};

export const deleteFunctionById = async (token: string, id: string) => {
	return api.delete(`/functions/id/${id}/delete`, token);
};

export const toggleFunctionById = async (token: string, id: string) => {
	return api.post(`/functions/id/${id}/toggle`, undefined, token);
};

export const toggleGlobalById = async (token: string, id: string) => {
	return api.post(`/functions/id/${id}/toggle/global`, undefined, token);
};

export const getFunctionValvesById = async (token: string, id: string) => {
	return api.get(`/functions/id/${id}/valves`, token);
};

export const getFunctionValvesSpecById = async (token: string, id: string) => {
	return api.get(`/functions/id/${id}/valves/spec`, token);
};

export const updateFunctionValvesById = async (token: string, id: string, valves: object) => {
	return api.post(`/functions/id/${id}/valves/update`, valves, token);
};

export const getUserValvesById = async (token: string, id: string) => {
	return api.get(`/functions/id/${id}/valves/user`, token);
};

export const getUserValvesSpecById = async (token: string, id: string) => {
	return api.get(`/functions/id/${id}/valves/user/spec`, token);
};

export const updateUserValvesById = async (token: string, id: string, valves: object) => {
	return api.post(`/functions/id/${id}/valves/user/update`, valves, token);
};
