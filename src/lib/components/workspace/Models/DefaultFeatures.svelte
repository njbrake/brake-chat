<script lang="ts">
	import { getContext } from 'svelte';
	import Checkbox from '$lib/components/common/Checkbox.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { marked } from 'marked';
	const featureLabels = {
		web_search: {
			label: 'Web Search',
			description: 'Model can search the web for information'
		},
		image_generation: {
			label: 'Image Generation',
			description: 'Model can generate images based on text prompts'
		}
	};

	export let availableFeatures = ['web_search', 'image_generation'];
	export let featureIds = [];
</script>

<div>
	<div class="flex w-full justify-between mb-1">
		<div class=" self-center text-sm font-medium">{'Default Features'}</div>
	</div>
	<div class="flex items-center mt-2 flex-wrap">
		{#each availableFeatures as feature}
			<div class=" flex items-center gap-2 mr-3">
				<Checkbox
					state={featureIds.includes(feature) ? 'checked' : 'unchecked'}
					on:change={(e) => {
						if (e.detail === 'checked') {
							featureIds = [...featureIds, feature];
						} else {
							featureIds = featureIds.filter((id) => id !== feature);
						}
					}}
				/>

				<div class=" py-0.5 text-sm capitalize">
					<Tooltip content={marked.parse(featureLabels[feature].description)}>
						{featureLabels[feature].label}
					</Tooltip>
				</div>
			</div>
		{/each}
	</div>
</div>
