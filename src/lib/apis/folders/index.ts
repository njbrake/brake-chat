import { api } from '$lib/utils/apiClient';

type FolderForm = {
	name?: string;
	data?: Record<string, any>;
	meta?: Record<string, any>;
};

export const createNewFolder = async (token: string, folderForm: FolderForm) => {
	return api.post('/folders/', folderForm, token);
};

export const getFolders = async (token: string = '') => {
	return api.get('/folders/', token);
};

export const getFolderById = async (token: string, id: string) => {
	return api.get(`/folders/${id}`, token);
};

export const updateFolderById = async (token: string, id: string, folderForm: FolderForm) => {
	return api.post(`/folders/${id}/update`, folderForm, token);
};

export const updateFolderIsExpandedById = async (
	token: string,
	id: string,
	isExpanded: boolean
) => {
	return api.post(`/folders/${id}/update/expanded`, { is_expanded: isExpanded }, token);
};

export const updateFolderParentIdById = async (token: string, id: string, parentId?: string) => {
	return api.post(`/folders/${id}/update/parent`, { parent_id: parentId }, token);
};

type FolderItems = {
	chat_ids: string[];
	file_ids: string[];
};

export const updateFolderItemsById = async (token: string, id: string, items: FolderItems) => {
	return api.post(`/folders/${id}/update/items`, { items }, token);
};

export const deleteFolderById = async (token: string, id: string, deleteContents: boolean) => {
	const searchParams = new URLSearchParams();
	searchParams.append('delete_contents', deleteContents ? 'true' : 'false');

	return api.delete(`/folders/${id}?${searchParams.toString()}`, token);
};
