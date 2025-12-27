import { WEBUI_API_BASE_URL } from '@/lib/constants';

interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
	profile_image_url: string;
	token?: string;
}

interface ApiResponse {
	api_key?: string;
	[key: string]: unknown;
}

const handleResponse = async <T>(res: Response): Promise<T> => {
	if (!res.ok) {
		const error = await res.json();
		throw error.detail || 'An error occurred';
	}
	return res.json();
};

export const getSessionUser = async (token: string): Promise<SessionUser> => {
	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		credentials: 'include'
	});
	return handleResponse<SessionUser>(res);
};

export const ldapUserSignIn = async (user: string, password: string): Promise<SessionUser> => {
	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/ldap`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify({ user, password })
	});
	return handleResponse<SessionUser>(res);
};

export const userSignIn = async (email: string, password: string): Promise<SessionUser> => {
	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/signin`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify({ email, password })
	});
	return handleResponse<SessionUser>(res);
};

export const userSignUp = async (
	name: string,
	email: string,
	password: string,
	profile_image_url: string
): Promise<SessionUser> => {
	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/signup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify({ name, email, password, profile_image_url })
	});
	return handleResponse<SessionUser>(res);
};

export const userSignOut = async (): Promise<ApiResponse> => {
	const res = await fetch(`${WEBUI_API_BASE_URL}/auths/signout`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include'
	});
	const data = await handleResponse<ApiResponse>(res);
	if (typeof window !== 'undefined') {
		sessionStorage.clear();
	}
	return data;
};

export const getBackendConfig = async (): Promise<unknown> => {
	const res = await fetch(`${WEBUI_API_BASE_URL}/`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	return handleResponse(res);
};
