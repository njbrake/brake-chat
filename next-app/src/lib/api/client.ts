import { WEBUI_API_BASE_URL } from '@/lib/constants';

interface ApiClientOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	body?: unknown;
	headers?: Record<string, string>;
	token?: string;
	baseUrl?: string;
}

export class ApiError extends Error {
	constructor(
		message: string,
		public status?: number,
		public detail?: unknown
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export const apiClient = async <T = unknown>(
	endpoint: string,
	options: ApiClientOptions = {}
): Promise<T> => {
	const { method = 'GET', body, headers = {}, token, baseUrl = WEBUI_API_BASE_URL } = options;

	const defaultHeaders: Record<string, string> = {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	};

	if (token) {
		defaultHeaders.authorization = `Bearer ${token}`;
	}

	const config: RequestInit = {
		method,
		headers: { ...defaultHeaders, ...headers }
	};

	if (body && method !== 'GET') {
		config.body = JSON.stringify(body);
	}

	try {
		const res = await fetch(`${baseUrl}${endpoint}`, config);

		if (!res.ok) {
			const errorData = await res.json().catch(() => ({}));
			throw new ApiError(
				errorData.detail || errorData.message || `HTTP ${res.status}`,
				res.status,
				errorData
			);
		}

		return await res.json();
	} catch (err) {
		if (err instanceof ApiError) {
			throw err;
		}
		console.error('API Error:', err);
		throw err;
	}
};

export const api = {
	get: <T = unknown>(endpoint: string, token?: string, baseUrl?: string) =>
		apiClient<T>(endpoint, { method: 'GET', token, baseUrl }),

	post: <T = unknown>(endpoint: string, body?: unknown, token?: string, baseUrl?: string) =>
		apiClient<T>(endpoint, { method: 'POST', body, token, baseUrl }),

	put: <T = unknown>(endpoint: string, body?: unknown, token?: string, baseUrl?: string) =>
		apiClient<T>(endpoint, { method: 'PUT', body, token, baseUrl }),

	delete: <T = unknown>(endpoint: string, token?: string, baseUrl?: string) =>
		apiClient<T>(endpoint, { method: 'DELETE', token, baseUrl }),

	patch: <T = unknown>(endpoint: string, body?: unknown, token?: string, baseUrl?: string) =>
		apiClient<T>(endpoint, { method: 'PATCH', body, token, baseUrl })
};
