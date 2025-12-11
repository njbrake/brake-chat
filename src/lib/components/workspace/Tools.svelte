<script lang="ts">
	import { onMount } from 'svelte';
	import { WEBUI_NAME, tools as _tools } from '$lib/stores';
	import { getTools } from '$lib/apis/tools';

	import Search from '../icons/Search.svelte';
	import Spinner from '../common/Spinner.svelte';
	import XMark from '../icons/XMark.svelte';
	import Tooltip from '../common/Tooltip.svelte';

	let loaded = false;
	let query = '';
	let tools = [];
	let filteredItems = [];

	$: if (tools && query !== undefined) {
		setFilteredItems();
	}

	const setFilteredItems = () => {
		filteredItems = tools.filter((t) => {
			if (query === '') return true;
			const lowerQuery = query.toLowerCase();
			return (
				(t.name || '').toLowerCase().includes(lowerQuery) ||
				(t.id || '').toLowerCase().includes(lowerQuery)
			);
		});
	};

	const init = async () => {
		tools = await getTools(localStorage.token);
		_tools.set(tools);
	};

	onMount(async () => {
		await init();
		loaded = true;
	});
</script>

<svelte:head>
	<title>
		{'Tools'} • {$WEBUI_NAME}
	</title>
</svelte:head>

{#if loaded}
	<div class="flex flex-col gap-1 px-1 mt-1.5 mb-3">
		<div class="flex justify-between items-center">
			<div class="flex items-center md:self-center text-xl font-medium px-0.5 gap-2 shrink-0">
				<div>
					{'MCP Tool Servers'}
				</div>

				<div class="text-lg font-medium text-gray-500 dark:text-gray-500">
					{filteredItems.length}
				</div>
			</div>
		</div>
	</div>

	<div
		class="py-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-850"
	>
		<div class=" flex w-full space-x-2 py-0.5 px-3.5 pb-2">
			<div class="flex flex-1">
				<div class=" self-center ml-1 mr-3">
					<Search className="size-3.5" />
				</div>
				<input
					class=" w-full text-sm pr-4 py-1 rounded-r-xl outline-hidden bg-transparent"
					bind:value={query}
					placeholder={'Search Tool Servers'}
				/>
				{#if query}
					<div class="self-center pl-1.5 translate-y-[0.5px] rounded-l-xl bg-transparent">
						<button
							class="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition"
							on:click={() => {
								query = '';
							}}
						>
							<XMark className="size-3" strokeWidth="2" />
						</button>
					</div>
				{/if}
			</div>
		</div>

		{#if (filteredItems ?? []).length !== 0}
			<div class=" my-2 gap-2 grid px-3 lg:grid-cols-2">
				{#each filteredItems as tool}
					<Tooltip content={tool?.meta?.description ?? tool?.id}>
						<div
							class=" flex space-x-4 text-left w-full px-3 py-2.5 dark:bg-gray-850/50 bg-gray-50 rounded-2xl"
						>
							<div class="flex items-center text-left flex-1">
								<div class=" flex-1 self-center">
									<Tooltip content={tool.id} placement="top-start">
										<div class="flex items-center gap-2">
											<div class="line-clamp-1 text-sm font-medium">
												{tool.name}
											</div>
										</div>
									</Tooltip>

									{#if tool?.meta?.description}
										<div class="px-0.5">
											<div class="text-xs text-gray-500 line-clamp-2">
												{tool.meta.description}
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</Tooltip>
				{/each}
			</div>
		{:else}
			<div class=" w-full h-full flex flex-col justify-center items-center my-16 mb-24">
				<div class="max-w-md text-center">
					<div class=" text-3xl mb-3">🔧</div>
					<div class=" text-lg font-medium mb-1">{'No MCP tool servers found'}</div>
					<div class=" text-gray-500 text-center text-xs">
						{'Configure MCP tool servers in your settings to see them here.'}
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="w-full h-full flex justify-center items-center">
		<Spinner className="size-5" />
	</div>
{/if}
