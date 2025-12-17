<script lang="ts">
	import Textarea from '$lib/components/common/Textarea.svelte';
	import Switch from '$lib/components/common/Switch.svelte';
	export let name = '';
	export let color = '';
	export let description = '';
	export let data = {};

	export let edit = false;
	export let onDelete: Function = () => {};
</script>

<div class="flex gap-2">
	<div class="flex flex-col w-full">
		<div class=" mb-0.5 text-xs text-gray-500">{'Name'}</div>

		<div class="flex-1">
			<input
				class="w-full text-sm bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-700 outline-hidden"
				type="text"
				bind:value={name}
				placeholder={'Group Name'}
				autocomplete="off"
				required
			/>
		</div>
	</div>
</div>

<!-- <div class="flex flex-col w-full mt-2">
	<div class=" mb-1 text-xs text-gray-500">{'Color'}</div>

	<div class="flex-1">
		<Tooltip content={'Hex Color - Leave empty for default color'} placement="top-start">
			<div class="flex gap-0.5">
				<div class="text-gray-500">#</div>

				<input
					class="w-full text-sm bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-700 outline-hidden"
					type="text"
					bind:value={color}
					placeholder={'Hex Color'}
					autocomplete="off"
				/>
			</div>
		</Tooltip>
	</div>
</div> -->

<div class="flex flex-col w-full mt-2">
	<div class=" mb-1 text-xs text-gray-500">{'Description'}</div>

	<div class="flex-1">
		<Textarea
			className="w-full text-sm bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-700 outline-hidden resize-none"
			rows={4}
			bind:value={description}
			placeholder={'Group Description'}
		/>
	</div>
</div>

<hr class="border-gray-50 dark:border-gray-850 my-1" />

<div class="flex flex-col w-full mt-2">
	<div class=" mb-1 text-xs text-gray-500">{'Setting'}</div>

	<div>
		<div class=" flex w-full justify-between">
			<div class=" self-center text-xs">
				{'Allow Group Sharing'}
			</div>

			<div class="flex items-center gap-2 p-1">
				<Switch
					tooltip={true}
					state={data?.config?.share ?? true}
					on:change={(e) => {
						if (data?.config?.share) {
							data.config.share = e.detail;
						} else {
							data.config = { ...(data?.config ?? {}), share: e.detail };
						}
					}}
				/>
			</div>
		</div>
	</div>
</div>

{#if edit}
	<div class="flex flex-col w-full mt-2">
		<div class=" mb-0.5 text-xs text-gray-500">{'Actions'}</div>

		<div class="flex-1">
			<button
				class="text-xs bg-transparent hover:underline cursor-pointer"
				type="button"
				on:click={() => onDelete()}
			>
				{'Delete'}
			</button>
		</div>
	</div>
{/if}
