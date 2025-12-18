<script lang="ts">
	import Checkbox from '$lib/components/common/Checkbox.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { marked } from 'marked';
	const capabilityLabels = {
		vision: {
			label: 'Vision',
			description: 'Model accepts image inputs'
		},
		file_upload: {
			label: 'File Upload',
			description: 'Model accepts file inputs'
		},
		image_generation: {
			label: 'Image Generation',
			description: 'Model can generate images based on text prompts'
		},
		usage: {
			label: 'Usage',
			description:
				'Sends `stream_options: { include_usage: true }` in the request.\nSupported providers will return token usage information in the response when set.'
		},
		citations: {
			label: 'Citations',
			description: 'Displays citations in the response'
		},
		status_updates: {
			label: 'Status Updates',
			description: 'Displays status updates (e.g., web search progress) in the response'
		}
	};

	export let capabilities: {
		vision?: boolean;
		file_upload?: boolean;
		image_generation?: boolean;
		usage?: boolean;
		citations?: boolean;
		status_updates?: boolean;
	} = {};
</script>

<div>
	<div class="flex w-full justify-between mb-1">
		<div class=" self-center text-sm font-medium">{'Capabilities'}</div>
	</div>
	<div class="flex items-center mt-2 flex-wrap">
		{#each Object.keys(capabilityLabels) as capability}
			<div class=" flex items-center gap-2 mr-3">
				<Checkbox
					state={capabilities[capability] ? 'checked' : 'unchecked'}
					on:change={(e) => {
						capabilities[capability] = e.detail === 'checked';
					}}
				/>

				<div class=" py-0.5 text-sm capitalize">
					<Tooltip content={marked.parse(capabilityLabels[capability].description)}>
						{capabilityLabels[capability].label}
					</Tooltip>
				</div>
			</div>
		{/each}
	</div>
</div>
