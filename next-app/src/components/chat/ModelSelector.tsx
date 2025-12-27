'use client';

import { useState, useMemo, useCallback } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Tooltip } from '@/components/common/Tooltip';
import { ChevronDown, Search, Plus, Minus, Pin, PinOff } from '@/components/icons';
import { useAppStore, useDataStore } from '@/store';
import type { Model } from '@/types';

interface ModelSelectorProps {
	selectedModels: string[];
	onChange: (models: string[]) => void;
	disabled?: boolean;
	showSetDefault?: boolean;
}

export function ModelSelector({
	selectedModels,
	onChange,
	disabled = false,
	showSetDefault = true
}: ModelSelectorProps) {
	const user = useAppStore((s) => s.user);
	const settings = useAppStore((s) => s.settings);
	const setSettings = useAppStore((s) => s.setSettings);
	const models = useDataStore((s) => s.models);

	const canAddMultipleModels =
		user?.role === 'admin' || (user?.permissions?.chat?.multiple_models ?? true);

	const handleAddModel = useCallback(() => {
		onChange([...selectedModels, '']);
	}, [selectedModels, onChange]);

	const handleRemoveModel = useCallback(
		(index: number) => {
			const newModels = [...selectedModels];
			newModels.splice(index, 1);
			onChange(newModels);
		},
		[selectedModels, onChange]
	);

	const handleModelChange = useCallback(
		(index: number, modelId: string) => {
			const newModels = [...selectedModels];
			newModels[index] = modelId;
			onChange(newModels);
		},
		[selectedModels, onChange]
	);

	const saveDefaultModel = useCallback(async () => {
		const hasEmptyModel = selectedModels.some((m) => m === '');
		if (hasEmptyModel) {
			console.error('Choose a model before saving...');
			return;
		}
		setSettings({ ...settings, models: selectedModels });
		// Would call API to save settings
	}, [selectedModels, settings, setSettings]);

	const togglePinModel = useCallback(
		async (modelId: string) => {
			const pinnedModels = settings?.pinnedModels ?? [];
			const newPinnedModels = pinnedModels.includes(modelId)
				? pinnedModels.filter((id) => id !== modelId)
				: [...pinnedModels, modelId];
			setSettings({ ...settings, pinnedModels: newPinnedModels });
			// Would call API to save settings
		},
		[settings, setSettings]
	);

	return (
		<div className="flex flex-col w-full items-start">
			{selectedModels.map((selectedModel, idx) => (
				<div key={idx} className="flex w-full max-w-fit">
					<div className="overflow-hidden w-full">
						<div className={`max-w-full ${settings?.highContrastMode ? 'm-1' : 'mr-1'}`}>
							<ModelSelectorDropdown
								value={selectedModel}
								onChange={(value) => handleModelChange(idx, value)}
								models={models}
								pinnedModels={settings?.pinnedModels ?? []}
								onTogglePin={togglePinModel}
								disabled={disabled}
							/>
						</div>
					</div>

					{canAddMultipleModels && (
						<div className="self-center mx-1 disabled:text-gray-600 disabled:hover:text-gray-600 -translate-y-[0.5px]">
							{idx === 0 ? (
								<Tooltip content="Add Model">
									<button
										disabled={disabled}
										onClick={handleAddModel}
										aria-label="Add Model"
										className="disabled:opacity-50"
									>
										<Plus className="size-3.5" strokeWidth={2} />
									</button>
								</Tooltip>
							) : (
								<Tooltip content="Remove Model">
									<button
										disabled={disabled}
										onClick={() => handleRemoveModel(idx)}
										aria-label="Remove Model"
										className="disabled:opacity-50"
									>
										<Minus className="size-3" strokeWidth={2} />
									</button>
								</Tooltip>
							)}
						</div>
					)}
				</div>
			))}

			{showSetDefault && (
				<div className="relative text-left mt-[1px] ml-1 text-[0.7rem] text-gray-600 dark:text-gray-400 font-primary">
					<button onClick={saveDefaultModel}>Set as default</button>
				</div>
			)}
		</div>
	);
}

interface ModelSelectorDropdownProps {
	value: string;
	onChange: (value: string) => void;
	models: Model[];
	pinnedModels: string[];
	onTogglePin: (modelId: string) => void;
	disabled?: boolean;
}

function ModelSelectorDropdown({
	value,
	onChange,
	models,
	pinnedModels,
	onTogglePin,
	disabled = false
}: ModelSelectorDropdownProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');

	const selectedModel = useMemo(() => models.find((m) => m.id === value), [models, value]);

	const filteredModels = useMemo(() => {
		if (!search) return models;
		const searchLower = search.toLowerCase();
		return models.filter(
			(model) =>
				model.name.toLowerCase().includes(searchLower) ||
				model.id.toLowerCase().includes(searchLower)
		);
	}, [models, search]);

	return (
		<DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
			<DropdownMenuPrimitive.Trigger asChild disabled={disabled}>
				<button
					className="flex items-center gap-1 text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 transition disabled:opacity-50"
					disabled={disabled}
				>
					<span className="truncate max-w-[200px]">{selectedModel?.name || 'Select a model'}</span>
					<ChevronDown className="size-4" />
				</button>
			</DropdownMenuPrimitive.Trigger>

			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					className="w-[32rem] max-w-[90vw] max-h-[60vh] overflow-hidden bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg z-50"
					sideOffset={8}
					align="start"
				>
					<div className="p-2 border-b border-gray-100 dark:border-gray-800">
						<div className="flex items-center gap-2 px-2">
							<Search className="size-4 text-gray-400" />
							<input
								type="text"
								placeholder="Search models..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
								autoFocus
							/>
						</div>
					</div>

					<div className="overflow-y-auto max-h-[50vh] p-1">
						{filteredModels.length === 0 ? (
							<div className="text-center text-sm text-gray-500 py-4">No models found</div>
						) : (
							filteredModels.map((model) => {
								const isPinned = pinnedModels.includes(model.id);
								return (
									<DropdownMenuPrimitive.Item
										key={model.id}
										className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition"
										onSelect={() => {
											onChange(model.id);
											setSearch('');
										}}
									>
										<div className="flex items-center gap-2 min-w-0">
											<div className="flex flex-col min-w-0">
												<span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
													{model.name}
												</span>
												{model.info?.meta?.description && (
													<span className="text-xs text-gray-500 truncate">
														{model.info.meta.description}
													</span>
												)}
											</div>
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												onTogglePin(model.id);
											}}
											className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
										>
											{isPinned ? (
												<PinOff className="size-4 text-gray-500" />
											) : (
												<Pin className="size-4 text-gray-400" />
											)}
										</button>
									</DropdownMenuPrimitive.Item>
								);
							})
						)}
					</div>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}
