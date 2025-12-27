'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Send, Square, Paperclip, Mic, ImagePlus, Wrench, X, Sparkles } from 'lucide-react';
import { useAppStore, useDataStore } from '@/store';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { Tooltip } from '@/components/common/Tooltip';
import { Image } from '@/components/common/Image';

interface FileItem {
	id?: string;
	type: 'image' | 'file' | 'text';
	url?: string;
	name?: string;
	size?: number;
	status?: 'uploading' | 'uploaded' | 'error';
	content?: string;
	itemId?: string;
	error?: string;
}

interface MessageInputProps {
	onChange?: (data: {
		prompt: string;
		files: FileItem[];
		selectedToolIds: string[];
		selectedFilterIds: string[];
		imageGenerationEnabled: boolean;
	}) => void;
	createMessagePair: (prompt: string, files: FileItem[]) => void;
	stopResponse?: () => void;
	autoScroll?: boolean;
	generating?: boolean;
	atSelectedModel?: { id: string; name: string };
	selectedModels: string[];
	history?: Record<string, unknown>;
	taskIds?: string[] | null;
	prompt?: string;
	files?: FileItem[];
	selectedToolIds?: string[];
	selectedFilterIds?: string[];
	imageGenerationEnabled?: boolean;
}

export function MessageInput({
	onChange,
	createMessagePair,
	stopResponse,
	autoScroll = false,
	generating = false,
	atSelectedModel,
	selectedModels,
	history,
	taskIds = null,
	prompt: initialPrompt = '',
	files: initialFiles = [],
	selectedToolIds: initialToolIds = [],
	selectedFilterIds: initialFilterIds = [],
	imageGenerationEnabled: initialImageGen = false
}: MessageInputProps) {
	const user = useAppStore((s) => s.user);
	const settings = useAppStore((s) => s.settings);
	const config = useAppStore((s) => s.config);
	const mobile = useAppStore((s) => s.mobile);
	const models = useDataStore((s) => s.models);
	const tools = useDataStore((s) => s.tools);

	const [prompt, setPrompt] = useState(initialPrompt);
	const [files, setFiles] = useState<FileItem[]>(initialFiles);
	const [selectedToolIds, setSelectedToolIds] = useState<string[]>(initialToolIds);
	const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>(initialFilterIds);
	const [imageGenerationEnabled, setImageGenerationEnabled] = useState(initialImageGen);
	const [isRecording, setIsRecording] = useState(false);
	const [showToolsMenu, setShowToolsMenu] = useState(false);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const selectedModelIds = useMemo(
		() => (atSelectedModel ? [atSelectedModel.id] : selectedModels),
		[atSelectedModel, selectedModels]
	);

	const visionCapableModels = useMemo(
		() =>
			selectedModelIds.filter(
				(modelId) => models.find((m) => m.id === modelId)?.info?.meta?.capabilities?.vision ?? true
			),
		[selectedModelIds, models]
	);

	const showToolsButton = useMemo(() => (tools ?? []).length > 0, [tools]);

	const showImageGenerationButton = useMemo(() => {
		if (!config?.features?.enable_image_generation) return false;
		if (user?.role !== 'admin' && !user?.permissions?.workspace?.tools) return false;
		return true;
	}, [config, user]);

	useEffect(() => {
		onChange?.({
			prompt,
			files: files.filter((f) => f.type !== 'image'),
			selectedToolIds,
			selectedFilterIds,
			imageGenerationEnabled
		});
	}, [prompt, files, selectedToolIds, selectedFilterIds, imageGenerationEnabled, onChange]);

	const adjustTextareaHeight = useCallback(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
		}
	}, []);

	useEffect(() => {
		adjustTextareaHeight();
	}, [prompt, adjustTextareaHeight]);

	const handleSubmit = useCallback(() => {
		if (generating) {
			stopResponse?.();
			return;
		}

		const trimmedPrompt = prompt.trim();

		if (!trimmedPrompt && files.length === 0) {
			toast.error('Please enter a message or attach a file.');
			return;
		}

		if (selectedModels.length === 0) {
			toast.error('Please select a model.');
			return;
		}

		createMessagePair(trimmedPrompt, files);
		setPrompt('');
		setFiles([]);

		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
		}
	}, [prompt, files, generating, selectedModels, createMessagePair, stopResponse]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			const shouldSendOnEnter = !mobile && !(settings?.ctrlEnterToSend ?? false);

			if (e.key === 'Enter') {
				if (shouldSendOnEnter && !e.shiftKey) {
					e.preventDefault();
					handleSubmit();
				} else if (!shouldSendOnEnter && (e.ctrlKey || e.metaKey)) {
					e.preventDefault();
					handleSubmit();
				}
			}
		},
		[mobile, settings?.ctrlEnterToSend, handleSubmit]
	);

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const inputFiles = Array.from(e.target.files || []);
			if (inputFiles.length === 0) return;

			const maxCount = config?.file?.max_count ?? 10;
			if (files.length + inputFiles.length > maxCount) {
				toast.error(`You can only attach a maximum of ${maxCount} file(s) at a time.`);
				return;
			}

			for (const file of inputFiles) {
				const tempItemId = uuidv4();
				const fileItem: FileItem = {
					type: 'file',
					name: file.name,
					size: file.size,
					status: 'uploading',
					itemId: tempItemId
				};

				setFiles((prev) => [...prev, fileItem]);

				await new Promise((resolve) => setTimeout(resolve, 500));

				setFiles((prev) =>
					prev.map((f) =>
						f.itemId === tempItemId ? { ...f, status: 'uploaded', id: uuidv4() } : f
					)
				);
			}

			e.target.value = '';
		},
		[config?.file?.max_count, files.length]
	);

	const handleImageChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const inputFiles = Array.from(e.target.files || []);
			if (inputFiles.length === 0) return;

			if (visionCapableModels.length !== selectedModelIds.length) {
				toast.error('Model(s) do not support images');
				return;
			}

			for (const file of inputFiles) {
				if (!file.type.startsWith('image/')) {
					toast.error('Please select an image file.');
					continue;
				}

				const reader = new FileReader();
				reader.onload = (event) => {
					const url = event.target?.result as string;
					setFiles((prev) => [
						...prev,
						{
							type: 'image',
							url,
							name: file.name,
							status: 'uploaded',
							itemId: uuidv4()
						}
					]);
				};
				reader.readAsDataURL(file);
			}

			e.target.value = '';
		},
		[visionCapableModels.length, selectedModelIds.length]
	);

	const removeFile = useCallback((itemId: string) => {
		setFiles((prev) => prev.filter((f) => f.itemId !== itemId));
	}, []);

	const toggleTool = useCallback((toolId: string) => {
		setSelectedToolIds((prev) =>
			prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
		);
	}, []);

	return (
		<div className="w-full px-4 pb-4">
			<div className="relative flex flex-col bg-white dark:bg-gray-850 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
				{files.length > 0 && (
					<div className="flex flex-wrap gap-2 p-3 pb-0">
						{files.map((file) => (
							<div key={file.itemId} className="relative group">
								{file.type === 'image' ? (
									<div className="relative">
										<Image
											src={file.url || ''}
											alt={file.name || 'Uploaded image'}
											imageClassName="size-16 rounded-xl object-cover"
										/>
										<button
											className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
											onClick={() => removeFile(file.itemId!)}
										>
											<X className="size-3" />
										</button>
									</div>
								) : (
									<div className="relative flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
										<Paperclip className="size-4 text-gray-500" />
										<span className="text-sm truncate max-w-32">{file.name}</span>
										{file.status === 'uploading' && (
											<span className="text-xs text-gray-400">Uploading...</span>
										)}
										<button
											className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
											onClick={() => removeFile(file.itemId!)}
										>
											<X className="size-3" />
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				)}

				<div className="flex items-end gap-2 p-3">
					<div className="flex items-center gap-1">
						<input
							ref={fileInputRef}
							type="file"
							multiple
							className="hidden"
							onChange={handleFileChange}
						/>
						<input
							ref={imageInputRef}
							type="file"
							accept="image/*"
							multiple
							className="hidden"
							onChange={handleImageChange}
						/>

						<Tooltip content="Attach files">
							<button
								className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
								onClick={() => fileInputRef.current?.click()}
							>
								<Paperclip className="size-5" />
							</button>
						</Tooltip>

						{visionCapableModels.length > 0 && (
							<Tooltip content="Add image">
								<button
									className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
									onClick={() => imageInputRef.current?.click()}
								>
									<ImagePlus className="size-5" />
								</button>
							</Tooltip>
						)}

						{showToolsButton && (
							<Tooltip content="Tools">
								<button
									className={`p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
										selectedToolIds.length > 0
											? 'text-blue-500'
											: 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
									}`}
									onClick={() => setShowToolsMenu(!showToolsMenu)}
								>
									<Wrench className="size-5" />
								</button>
							</Tooltip>
						)}

						{showImageGenerationButton && (
							<Tooltip content="Image generation">
								<button
									className={`p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
										imageGenerationEnabled
											? 'text-purple-500'
											: 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
									}`}
									onClick={() => setImageGenerationEnabled(!imageGenerationEnabled)}
								>
									<Sparkles className="size-5" />
								</button>
							</Tooltip>
						)}
					</div>

					<div className="flex-1">
						<textarea
							ref={textareaRef}
							className="w-full bg-transparent outline-none resize-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 max-h-48"
							placeholder="Send a message..."
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							onKeyDown={handleKeyDown}
							rows={1}
						/>
					</div>

					<div className="flex items-center gap-1">
						<Tooltip content={isRecording ? 'Stop recording' : 'Voice input'}>
							<button
								className={`p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
									isRecording
										? 'text-red-500'
										: 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
								}`}
								onClick={() => {
									if (isRecording) {
										setIsRecording(false);
										toast.info('Voice recording stopped');
									} else {
										setIsRecording(true);
										toast.info('Voice recording started (placeholder)');
									}
								}}
							>
								<Mic className="size-5" />
							</button>
						</Tooltip>

						<Tooltip content={generating ? 'Stop' : 'Send'}>
							<button
								className={`p-2 rounded-xl transition ${
									generating
										? 'bg-red-500 hover:bg-red-600 text-white'
										: prompt.trim() || files.length > 0
											? 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
											: 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
								}`}
								onClick={handleSubmit}
								disabled={!generating && !prompt.trim() && files.length === 0}
							>
								{generating ? <Square className="size-5" /> : <Send className="size-5" />}
							</button>
						</Tooltip>
					</div>
				</div>

				{showToolsMenu && tools && tools.length > 0 && (
					<div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-850 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-48">
						<div className="text-xs text-gray-500 px-2 py-1">Available Tools</div>
						{tools.map((tool) => (
							<button
								key={tool.id}
								className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition ${
									selectedToolIds.includes(tool.id)
										? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
										: 'hover:bg-gray-100 dark:hover:bg-gray-800'
								}`}
								onClick={() => toggleTool(tool.id)}
							>
								<Wrench className="size-4" />
								<span className="text-sm">{tool.name}</span>
							</button>
						))}
					</div>
				)}
			</div>

			{taskIds && taskIds.length > 0 && (
				<div className="mt-2 text-xs text-gray-500 text-center">
					Processing {taskIds.length} task(s)...
				</div>
			)}
		</div>
	);
}
