import { api } from '$lib/utils/apiClient';

export const getConfig = async (token: string = '') => {
	return api.get('/evaluations/config', token);
};

export const updateConfig = async (token: string, config: object) => {
	return api.post('/evaluations/config', config, token);
};

export const getAllFeedbacks = async (token: string = '') => {
	return api.get('/evaluations/feedbacks/all', token);
};

export const getFeedbackItems = async (token: string = '', orderBy, direction, page) => {
	const searchParams = new URLSearchParams();
	if (orderBy) searchParams.append('order_by', orderBy);
	if (direction) searchParams.append('direction', direction);
	if (page) searchParams.append('page', page.toString());

	return api.get(`/evaluations/feedbacks/list?${searchParams.toString()}`, token);
};

export const exportAllFeedbacks = async (token: string = '') => {
	return api.get('/evaluations/feedbacks/all/export', token);
};

export const createNewFeedback = async (token: string, feedback: object) => {
	return api.post('/evaluations/feedback', feedback, token);
};

export const getFeedbackById = async (token: string, feedbackId: string) => {
	return api.get(`/evaluations/feedback/${feedbackId}`, token);
};

export const updateFeedbackById = async (token: string, feedbackId: string, feedback: object) => {
	return api.post(`/evaluations/feedback/${feedbackId}`, feedback, token);
};

export const deleteFeedbackById = async (token: string, feedbackId: string) => {
	return api.delete(`/evaluations/feedback/${feedbackId}`, token);
};
