<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';

	import fileSaver from 'file-saver';
	const { saveAs } = fileSaver;

	import { toast } from 'svelte-sonner';
	import { getContext, onMount } from 'svelte';
	import { settings } from '$lib/stores';
	import Modal from '$lib/components/common/Modal.svelte';
	import Plus from '$lib/components/icons/Plus.svelte';
	import Minus from '$lib/components/icons/Minus.svelte';
	import PencilSolid from '$lib/components/icons/PencilSolid.svelte';
	import SensitiveInput from '$lib/components/common/SensitiveInput.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Switch from '$lib/components/common/Switch.svelte';
	import Tags from './common/Tags.svelte';
	import Collapsible from '$lib/components/common/Collapsible.svelte';
	import { getToolServerData } from '$lib/apis';
	import { verifyToolServerConnection, registerOAuthClient } from '$lib/apis/configs';
	import AccessControl from './workspace/common/AccessControl.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Textarea from './common/Textarea.svelte';

	export let onSubmit: Function = () => {};
	export let onDelete: Function = () => {};

	export let show = false;
	export let edit = false;

	export let direct = false;
	export let connection = null;

	let inputElement = null;

	let url = '';

	let auth_type = 'bearer';
	let key = '';
	let headers = '';

	let functionNameFilterList = [];
	let accessControl = {};

	let id = '';
	let name = '';
	let description = '';

	let oauthClientInfo = null;

	let enable = true;
	let loading = false;

	let verifiedSpecs = null;
	let showVerifiedTools = false;

	let protocol = 'streamable_http';

	const registerOAuthClientHandler = async () => {
		if (url === '') {
			toast.error('Please enter a valid URL');
			return;
		}

		if (id === '') {
			toast.error('Please enter a valid ID');
			return;
		}

		const res = await registerOAuthClient(
			localStorage.token,
			{
				url: url,
				client_id: id
			},
			'mcp'
		).catch((err) => {
			toast.error('Registration failed');
			return null;
		});

		if (res) {
			toast.warning(
				'Please save the connection to persist the OAuth client information and do not change the ID'
			);
			toast.success('Registration successful');

			console.debug('Registration successful', res);
			oauthClientInfo = res?.oauth_client_info ?? null;
		}
	};

	const verifyHandler = async () => {
		if (url === '') {
			toast.error('Please enter a valid URL');
			return;
		}

		if (headers) {
			try {
				let _headers = JSON.parse(headers);
				if (typeof _headers !== 'object' || Array.isArray(_headers)) {
					_headers = null;
					throw new Error('Headers must be a valid JSON object');
				}
				headers = JSON.stringify(_headers, null, 2);
			} catch (error) {
				toast.error('Headers must be a valid JSON object');
				return;
			}
		}

		const res = await verifyToolServerConnection(localStorage.token, {
			url,
			auth_type,
			headers: headers ? JSON.parse(headers) : undefined,
			key,
			config: {
				enable: enable,
				access_control: accessControl
			},
			info: {
				id,
				name,
				description
			}
		}).catch((err) => {
			toast.error('Connection failed');
		});

		if (res) {
			toast.success('Connection successful');
			console.debug('Connection successful', res);

			verifiedSpecs = res?.specs || null;
			showVerifiedTools = verifiedSpecs && verifiedSpecs.length > 0;
		}
	};

	const importHandler = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const json = event.target.result;
			console.log('importHandler', json);

			try {
				let data = JSON.parse(json);
				// validate data
				if (Array.isArray(data)) {
					if (data.length === 0) {
						toast.error('Please select a valid JSON file');
						return;
					}
					data = data[0];
				}

				if (data.url) url = data.url;

				if (data.auth_type) auth_type = data.auth_type;
				if (data.headers) headers = JSON.stringify(data.headers, null, 2);
				if (data.key) key = data.key;

				if (data.info) {
					id = data.info.id ?? '';
					name = data.info.name ?? '';
					description = data.info.description ?? '';
				}

				if (data.config) {
					enable = data.config.enable ?? true;
					accessControl = data.config.access_control ?? {};
				}

				toast.success('Import successful');
			} catch (error) {
				toast.error('Please select a valid JSON file');
			}
		};
		reader.readAsText(file);
	};

	const exportHandler = async () => {
		// export current connection as json file
		const json = JSON.stringify([
			{
				url,

				auth_type,
				headers: headers ? JSON.parse(headers) : undefined,
				key,

				info: {
					id: id,
					name: name,
					description: description
				}
			}
		]);

		const blob = new Blob([json], {
			type: 'application/json'
		});

		saveAs(blob, `tool-server-${id || name || 'export'}.json`);
	};

	const submitHandler = async () => {
		loading = true;

		// remove trailing slash from url
		url = url.replace(/\/$/, '');
		if (id.includes(':') || id.includes('|')) {
			toast.error('ID cannot contain ":" or "|" characters');
			loading = false;
			return;
		}

		if (auth_type === 'oauth_2.1' && !oauthClientInfo) {
			toast.error('Please register the OAuth client');
			loading = false;
			return;
		}

		if (headers) {
			try {
				const _headers = JSON.parse(headers);
				if (typeof _headers !== 'object' || Array.isArray(_headers)) {
					throw new Error('Headers must be a valid JSON object');
				}
				headers = JSON.stringify(_headers, null, 2);
			} catch (error) {
				toast.error('Headers must be a valid JSON object');
				loading = false;
				return;
			}
		}

		const connection = {
			url,

			auth_type,
			headers: headers ? JSON.parse(headers) : undefined,

			key,
			config: {
				enable: enable,
				function_name_filter_list: functionNameFilterList,
				access_control: accessControl
			},
			info: {
				id: id,
				name: name,
				description: description,
				...(oauthClientInfo ? { oauth_client_info: oauthClientInfo } : {})
			},
			protocol: protocol
		};

		await onSubmit(connection);

		loading = false;
		show = false;

		// reset form
		url = '';

		key = '';
		auth_type = 'bearer';

		id = '';
		name = '';
		description = '';

		oauthClientInfo = null;

		enable = true;
		functionNameFilterList = [];
		accessControl = null;

		verifiedSpecs = null;
		showVerifiedTools = false;
	};

	const init = () => {
		if (connection) {
			url = connection.url;

			auth_type = connection?.auth_type ?? 'bearer';
			headers = connection?.headers ? JSON.stringify(connection.headers, null, 2) : '';

			key = connection?.key ?? '';

			id = connection.info?.id ?? '';
			name = connection.info?.name ?? '';
			description = connection.info?.description ?? '';
			oauthClientInfo = connection.info?.oauth_client_info ?? null;

			enable = connection.config?.enable ?? true;
			functionNameFilterList = connection.config?.function_name_filter_list ?? [];
			accessControl = connection.config?.access_control ?? null;
			protocol = connection?.protocol ?? 'streamable_http';
		}
	};

	$: if (show) {
		init();
	}

	$: if (url) {
		verifiedSpecs = null;
		showVerifiedTools = false;
	}

	onMount(() => {
		init();
	});
