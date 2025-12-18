import { api } from '$lib/utils/apiClient';

export const getModelItems = async (
	token: string = '',
	query,
	viewOption,
	selectedTag,
	orderBy,
	direction,
	page
) => {
	const searchParams = new URLSearchParams();
	if (query) {
		searchParams.append('query', query);
	}
	if (viewOption) {
		searchParams.append('view_option', viewOption);
	}
	if (selectedTag) {
		searchParams.append('tag', selectedTag);
	}
	if (orderBy) {
		searchParams.append('order_by', orderBy);
	}
	if (direction) {
		searchParams.append('direction', direction);
	}
	if (page) {
		searchParams.append('page', page.toString());
	}

	return api.get(`/models/list?${searchParams.toString()}`, token);
};

export const getModelTags = async (token: string = '') => {
	return api.get('/models/tags', token);
};

export const importModels = async (token: string, models: object[]) => {
	return api.post('/models/import', { models }, token);
};

export const getBaseModels = async (token: string = '') => {
	return api.get('/models/base', token);
};

export const createNewModel = async (token: string, model: object) => {
	return api.post('/models/create', model, token);
};

export const getModelById = async (token: string, id: string) => {
	const searchParams = new URLSearchParams();
	searchParams.append('id', id);

	return api.get(`/models/model?${searchParams.toString()}`, token);
};

export const toggleModelById = async (token: string, id: string) => {
	const searchParams = new URLSearchParams();
	searchParams.append('id', id);

	return api.post(`/models/model/toggle?${searchParams.toString()}`, undefined, token);
};

export const updateModelById = async (token: string, id: string, model: object) => {
	return api.post('/models/model/update', { ...model, id }, token);
};

export const deleteModelById = async (token: string, id: string) => {
	return api.post('/models/model/delete', { id }, token);
};

export const deleteAllModels = async (token: string) => {
	return api.delete('/models/delete/all', token);
};
