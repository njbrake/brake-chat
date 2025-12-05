import { api } from '$lib/utils/apiClient';

export const createNewGroup = async (token: string, group: object) => {
	return api.post('/groups/create', group, token);
};

export const getGroups = async (token: string = '', share?: boolean) => {
	const searchParams = new URLSearchParams();
	if (share !== undefined) {
		searchParams.append('share', String(share));
	}

	return api.get(`/groups/?${searchParams.toString()}`, token);
};

export const getGroupById = async (token: string, id: string) => {
	return api.get(`/groups/id/${id}`, token);
};

export const updateGroupById = async (token: string, id: string, group: object) => {
	return api.post(`/groups/id/${id}/update`, group, token);
};

export const deleteGroupById = async (token: string, id: string) => {
	return api.delete(`/groups/id/${id}/delete`, token);
};

export const addUserToGroup = async (token: string, id: string, userIds: string[]) => {
	return api.post(`/groups/id/${id}/users/add`, { user_ids: userIds }, token);
};

export const removeUserFromGroup = async (token: string, id: string, userIds: string[]) => {
	return api.post(`/groups/id/${id}/users/remove`, { user_ids: userIds }, token);
};
