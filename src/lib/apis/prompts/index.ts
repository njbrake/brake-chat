import { api } from '$lib/utils/apiClient';

type PromptItem = {
	command: string;
	title: string;
	content: string;
	access_control?: null | object;
};

export const createNewPrompt = async (token: string, prompt: PromptItem) => {
	return api.post('/prompts/create', { ...prompt, command: `/${prompt.command}` }, token);
};

export const getPrompts = async (token: string = '') => {
	return api.get('/prompts/', token);
};

export const getPromptList = async (token: string = '') => {
	return api.get('/prompts/list', token);
};

export const getPromptByCommand = async (token: string, command: string) => {
	return api.get(`/prompts/command/${command}`, token);
};

export const updatePromptByCommand = async (token: string, prompt: PromptItem) => {
	return api.post(
		`/prompts/command/${prompt.command}/update`,
		{ ...prompt, command: `/${prompt.command}` },
		token
	);
};

export const deletePromptByCommand = async (token: string, command: string) => {
	command = command.charAt(0) === '/' ? command.slice(1) : command;
	return api.delete(`/prompts/command/${command}/delete`, token);
};
