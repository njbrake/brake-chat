import { getUserPosition } from '$lib/utils';
import { api } from '$lib/utils/apiClient';

export const getUserGroups = async (token: string) => {
	return api.get('/users/groups', token);
};

export const getUserDefaultPermissions = async (token: string) => {
	return api.get('/users/default/permissions', token);
};

export const updateUserDefaultPermissions = async (token: string, permissions: object) => {
	return api.post('/users/default/permissions', permissions, token);
};

export const updateUserRole = async (token: string, id: string, role: string) => {
	return api.post('/users/update/role', { id, role }, token);
};

export const getUsers = async (
	token: string,
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

	return api.get(`/users/?${searchParams.toString()}`, token);
};

export const getAllUsers = async (token: string) => {
	return api.get('/users/all', token);
};

export const searchUsers = async (token: string, query: string) => {
	return api.get(`/users/search?query=${encodeURIComponent(query)}`, token);
};

export const getUserSettings = async (token: string) => {
	return api.get('/users/user/settings', token);
};

export const updateUserSettings = async (token: string, settings: object) => {
	return api.post('/users/user/settings/update', settings, token);
};

export const getUserById = async (token: string, userId: string) => {
	return api.get(`/users/${userId}`, token);
};

export const getUserInfo = async (token: string) => {
	return api.get('/users/user/info', token);
};

export const updateUserInfo = async (token: string, info: object) => {
	return api.post('/users/user/info/update', info, token);
};

export const getAndUpdateUserLocation = async (token: string) => {
	const location = await getUserPosition().catch((err) => {
		console.error(err);
		return null;
	});

	if (location) {
		await updateUserInfo(token, { location: location });
		return location;
	} else {
		console.info('Failed to get user location');
		return null;
	}
};

export const getUserActiveStatusById = async (token: string, userId: string) => {
	return api.get(`/users/${userId}/active`, token);
};

export const deleteUserById = async (token: string, userId: string) => {
	return api.delete(`/users/${userId}`, token);
};

type UserUpdateForm = {
	role: string;
	profile_image_url: string;
	email: string;
	name: string;
	password: string;
};

export const updateUserById = async (token: string, userId: string, user: UserUpdateForm) => {
	return api.post(
		`/users/${userId}/update`,
		{
			profile_image_url: user.profile_image_url,
			role: user.role,
			email: user.email,
			name: user.name,
			password: user.password !== '' ? user.password : undefined
		},
		token
	);
};

export const getUserGroupsById = async (token: string, userId: string) => {
	return api.get(`/users/${userId}/groups`, token);
};
