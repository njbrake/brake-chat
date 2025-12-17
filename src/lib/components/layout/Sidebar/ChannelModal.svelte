<script lang="ts">
	import { deleteChannelById } from '$lib/apis/channels';

	import Spinner from '$lib/components/common/Spinner.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import AccessControl from '$lib/components/workspace/common/AccessControl.svelte';
	import DeleteConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';

	import { toast } from 'svelte-sonner';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	export let show = false;
	export let onSubmit: Function = () => {};
	export let onUpdate: Function = () => {};

	export let channel = null;
	export let edit = false;

	let name = '';
	let accessControl = {};

	let loading = false;

	$: if (name) {
		name = name.replace(/\s/g, '-').toLocaleLowerCase();
	}

	const submitHandler = async () => {
		loading = true;
		await onSubmit({
			name: name.replace(/\s/g, '-'),
			access_control: accessControl
		});
		show = false;
		loading = false;
	};

	const init = () => {
		name = channel.name;
		accessControl = channel.access_control;
	};

	$: if (show) {
		if (channel) {
			init();
		}
	} else {
		resetHandler();
	}

	let showDeleteConfirmDialog = false;

	const deleteHandler = async () => {
		showDeleteConfirmDialog = false;

		const res = await deleteChannelById(localStorage.token, channel.id).catch((error) => {
			toast.error(error.message);
		});

		if (res) {
			toast.success('Channel deleted successfully');
			onUpdate();

			if ($page.url.pathname === `/channels/${channel.id}`) {
				goto('/');
			}
		}

		show = false;
	};

	const resetHandler = () => {
		name = '';
		accessControl = {};
		loading = false;
	};
</script>

<Modal size="sm" bind:show>
	<div>
		<div class=" flex justify-between dark:text-gray-300 px-5 pt-4 pb-1">
			<div class=" text-lg font-medium self-center">
				{#if edit}
					{'Edit Channel'}
				{:else}
					{'Create Channel'}
				{/if}
			</div>
			<button
				class="self-center"
				on:click={() => {
					show = false;
				}}
			>
				<XMark className={'size-5'} />
			</button>
		</div>

		<div class="flex flex-col md:flex-row w-full px-5 pb-4 md:space-x-4 dark:text-gray-200">
			<div class=" flex flex-col w-full sm:flex-row sm:justify-center sm:space-x-6">
				<form
					class="flex flex-col w-full"
					on:submit|preventDefault={() => {
						submitHandler();
					}}
				>
					<div class="flex flex-col w-full mt-2">
						<div class=" mb-1 text-xs text-gray-500">{'Channel Name'}</div>

						<div class="flex-1">
							<input
								class="w-full text-sm bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-700 outline-hidden"
								type="text"
								bind:value={name}
								placeholder={'new-channel'}
								autocomplete="off"
							/>
						</div>
					</div>

					<hr class=" border-gray-100 dark:border-gray-700/10 my-2.5 w-full" />

					<div class="my-2 -mx-2">
						<div class="px-4 py-3 bg-gray-50 dark:bg-gray-950 rounded-3xl">
							<AccessControl bind:accessControl accessRoles={['read', 'write']} />
						</div>
					</div>

					<div class="flex justify-end pt-3 text-sm font-medium gap-1.5">
						{#if edit}
							<button
								class="px-3.5 py-1.5 text-sm font-medium dark:bg-black dark:hover:bg-black/90 dark:text-white bg-white text-black hover:bg-gray-100 transition rounded-full flex flex-row space-x-1 items-center"
								type="button"
								on:click={() => {
									showDeleteConfirmDialog = true;
								}}
							>
								{'Delete'}
							</button>
						{/if}

						<button
							class="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-950 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full flex flex-row space-x-1 items-center {loading
								? ' cursor-not-allowed'
								: ''}"
							type="submit"
							disabled={loading}
						>
							{#if edit}
								{'Update'}
							{:else}
								{'Create'}
							{/if}

							{#if loading}
								<div class="ml-2 self-center">
									<Spinner />
								</div>
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</Modal>

<DeleteConfirmDialog
	bind:show={showDeleteConfirmDialog}
	message={'Are you sure you want to delete this channel?'}
	confirmLabel={'Delete'}
	on:confirm={() => {
		deleteHandler();
	}}
/>
