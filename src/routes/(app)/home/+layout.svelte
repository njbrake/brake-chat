<script lang="ts">
	import { onMount } from 'svelte';
	import { WEBUI_NAME, showSidebar, mobile } from '$lib/stores';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Sidebar from '$lib/components/icons/Sidebar.svelte';
	onMount(async () => {});
</script>

<svelte:head>
	<title>
		{'Home'} • {$WEBUI_NAME}
	</title>
</svelte:head>

<div
	class=" flex flex-col w-full h-screen max-h-[100dvh] transition-width duration-200 ease-in-out {$showSidebar
		? 'md:max-w-[calc(100%-260px)]'
		: ''} max-w-full"
>
	<nav class="   px-2.5 pt-1.5 backdrop-blur-xl w-full drag-region">
		<div class=" flex items-center">
			{#if $mobile}
				<div class="{$showSidebar ? 'md:hidden' : ''} flex flex-none items-center self-end mt-1.5">
					<Tooltip content={$showSidebar ? 'Close Sidebar' : 'Open Sidebar'} interactive={true}>
						<button
							id="sidebar-toggle-button"
							class=" cursor-pointer flex rounded-lg hover:bg-gray-100 dark:hover:bg-gray-850 transition cursor-"
							on:click={() => {
								showSidebar.set(!$showSidebar);
							}}
						>
							<div class=" self-center p-1.5">
								<Sidebar />
							</div>
						</button>
					</Tooltip>
				</div>
			{/if}

			<div class=" flex w-full">
				<div class="flex-1" />
			</div>
		</div>
	</nav>

	<div class=" flex-1 max-h-full overflow-y-auto">
		<slot />
	</div>
</div>
