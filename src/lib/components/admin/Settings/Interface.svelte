<script lang="ts">
	import fileSaver from 'file-saver';
	const { saveAs } = fileSaver;

	import { v4 as uuidv4 } from 'uuid';
	import { toast } from 'svelte-sonner';

	import { getBackendConfig, getModels, getTaskConfig, updateTaskConfig } from '$lib/apis';
	import { setDefaultPromptSuggestions } from '$lib/apis/configs';
	import { config, settings, user } from '$lib/stores';
	import { createEventDispatcher, onMount, getContext } from 'svelte';

	import { banners as _banners } from '$lib/stores';
	import type { Banner } from '$lib/types';

	import { getBaseModels } from '$lib/apis/models';
	import { getBanners, setBanners } from '$lib/apis/configs';

	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Switch from '$lib/components/common/Switch.svelte';
	import Textarea from '$lib/components/common/Textarea.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import Banners from './Interface/Banners.svelte';
	import PromptSuggestions from '$lib/components/workspace/Models/PromptSuggestions.svelte';

	const dispatch = createEventDispatcher();
	let taskConfig = {
		TASK_MODEL: '',
		TASK_MODEL_EXTERNAL: '',
		ENABLE_TITLE_GENERATION: true,
		TITLE_GENERATION_PROMPT_TEMPLATE: '',
		ENABLE_FOLLOW_UP_GENERATION: true,
		FOLLOW_UP_GENERATION_PROMPT_TEMPLATE: '',
		IMAGE_PROMPT_GENERATION_PROMPT_TEMPLATE: '',
		ENABLE_AUTOCOMPLETE_GENERATION: true,
		AUTOCOMPLETE_GENERATION_INPUT_MAX_LENGTH: -1,
		TAGS_GENERATION_PROMPT_TEMPLATE: '',
		ENABLE_TAGS_GENERATION: true,
		ENABLE_SEARCH_QUERY_GENERATION: true,
		ENABLE_RETRIEVAL_QUERY_GENERATION: true,
		QUERY_GENERATION_PROMPT_TEMPLATE: '',
		TOOLS_FUNCTION_CALLING_PROMPT_TEMPLATE: '',
		VOICE_MODE_PROMPT_TEMPLATE: ''
	};

	let promptSuggestions = [];
	let banners: Banner[] = [];

	const updateInterfaceHandler = async () => {
		taskConfig = await updateTaskConfig(localStorage.token, taskConfig);

		promptSuggestions = promptSuggestions.filter((p) => p.content !== '');
		promptSuggestions = await setDefaultPromptSuggestions(localStorage.token, promptSuggestions);
		await updateBanners();

		await config.set(await getBackendConfig());
	};

	const updateBanners = async () => {
		_banners.set(await setBanners(localStorage.token, banners));
	};

	let workspaceModels = null;
	let baseModels = null;

	let models = null;

	const init = async () => {
		taskConfig = await getTaskConfig(localStorage.token);
		promptSuggestions = $config?.default_prompt_suggestions ?? [];
		banners = await getBanners(localStorage.token);

		workspaceModels = await getBaseModels(localStorage.token);
		baseModels = await getModels(localStorage.token, null, false);

		models = baseModels.map((m) => {
			const workspaceModel = workspaceModels.find((wm) => wm.id === m.id);

			if (workspaceModel) {
				return {
					...m,
					...workspaceModel
				};
			} else {
				return {
					...m,
					id: m.id,
					name: m.name,

					is_active: true
				};
			}
		});

		console.debug('models', models);
	};

	onMount(async () => {
		await init();
	});
</script>

