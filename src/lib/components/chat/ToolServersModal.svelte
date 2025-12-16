<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { models, config, toolServers } from '$lib/stores';

	import { toast } from 'svelte-sonner';
	import { deleteChatShareById, getChatById, shareChatById } from '$lib/apis/chats';
	import { copyToClipboard } from '$lib/utils';

	import Modal from '../common/Modal.svelte';
	import Link from '../icons/Link.svelte';
	import Collapsible from '../common/Collapsible.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';

	export let show = false;
	export let selectedToolIds = [];

	let selectedToolServers = [];

	$: selectedToolServers = Array.isArray($toolServers)
		? $toolServers.filter((_, idx) => selectedToolIds.includes(`direct_server:${idx}`))
		: [];
</script>

<Modal bind:show size="md">
	<div>
		<div class=" flex justify-between dark:text-gray-300 px-5 pt-4 pb-0.5">
			<div class=" text-lg font-medium self-center">{'Available Tools'}</div>
			<button
				class="self-center"
				on:click={() => {
					show = false;
				}}
			>
				<XMark className={'size-5'} />
			</button>
		</div>

		{#if selectedToolServers.length > 0}
			<div class=" flex justify-between dark:text-gray-300 px-5 pb-0.5">
				<div class=" text-base font-medium self-center">{'Selected Tool Servers'}</div>
			</div>

			<div class="px-5 pb-3 w-full flex flex-col justify-center">
				<div class=" text-sm dark:text-gray-300 mb-1">
					{#each selectedToolServers as toolServer}
						<Collapsible buttonClassName="w-full" chevron>
							<div>
								<div class="text-sm font-medium dark:text-gray-100 text-gray-800">
									{toolServer?.info?.title} - v{toolServer?.info?.version}
								</div>

								<div class="text-xs text-gray-500">
									{toolServer?.info?.description}
								</div>

								<div class="text-xs text-gray-500">
									{toolServer?.url}
								</div>
							</div>

							<div slot="content">
								{#each toolServer?.specs ?? [] as tool_spec}
									<div class="my-1">
										<div class="font-medium text-gray-800 dark:text-gray-100">
											{tool_spec?.name}
										</div>

										<div>
											{tool_spec?.description}
										</div>
									</div>
								{/each}
							</div>
						</Collapsible>
					{/each}
				</div>
			</div>
		{/if}

		{#if Array.isArray($toolServers) && $toolServers.length > 0}
			<div class=" flex justify-between dark:text-gray-300 px-5 pb-0.5">
				<div class=" text-base font-medium self-center">{'Tool Servers'}</div>
			</div>

			<div class="px-5 pb-5 w-full flex flex-col justify-center">
				<div class=" text-xs text-gray-600 dark:text-gray-300 mb-2">
					{'Open WebUI can use tools provided by MCP servers.'} <br /><a
						class="underline"
						href="https://modelcontextprotocol.io/"
						target="_blank">{'Learn more about MCP tool servers.'}</a
					>
				</div>
				<div class=" text-sm dark:text-gray-300 mb-1">
					{#each $toolServers as toolServer}
						<Collapsible buttonClassName="w-full" chevron>
							<div>
								<div class="text-sm font-medium dark:text-gray-100 text-gray-800">
									{toolServer?.info?.title} - v{toolServer?.info?.version}
								</div>

								<div class="text-xs text-gray-500">
									{toolServer?.info?.description}
								</div>

								<div class="text-xs text-gray-500">
									{toolServer?.url}
								</div>
							</div>

							<div slot="content">
								{#each toolServer?.specs ?? [] as tool_spec}
									<div class="my-1">
										<div class="font-medium text-gray-800 dark:text-gray-100">
											{tool_spec?.name}
										</div>

										<div>
											{tool_spec?.description}
										</div>
									</div>
								{/each}
							</div>
						</Collapsible>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</Modal>
