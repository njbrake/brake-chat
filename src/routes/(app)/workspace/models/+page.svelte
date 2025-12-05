<script>
	import { onMount } from 'svelte';
	import { config, models, settings } from '$lib/stores';
	import { getModels } from '$lib/apis';
	import Models from '$lib/components/workspace/Models.svelte';

	onMount(async () => {
		await Promise.all([
			(async () => {
				try {
					models.set(
						await getModels(
							localStorage.token,
							$config?.features?.enable_direct_connections && ($settings?.directConnections ?? null)
						)
					);
				} catch (error) {
					console.error('Failed to load models:', error);
					models.set([]);
				}
			})()
		]);
	});
</script>

{#if $models !== null}
	<Models />
{/if}