</script>

<Modal size="sm" bind:show>
	<div>
		<div class=" flex justify-between dark:text-gray-100 px-5 pt-4 pb-2">
			<h1 class=" text-lg font-medium self-center font-primary">
				{#if edit}
					{'Edit Connection'}
				{:else}
					{'Add Connection'}
				{/if}
			</h1>

			<div class="flex items-center gap-3">
				<div class="flex gap-1.5 text-xs justify-end">
					<button
						class=" hover:underline"
						type="button"
						on:click={() => {
							inputElement?.click();
						}}
					>
						{'Import'}
					</button>

					<button class=" hover:underline" type="button" on:click={exportHandler}>
						{'Export'}
					</button>
				</div>
				<button
					class="self-center"
					aria-label={'Close Configure Connection Modal'}
					on:click={() => {
						show = false;
					}}
				>
					<XMark className={'size-5'} />
				</button>
			</div>
		</div>

		<div class="flex flex-col md:flex-row w-full px-4 pb-4 md:space-x-4 dark:text-gray-200">
			<div class=" flex flex-col w-full sm:flex-row sm:justify-center sm:space-x-6">
				<input
					bind:this={inputElement}
					type="file"
					hidden
					accept=".json"
					on:change={(e) => {
						importHandler(e);
					}}
				/>

				<form
					class="flex flex-col w-full"
					on:submit={(e) => {
						e.preventDefault();
						submitHandler();
					}}
				>
					<div class="px-1">
						<div class="flex gap-2">
							<div class="flex flex-col w-full">
								<div class="flex justify-between mb-0.5">
									<label
										for="api-base-url"
										class={`text-xs ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
										>{'URL'}</label
									>
								</div>

								<div class="flex flex-1 items-center">
									<input
										id="api-base-url"
										class={`w-full flex-1 text-sm bg-transparent ${($settings?.highContrastMode ?? false) ? 'placeholder:text-gray-700 dark:placeholder:text-gray-100' : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-700'}`}
										type="text"
										bind:value={url}
										placeholder={'API Base URL'}
										autocomplete="off"
										required
									/>

									<Tooltip
										content={'Verify Connection'}
										className="shrink-0 flex items-center mr-1"
									>
										<button
											class="self-center p-1 bg-transparent hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-850 rounded-lg transition"
											on:click={() => {
												verifyHandler();
											}}
											aria-label={'Verify Connection'}
											type="button"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
												class="w-4 h-4"
												aria-hidden="true"
											>
												<path
													fill-rule="evenodd"
													d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
													clip-rule="evenodd"
												/>
											</svg>
										</button>
									</Tooltip>

									<Tooltip content={enable ? 'Enabled' : 'Disabled'}>
										<Switch bind:state={enable} />
									</Tooltip>
								</div>
							</div>
						</div>

						<div class="flex gap-2 mt-2">
							<div class="flex flex-col w-full">
								<div class="flex justify-between items-center">
									<div class="flex gap-2 items-center">
										<div
											for="select-bearer-or-session"
											class={`text-xs ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
										>
											{'Auth'}
										</div>
									</div>

									{#if auth_type === 'oauth_2.1'}
										<div class="flex items-center gap-2">
											<div class="flex flex-col justify-end items-center shrink-0">
												<Tooltip content={oauthClientInfo ? 'Register Again' : 'Register Client'}>
													<button
														class=" text-xs underline dark:text-gray-500 dark:hover:text-gray-200 text-gray-700 hover:text-gray-900 transition"
														type="button"
														on:click={() => {
															registerOAuthClientHandler();
														}}
													>
														{'Register Client'}
													</button>
												</Tooltip>
											</div>

											{#if !oauthClientInfo}
												<div
													class="text-xs font-medium px-1.5 rounded-md bg-yellow-500/20 text-yellow-700 dark:text-yellow-200"
												>
													{'Not Registered'}
												</div>
											{:else}
												<div
													class="text-xs font-medium px-1.5 rounded-md bg-green-500/20 text-green-700 dark:text-green-200"
												>
													{'Registered'}
												</div>
											{/if}
										</div>
									{/if}
								</div>

								<div class="flex gap-2">
									<div class="flex-shrink-0 self-start">
										<select
											id="select-bearer-or-session"
											class={`w-full text-sm bg-transparent pr-5 ${($settings?.highContrastMode ?? false) ? 'placeholder:text-gray-700 dark:placeholder:text-gray-100' : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-700'}`}
											bind:value={auth_type}
										>
											<option value="none">{'None'}</option>

											<option value="bearer">{'Bearer'}</option>
											<option value="session">{'Session'}</option>

											{#if !direct}
												<option value="system_oauth">{'OAuth'}</option>
												<option value="oauth_2.1">{'OAuth 2.1'}</option>
											{/if}
										</select>
									</div>

									<div class="flex flex-1 items-center">
										{#if auth_type === 'bearer'}
											<SensitiveInput bind:value={key} placeholder={'API Key'} required={false} />
										{:else if auth_type === 'none'}
											<div
												class={`text-xs self-center translate-y-[1px] ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
											>
												{'No authentication'}
											</div>
										{:else if auth_type === 'session'}
											<div
												class={`text-xs self-center translate-y-[1px] ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
											>
												{'Forwards system user session credentials to authenticate'}
											</div>
										{:else if auth_type === 'system_oauth'}
											<div
												class={`text-xs self-center translate-y-[1px] ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
											>
												{'Forwards system user OAuth access token to authenticate'}
											</div>
										{:else if auth_type === 'oauth_2.1'}
											<div
												class={`flex items-center text-xs self-center translate-y-[1px] ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
											>
												{'Uses OAuth 2.1 Dynamic Client Registration'}
											</div>
										{/if}
									</div>
								</div>
							</div>

							<div class="flex gap-2 mt-2">
								<div class="flex flex-col w-full">
									<label
										for="select-protocol"
										class={`mb-0.5 text-xs ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
										>{'Protocol'}</label
									>

									<div class="flex-1">
										<select
											id="select-protocol"
											class={`w-full text-sm bg-transparent ${($settings?.highContrastMode ?? false) ? 'placeholder:text-gray-700 dark:placeholder:text-gray-100' : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-700'}`}
											bind:value={protocol}
										>
											<option value="streamable_http">{'Streamable HTTP'}</option>
											<option value="http_sse">{'HTTP+SSE'}</option>
										</select>
									</div>
								</div>
							</div>
						</div>

						{#if !direct}
							<div class="flex gap-2 mt-2">
								<div class="flex flex-col w-full">
									<label
										for="headers-input"
										class={`mb-0.5 text-xs text-gray-500
								${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : ''}`}
										>{'Headers'}</label
									>

									<div class="flex-1">
										<Tooltip
											content={'Enter additional headers in JSON format (e.g. {"X-Custom-Header": "value"})'}
										>
											<Textarea
												className="w-full text-sm outline-hidden"
												bind:value={headers}
												placeholder={'Enter additional headers in JSON format'}
												required={false}
												minSize={30}
											/>
										</Tooltip>
									</div>
								</div>
							</div>

							<hr class=" border-gray-100 dark:border-gray-700/10 my-2.5 w-full" />

							<div class="flex gap-2">
								<div class="flex flex-col w-full">
									<label
										for="enter-id"
										class={`mb-0.5 text-xs ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
										>{'ID'}
									</label>

									<div class="flex-1">
										<input
											id="enter-id"
											class={`w-full text-sm bg-transparent ${($settings?.highContrastMode ?? false) ? 'placeholder:text-gray-700 dark:placeholder:text-gray-100' : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-700'}`}
											type="text"
											bind:value={id}
											placeholder={'Enter ID'}
											autocomplete="off"
											required
										/>
									</div>
								</div>
							</div>

							<div class="flex gap-2 mt-2">
								<div class="flex flex-col w-full">
									<label
										for="enter-name"
										class={`mb-0.5 text-xs ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
										>{'Name'}
									</label>

									<div class="flex-1">
										<input
											id="enter-name"
											class={`w-full text-sm bg-transparent ${($settings?.highContrastMode ?? false) ? 'placeholder:text-gray-700 dark:placeholder:text-gray-100' : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-700'}`}
											type="text"
											bind:value={name}
											placeholder={'Enter name'}
											autocomplete="off"
											required
										/>
									</div>
								</div>
							</div>

							<div class="flex flex-col w-full mt-2">
								<label
									for="description"
									class={`mb-1 text-xs ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100 placeholder:text-gray-700 dark:placeholder:text-gray-100' : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-500'}`}
									>{'Description'}</label
								>

								<div class="flex-1">
									<input
										id="description"
										class={`w-full text-sm bg-transparent ${($settings?.highContrastMode ?? false) ? 'placeholder:text-gray-700 dark:placeholder:text-gray-100' : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-700'}`}
										type="text"
										bind:value={description}
										placeholder={'Enter description'}
										autocomplete="off"
									/>
								</div>
							</div>

							<div class="flex flex-col w-full mt-2">
								<label
									for="function-name-filter-list"
									class={`mb-1 text-xs ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100 placeholder:text-gray-700 dark:placeholder:text-gray-100' : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-500'}`}
									>{'Function Name Filter List'}</label
								>

								<div class="flex-1">
									<input
										id="function-name-filter-list"
										class={`w-full text-sm bg-transparent ${($settings?.highContrastMode ?? false) ? 'placeholder:text-gray-700 dark:placeholder:text-gray-100' : 'outline-hidden placeholder:text-gray-300 dark:placeholder:text-gray-700'}`}
										type="text"
										bind:value={functionNameFilterList}
										placeholder={'Enter function name filter list (e.g. func1, !func2)'}
										autocomplete="off"
									/>
								</div>
							</div>

							{#if showVerifiedTools && verifiedSpecs && verifiedSpecs.length > 0}
								<div class="flex flex-col w-full mt-3">
									<div class="flex justify-between items-center mb-1">
										<label
											class={`text-xs ${($settings?.highContrastMode ?? false) ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}
										>
											{'Available Tools'} ({verifiedSpecs.length})
										</label>

										<button
											type="button"
											class="text-xs underline dark:text-gray-500 dark:hover:text-gray-200 text-gray-700 hover:text-gray-900 transition"
											on:click={() => {
												showVerifiedTools = false;
											}}
										>
											{'Hide'}
										</button>
									</div>

									<div
										class="border border-gray-100 dark:border-gray-800 rounded-lg max-h-[300px] overflow-y-auto"
									>
										<div class="divide-y divide-gray-100 dark:divide-gray-800">
											{#each verifiedSpecs as spec, idx}
												<div
													class="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
												>
													<Collapsible
														buttonClassName="w-full text-left"
														chevron={true}
														open={idx < 5}
													>
														<div class="flex items-start justify-between gap-2">
															<div class="flex-1 min-w-0">
																<div class="flex items-center gap-2">
																	<div
																		class="font-mono text-xs font-medium text-gray-900 dark:text-gray-100"
																	>
																		{spec.name}
																	</div>

																	<button
																		type="button"
																		class="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
																		on:click={(e) => {
																			e.stopPropagation();

																			if (!functionNameFilterList.includes(spec.name)) {
																				functionNameFilterList = [
																					...functionNameFilterList,
																					spec.name
																				];
																			}

																			toast.success('Added to filter list');
																		}}
																		title={'Add to filter list'}
																	>
																		{'Add'}
																	</button>
																</div>

																{#if spec.description}
																	<div class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
																		{spec.description}
																	</div>
																{/if}
															</div>
														</div>

														<div slot="content" class="mt-2">
															{#if spec.parameters && spec.parameters.properties}
																<div class="text-xs">
																	<div class="font-medium text-gray-700 dark:text-gray-300 mb-1">
																		{'Parameters'}:
																	</div>

																	<div class="space-y-1 pl-2">
																		{#each Object.entries(spec.parameters.properties) as [paramName, paramDef]}
																			<div class="flex items-start gap-2">
																				<div
																					class="font-mono text-xs text-gray-800 dark:text-gray-200"
																				>
																					{paramName}
																					{#if spec.parameters.required?.includes(paramName)}
																						<span class="text-red-500">*</span>
																					{/if}
																				</div>

																				<div class="text-xs text-gray-500">
																					({paramDef.type || 'any'})
																				</div>

																				{#if paramDef.description}
																					<div
																						class="text-xs text-gray-600 dark:text-gray-400 flex-1"
																					>
																						- {paramDef.description}
																					</div>
																				{/if}
																			</div>
																		{/each}
																	</div>
																</div>
															{:else}
																<div class="text-xs text-gray-500 italic">
																	{'No parameters'}
																</div>
															{/if}
														</div>
													</Collapsible>
												</div>
											{/each}
										</div>
									</div>

									<div class="text-xs text-gray-500 mt-1">
										{'Click "Add" to include a tool in the filter list above'}
									</div>
								</div>
							{:else if showVerifiedTools && verifiedSpecs && verifiedSpecs.length === 0}
								<div class="flex flex-col w-full mt-3">
									<div
										class="text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2"
									>
										{'No tools found in this server'}
									</div>
								</div>
							{/if}

							<hr class=" border-gray-100 dark:border-gray-700/10 my-2.5 w-full" />

							<div class="my-2 -mx-2">
								<div class="px-4 py-3 bg-gray-50 dark:bg-gray-950 rounded-3xl">
									<AccessControl bind:accessControl />
								</div>
							</div>
						{/if}
					</div>

					<div
						class=" bg-yellow-500/20 text-yellow-700 dark:text-yellow-200 rounded-2xl text-xs px-4 py-3 mb-2"
					>
						<span class="font-medium">
							{'Warning'}:
						</span>
						{'MCP support is experimental and its specification changes often, which can lead to incompatibilities.'}

						<a
							class="font-medium underline"
							href="https://docs.openwebui.com/features/mcp"
							target="_blank">{'Read more →'}</a
						>
					</div>

					<div class="flex justify-between pt-3 text-sm font-medium gap-1.5">
						<div></div>
						<div class="flex gap-1.5">
							{#if edit}
								<button
									class="px-3.5 py-1.5 text-sm font-medium dark:bg-black dark:hover:bg-gray-900 dark:text-white bg-white text-black hover:bg-gray-100 transition rounded-full flex flex-row space-x-1 items-center"
									type="button"
									on:click={() => {
										onDelete();
										show = false;
									}}
								>
									{'Delete'}
								</button>
							{/if}

							<button
								class="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full flex flex-row space-x-1 items-center {loading
									? ' cursor-not-allowed'
									: ''}"
								type="submit"
								disabled={loading}
							>
								{'Save'}

								{#if loading}
									<div class="ml-2 self-center">
										<Spinner />
									</div>
								{/if}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
</Modal>