{#if models !== null && taskConfig}
	<form
		class="flex flex-col h-full justify-between space-y-3 text-sm"
		on:submit|preventDefault={() => {
			updateInterfaceHandler();
			dispatch('save');
		}}
	>
		<div class="  overflow-y-scroll scrollbar-hidden h-full pr-1.5">
			<div class="mb-3.5">
				<div class=" mt-0.5 mb-2.5 text-base font-medium">{'Tasks'}</div>

				<hr class=" border-gray-100 dark:border-gray-850 my-2" />

				<div class=" mb-2 font-medium flex items-center">
					<div class=" text-xs mr-1">{'Task Model'}</div>
					<Tooltip
						content={'A task model is used when performing tasks such as generating titles for chats and web search queries'}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="size-3.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
							/>
						</svg>
					</Tooltip>
				</div>

				<div class=" mb-2.5 flex w-full gap-2">
					<div class="flex-1">
						<div class=" text-xs mb-1">{'Local Task Model'}</div>
						<select
							class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
							bind:value={taskConfig.TASK_MODEL}
							placeholder={'Select a model'}
							on:change={() => {
								if (taskConfig.TASK_MODEL) {
									const model = models.find((m) => m.id === taskConfig.TASK_MODEL);
									if (model) {
										if (model?.access_control !== null) {
											toast.error(
												'This model is not publicly available. Please select another model.'
											);
										}

										taskConfig.TASK_MODEL = model.id;
									} else {
										taskConfig.TASK_MODEL = '';
									}
								}
							}}
						>
							<option value="" selected>{'Current Model'}</option>
							{#each models as model}
								<option value={model.id} class="bg-gray-100 dark:bg-gray-700">
									{model.name}
									{model?.connection_type === 'local' ? `(${'Local'})` : ''}
								</option>
							{/each}
						</select>
					</div>

					<div class="flex-1">
						<div class=" text-xs mb-1">{'External Task Model'}</div>
						<select
							class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
							bind:value={taskConfig.TASK_MODEL_EXTERNAL}
							placeholder={'Select a model'}
							on:change={() => {
								if (taskConfig.TASK_MODEL_EXTERNAL) {
									const model = models.find((m) => m.id === taskConfig.TASK_MODEL_EXTERNAL);
									if (model) {
										if (model?.access_control !== null) {
											toast.error(
												'This model is not publicly available. Please select another model.'
											);
										}

										taskConfig.TASK_MODEL_EXTERNAL = model.id;
									} else {
										taskConfig.TASK_MODEL_EXTERNAL = '';
									}
								}
							}}
						>
							<option value="" selected>{'Current Model'}</option>
							{#each models as model}
								<option value={model.id} class="bg-gray-100 dark:bg-gray-700">
									{model.name}
									{model?.connection_type === 'local' ? `(${'Local'})` : ''}
								</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="mb-2.5 flex w-full items-center justify-between">
					<div class=" self-center text-xs font-medium">
						{'Title Generation'}
					</div>

					<Switch bind:state={taskConfig.ENABLE_TITLE_GENERATION} />
				</div>

				{#if taskConfig.ENABLE_TITLE_GENERATION}
					<div class="mb-2.5">
						<div class=" mb-1 text-xs font-medium">{'Title Generation Prompt'}</div>

						<Tooltip
							content={'Leave empty to use the default prompt, or enter a custom prompt'}
							placement="top-start"
						>
							<Textarea
								bind:value={taskConfig.TITLE_GENERATION_PROMPT_TEMPLATE}
								placeholder={'Leave empty to use the default prompt, or enter a custom prompt'}
							/>
						</Tooltip>
					</div>
				{/if}

				<div class="mb-2.5 flex w-full items-center justify-between">
					<div class=" self-center text-xs font-medium">
						{'Voice Mode Custom Prompt'}
					</div>

					<Switch
						state={taskConfig.VOICE_MODE_PROMPT_TEMPLATE != null}
						on:change={(e) => {
							if (e.detail) {
								taskConfig.VOICE_MODE_PROMPT_TEMPLATE = '';
							} else {
								taskConfig.VOICE_MODE_PROMPT_TEMPLATE = null;
							}
						}}
					/>
				</div>

				{#if taskConfig.VOICE_MODE_PROMPT_TEMPLATE != null}
					<div class="mb-2.5">
						<div class=" mb-1 text-xs font-medium">{'Voice Mode Prompt'}</div>

						<Tooltip
							content={'Leave empty to use the default prompt, or enter a custom prompt'}
							placement="top-start"
						>
							<Textarea
								bind:value={taskConfig.VOICE_MODE_PROMPT_TEMPLATE}
								placeholder={'Leave empty to use the default prompt, or enter a custom prompt'}
							/>
						</Tooltip>
					</div>
				{/if}

				<div class="mb-2.5 flex w-full items-center justify-between">
					<div class=" self-center text-xs font-medium">
						{'Follow Up Generation'}
					</div>

					<Switch bind:state={taskConfig.ENABLE_FOLLOW_UP_GENERATION} />
				</div>

				{#if taskConfig.ENABLE_FOLLOW_UP_GENERATION}
					<div class="mb-2.5">
						<div class=" mb-1 text-xs font-medium">{'Follow Up Generation Prompt'}</div>

						<Tooltip
							content={'Leave empty to use the default prompt, or enter a custom prompt'}
							placement="top-start"
						>
							<Textarea
								bind:value={taskConfig.FOLLOW_UP_GENERATION_PROMPT_TEMPLATE}
								placeholder={'Leave empty to use the default prompt, or enter a custom prompt'}
							/>
						</Tooltip>
					</div>
				{/if}

				<div class="mb-2.5 flex w-full items-center justify-between">
					<div class=" self-center text-xs font-medium">
						{'Tags Generation'}
					</div>

					<Switch bind:state={taskConfig.ENABLE_TAGS_GENERATION} />
				</div>

				{#if taskConfig.ENABLE_TAGS_GENERATION}
					<div class="mb-2.5">
						<div class=" mb-1 text-xs font-medium">{'Tags Generation Prompt'}</div>

						<Tooltip
							content={'Leave empty to use the default prompt, or enter a custom prompt'}
							placement="top-start"
						>
							<Textarea
								bind:value={taskConfig.TAGS_GENERATION_PROMPT_TEMPLATE}
								placeholder={'Leave empty to use the default prompt, or enter a custom prompt'}
							/>
						</Tooltip>
					</div>
				{/if}

				<div class="mb-2.5 flex w-full items-center justify-between">
					<div class=" self-center text-xs font-medium">
						{'Retrieval Query Generation'}
					</div>

					<Switch bind:state={taskConfig.ENABLE_RETRIEVAL_QUERY_GENERATION} />
				</div>

				<div class="mb-2.5 flex w-full items-center justify-between">
					<div class=" self-center text-xs font-medium">
						{'Web Search Query Generation'}
					</div>

					<Switch bind:state={taskConfig.ENABLE_SEARCH_QUERY_GENERATION} />
				</div>

				<div class="mb-2.5">
					<div class=" mb-1 text-xs font-medium">{'Query Generation Prompt'}</div>

					<Tooltip
						content={'Leave empty to use the default prompt, or enter a custom prompt'}
						placement="top-start"
					>
						<Textarea
							bind:value={taskConfig.QUERY_GENERATION_PROMPT_TEMPLATE}
							placeholder={'Leave empty to use the default prompt, or enter a custom prompt'}
						/>
					</Tooltip>
				</div>

				<div class="mb-2.5 flex w-full items-center justify-between">
					<div class=" self-center text-xs font-medium">
						{'Autocomplete Generation'}
					</div>

					<Tooltip content={'Enable autocomplete generation for chat messages'}>
						<Switch bind:state={taskConfig.ENABLE_AUTOCOMPLETE_GENERATION} />
					</Tooltip>
				</div>

				{#if taskConfig.ENABLE_AUTOCOMPLETE_GENERATION}
					<div class="mb-2.5">
						<div class=" mb-1 text-xs font-medium">
							{'Autocomplete Generation Input Max Length'}
						</div>

						<Tooltip
							content={'Character limit for autocomplete generation input'}
							placement="top-start"
						>
							<input
								class="w-full outline-hidden bg-transparent"
								bind:value={taskConfig.AUTOCOMPLETE_GENERATION_INPUT_MAX_LENGTH}
								placeholder={'-1 for no limit, or a positive integer for a specific limit'}
							/>
						</Tooltip>
					</div>
				{/if}

				<div class="mb-2.5">
					<div class=" mb-1 text-xs font-medium">{'Image Prompt Generation Prompt'}</div>

					<Tooltip
						content={'Leave empty to use the default prompt, or enter a custom prompt'}
						placement="top-start"
					>
						<Textarea
							bind:value={taskConfig.IMAGE_PROMPT_GENERATION_PROMPT_TEMPLATE}
							placeholder={'Leave empty to use the default prompt, or enter a custom prompt'}
						/>
					</Tooltip>
				</div>

				<div class="mb-2.5">
					<div class=" mb-1 text-xs font-medium">{'Tools Function Calling Prompt'}</div>

					<Tooltip
						content={'Leave empty to use the default prompt, or enter a custom prompt'}
						placement="top-start"
					>
						<Textarea
							bind:value={taskConfig.TOOLS_FUNCTION_CALLING_PROMPT_TEMPLATE}
							placeholder={'Leave empty to use the default prompt, or enter a custom prompt'}
						/>
					</Tooltip>
				</div>
			</div>

			<div class="mb-3.5">
				<div class=" mt-0.5 mb-2.5 text-base font-medium">{'UI'}</div>

				<hr class=" border-gray-100 dark:border-gray-850 my-2" />

				<div class="mb-2.5">
					<div class="flex w-full justify-between">
						<div class=" self-center text-xs">
							{'Banners'}
						</div>

						<button
							class="p-1 px-3 text-xs flex rounded-sm transition"
							type="button"
							on:click={() => {
								if (banners.length === 0 || banners.at(-1).content !== '') {
									banners = [
										...banners,
										{
											id: uuidv4(),
											type: '',
											title: '',
											content: '',
											dismissible: true,
											timestamp: Math.floor(Date.now() / 1000)
										}
									];
								}
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-4 h-4"
							>
								<path
									d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
								/>
							</svg>
						</button>
					</div>

					<Banners bind:banners />
				</div>

				{#if $user?.role === 'admin'}
					<PromptSuggestions bind:promptSuggestions />

					{#if promptSuggestions.length > 0}
						<div class="text-xs text-left w-full mt-2">
							{'Adjusting these settings will apply changes universally to all users.'}
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<div class="flex justify-end text-sm font-medium">
			<button
				class="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full"
				type="submit"
			>
				{'Save'}
			</button>
		</div>
	</form>
{:else}
	<div class=" h-full w-full flex justify-center items-center">
		<Spinner className="size-5" />
	</div>
{/if}
