<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Modal from '../common/Modal.svelte';
	import { shortcuts, Shortcut } from '$lib/shortcuts';
	import { settings } from '$lib/stores';
	import ShortcutItem from './ShortcutItem.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';

	type CategorizedShortcuts = {
		[category: string]: {
			left: Shortcut[];
			right: Shortcut[];
		};
	};
	export let show = false;

	let categorizedShortcuts: CategorizedShortcuts = {};
	let isMac = false;

	onMount(() => {
		isMac = /Mac/i.test(navigator.userAgent);
	});

	$: {
		const allShortcuts = Object.values(shortcuts).filter((shortcut) => {
			if (!shortcut.setting) {
				return true;
			}
			return $settings[shortcut.setting.id] === shortcut.setting.value;
		});

		categorizedShortcuts = allShortcuts.reduce((acc, shortcut) => {
			const category = shortcut.category;
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(shortcut);
			return acc;
		}, {});
	}
</script>

<Modal bind:show>
	<div class="text-gray-700 dark:text-gray-100 px-5 py-4">
		<div class="flex justify-between dark:text-gray-300 pb-2">
			<div class="text-lg font-medium self-center">{'Keyboard Shortcuts'}</div>
			<button class="self-center" on:click={() => (show = false)}>
				<XMark className={'size-5'} />
			</button>
		</div>

		{#each Object.entries(categorizedShortcuts) as [category, items], categoryIndex}
			{#if categoryIndex > 0}
				<div class="py-3">
					<div class="w-full border-t dark:border-gray-850 border-gray-50" />
				</div>
			{/if}

			<div class="flex justify-between dark:text-gray-300 pb-2">
				<div class="text-base self-center">{category}</div>
			</div>
			<div class="flex flex-col md:flex-row w-full md:space-x-2 dark:text-gray-200">
				<div class="flex flex-col w-full sm:flex-row sm:justify-center sm:space-x-6">
					<div class=" grid grid-cols-1 sm:grid-cols-2 gap-2 gap-x-4 w-full">
						<!-- {'Chat'} -->
						<!-- {'Global'} -->
						<!-- {'Input'} -->
						<!-- {'Message'} -->

						<!-- {'New Chat'} -->
						<!-- {'New Temporary Chat'} -->
						<!-- {'Delete Chat'} -->
						<!-- {'Search'} -->
						<!-- {'Open Settings'} -->
						<!-- {'Show Shortcuts'} -->
						<!-- {'Toggle Sidebar'} -->
						<!-- {'Close Modal'} -->
						<!-- {'Focus Chat Input'} -->
						<!-- {'Accept Autocomplete Generation\nJump to Prompt Variable'} -->
						<!-- {'Prevent File Creation'} -->
						<!-- {'Attach File From Knowledge'} -->
						<!-- {'Add Custom Prompt'} -->
						<!-- {'Talk to Model'} -->
						<!-- {'Generate Message Pair'} -->
						<!-- {'Regenerate Response'} -->
						<!-- {'Stop Generating'} -->
						<!-- {'Edit Last Message'} -->
						<!-- {'Copy Last Response'} -->
						<!-- {'Copy Last Code Block'} -->

						<!-- {Only active when "Paste Large Text as File" setting is toggled on.} -->
						<!-- {'Only active when the chat input is in focus.'} -->
						<!-- {'Only active when the chat input is in focus and an LLM is generating a response.'} -->
						<!-- {'Only can be triggered when the chat input is in focus.'} -->
						{#each items as shortcut}
							<div class="col-span-1 flex items-start">
								<ShortcutItem {shortcut} {isMac} />
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</Modal>

<style>
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.tabs::-webkit-scrollbar {
		display: none;
	}

	.tabs {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
