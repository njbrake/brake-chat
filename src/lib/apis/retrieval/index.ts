import { RETRIEVAL_API_BASE_URL } from '$lib/constants';
import { api } from '$lib/utils/apiClient';

export const getRAGConfig = async (token: string) => {
	return api.get('/config', token, RETRIEVAL_API_BASE_URL);
};

type ChunkConfigForm = {
	chunk_size: number;
	chunk_overlap: number;
};

type DocumentIntelligenceConfigForm = {
	key: string;
	endpoint: string;
};

type ContentExtractConfigForm = {
	engine: string;
	tika_server_url: string | null;
	document_intelligence_config: DocumentIntelligenceConfigForm | null;
};

type YoutubeConfigForm = {
	language: string[];
	translation?: string | null;
	proxy_url: string;
};

type RAGConfigForm = {
	PDF_EXTRACT_IMAGES?: boolean;
	ENABLE_GOOGLE_DRIVE_INTEGRATION?: boolean;
	ENABLE_ONEDRIVE_INTEGRATION?: boolean;
	chunk?: ChunkConfigForm;
	content_extraction?: ContentExtractConfigForm;
	web_loader_ssl_verification?: boolean;
	youtube?: YoutubeConfigForm;
};

export const updateRAGConfig = async (token: string, payload: RAGConfigForm) => {
	return api.post('/config/update', payload, token, RETRIEVAL_API_BASE_URL);
};

export const getQuerySettings = async (token: string) => {
	return api.get('/query/settings', token, RETRIEVAL_API_BASE_URL);
};

type QuerySettings = {
	k: number | null;
	r: number | null;
	template: string | null;
};

export const updateQuerySettings = async (token: string, settings: QuerySettings) => {
	return api.post('/query/settings/update', settings, token, RETRIEVAL_API_BASE_URL);
};

export const getEmbeddingConfig = async (token: string) => {
	return api.get('/embedding', token, RETRIEVAL_API_BASE_URL);
};

type OpenAIConfigForm = {
	key: string;
	url: string;
};

type AzureOpenAIConfigForm = {
	key: string;
	url: string;
	version: string;
};

type EmbeddingModelUpdateForm = {
	openai_config?: OpenAIConfigForm;
	azure_openai_config?: AzureOpenAIConfigForm;
	embedding_engine: string;
	embedding_model: string;
	embedding_batch_size?: number;
};

export const updateEmbeddingConfig = async (token: string, payload: EmbeddingModelUpdateForm) => {
	return api.post('/embedding/update', payload, token, RETRIEVAL_API_BASE_URL);
};

export const getRerankingConfig = async (token: string) => {
	return api.get('/reranking', token, RETRIEVAL_API_BASE_URL);
};

type RerankingModelUpdateForm = {
	reranking_model: string;
};

export const updateRerankingConfig = async (token: string, payload: RerankingModelUpdateForm) => {
	return api.post('/reranking/update', payload, token, RETRIEVAL_API_BASE_URL);
};

export const processYoutubeVideo = async (token: string, url: string) => {
	return api.post('/process/youtube', { url }, token, RETRIEVAL_API_BASE_URL);
};

export const processWeb = async (token: string, collection_name: string, url: string) => {
	return api.post('/process/web', { url, collection_name }, token, RETRIEVAL_API_BASE_URL);
};

export const queryDoc = async (
	token: string,
	collection_name: string,
	query: string,
	k: number | null = null
) => {
	return api.post('/query/doc', { collection_name, query, k }, token, RETRIEVAL_API_BASE_URL);
};

export const queryCollection = async (
	token: string,
	collection_names: string,
	query: string,
	k: number | null = null
) => {
	return api.post(
		'/query/collection',
		{ collection_names, query, k },
		token,
		RETRIEVAL_API_BASE_URL
	);
};

export const resetUploadDir = async (token: string) => {
	return api.post('/reset/uploads', undefined, token, RETRIEVAL_API_BASE_URL);
};

export const resetVectorDB = async (token: string) => {
	return api.post('/reset/db', undefined, token, RETRIEVAL_API_BASE_URL);
};
