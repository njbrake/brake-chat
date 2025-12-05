import { getTimeRange } from '$lib/utils';
import { api } from '$lib/utils/apiClient';

type NoteItem = {
	title: string;
	data: object;
	meta?: null | object;
	access_control?: null | object;
};

export const createNewNote = async (token: string, note: NoteItem) => {
	return api.post('/notes/create', note, token);
};

export const getNotes = async (token: string = '', raw: boolean = false) => {
	const res = await api.get('/notes/', token);

	if (raw) {
		return res;
	}

	if (!Array.isArray(res)) {
		return {};
	}

	const grouped: Record<string, any[]> = {};
	for (const note of res) {
		const timeRange = getTimeRange(note.updated_at / 1000000000);
		if (!grouped[timeRange]) {
			grouped[timeRange] = [];
		}
		grouped[timeRange].push({
			...note,
			timeRange
		});
	}

	return grouped;
};

export const getNoteList = async (token: string = '', page: number | null = null) => {
	const searchParams = new URLSearchParams();

	if (page !== null) {
		searchParams.append('page', `${page}`);
	}

	return api.get(`/notes/list?${searchParams.toString()}`, token);
};

export const getNoteById = async (token: string, id: string) => {
	return api.get(`/notes/${id}`, token);
};

export const updateNoteById = async (token: string, id: string, note: NoteItem) => {
	return api.post(`/notes/${id}/update`, note, token);
};

export const deleteNoteById = async (token: string, id: string) => {
	return api.delete(`/notes/${id}/delete`, token);
};
