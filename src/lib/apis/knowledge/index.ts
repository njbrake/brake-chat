import { api } from '$lib/utils/apiClient';

export const createNewKnowledge = async (
	token: string,
	name: string,
	description: string,
	accessControl: null | object
) => {
	return api.post(
		'/knowledge/create',
		{
			name,
			description,
			access_control: accessControl
		},
		token
	);
};

export const getKnowledgeBases = async (token: string = '') => {
	return api.get('/knowledge/', token);
};

export const getKnowledgeBaseList = async (token: string = '') => {
	return api.get('/knowledge/list', token);
};

export const getKnowledgeById = async (token: string, id: string) => {
	return api.get(`/knowledge/${id}`, token);
};

type KnowledgeUpdateForm = {
	name?: string;
	description?: string;
	data?: object;
	access_control?: null | object;
};

export const updateKnowledgeById = async (token: string, id: string, form: KnowledgeUpdateForm) => {
	return api.post(
		`/knowledge/${id}/update`,
		{
			name: form?.name ? form.name : undefined,
			description: form?.description ? form.description : undefined,
			data: form?.data ? form.data : undefined,
			access_control: form.access_control
		},
		token
	);
};

export const addFileToKnowledgeById = async (token: string, id: string, fileId: string) => {
	return api.post(`/knowledge/${id}/file/add`, { file_id: fileId }, token);
};

export const updateFileFromKnowledgeById = async (token: string, id: string, fileId: string) => {
	return api.post(`/knowledge/${id}/file/update`, { file_id: fileId }, token);
};

export const removeFileFromKnowledgeById = async (token: string, id: string, fileId: string) => {
	return api.post(`/knowledge/${id}/file/remove`, { file_id: fileId }, token);
};

export const resetKnowledgeById = async (token: string, id: string) => {
	return api.post(`/knowledge/${id}/reset`, undefined, token);
};

export const deleteKnowledgeById = async (token: string, id: string) => {
	return api.delete(`/knowledge/${id}/delete`, token);
};

export const reindexKnowledgeFiles = async (token: string) => {
	return api.post('/knowledge/reindex', undefined, token);
};
