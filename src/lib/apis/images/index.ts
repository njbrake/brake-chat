import { IMAGES_API_BASE_URL } from '$lib/constants';
import { api } from '$lib/utils/apiClient';

export const getConfig = async (token: string = '') => {
	return api.get('/config', token, IMAGES_API_BASE_URL);
};

export const updateConfig = async (token: string = '', config: object) => {
	return api.post('/config/update', config, token, IMAGES_API_BASE_URL);
};

export const verifyConfigUrl = async (token: string = '') => {
	return api.get('/config/url/verify', token, IMAGES_API_BASE_URL);
};

export const getImageGenerationConfig = async (token: string = '') => {
	return api.get('/image/config', token, IMAGES_API_BASE_URL);
};

export const updateImageGenerationConfig = async (token: string = '', config: object) => {
	return api.post('/image/config/update', config, token, IMAGES_API_BASE_URL);
};

export const getImageGenerationModels = async (token: string = '') => {
	return api.get('/models', token, IMAGES_API_BASE_URL);
};

export const imageGenerations = async (token: string = '', prompt: string) => {
	return api.post('/generations', { prompt }, token, IMAGES_API_BASE_URL);
};
