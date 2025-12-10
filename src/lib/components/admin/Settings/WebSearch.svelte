<script lang="ts">
	import { getRAGConfig, updateRAGConfig } from '$lib/apis/retrieval';
	import Switch from '$lib/components/common/Switch.svelte';

	import { models } from '$lib/stores';
	import { onMount, getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import SensitiveInput from '$lib/components/common/SensitiveInput.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	export let saveHandler: Function;

	let webSearchEngines = [
		'perplexity_search',
		'searxng',
		'yacy',
		'google_pse',
		'brave',
		'kagi',
		'mojeek',
		'bocha',
		'serpstack',
		'serper',
		'serply',
		'searchapi',
		'serpapi',
		'duckduckgo',
		'tavily',
		'jina',
		'bing',
		'exa',
		'perplexity',
		'sougou',
		'firecrawl',
		'external'
	];
	let webLoaderEngines = ['playwright', 'firecrawl', 'tavily', 'external'];

	let webConfig = null;

	const submitHandler = async () => {
		// Convert domain filter string to array before sending
		if (webConfig.WEB_SEARCH_DOMAIN_FILTER_LIST) {
			webConfig.WEB_SEARCH_DOMAIN_FILTER_LIST = webConfig.WEB_SEARCH_DOMAIN_FILTER_LIST.split(',')
				.map((domain) => domain.trim())
				.filter((domain) => domain.length > 0);
		} else {
			webConfig.WEB_SEARCH_DOMAIN_FILTER_LIST = [];
		}

		// Convert Youtube loader language string to array before sending
		if (webConfig.YOUTUBE_LOADER_LANGUAGE) {
			webConfig.YOUTUBE_LOADER_LANGUAGE = webConfig.YOUTUBE_LOADER_LANGUAGE.split(',')
				.map((lang) => lang.trim())
				.filter((lang) => lang.length > 0);
		} else {
			webConfig.YOUTUBE_LOADER_LANGUAGE = [];
		}

		const res = await updateRAGConfig(localStorage.token, {
			web: webConfig
		});

		webConfig.WEB_SEARCH_DOMAIN_FILTER_LIST = webConfig.WEB_SEARCH_DOMAIN_FILTER_LIST.join(',');
		webConfig.YOUTUBE_LOADER_LANGUAGE = webConfig.YOUTUBE_LOADER_LANGUAGE.join(',');
	};

	onMount(async () => {
		const res = await getRAGConfig(localStorage.token);

		if (res) {
			webConfig = res.web;

			// Convert array back to comma-separated string for display
			if (webConfig?.WEB_SEARCH_DOMAIN_FILTER_LIST) {
				webConfig.WEB_SEARCH_DOMAIN_FILTER_LIST = webConfig.WEB_SEARCH_DOMAIN_FILTER_LIST.join(',');
			}

			webConfig.YOUTUBE_LOADER_LANGUAGE = webConfig.YOUTUBE_LOADER_LANGUAGE.join(',');
		}
	});
</script>

<form
	class="flex flex-col h-full justify-between space-y-3 text-sm"
	on:submit|preventDefault={async () => {
		await submitHandler();
		saveHandler();
	}}
>
	<div class=" space-y-3 overflow-y-scroll scrollbar-hidden h-full">
		{#if webConfig}
			<div class="">
				<div class="mb-3">
					<div class=" mt-0.5 mb-2.5 text-base font-medium">{'General'}</div>

					<hr class=" border-gray-100 dark:border-gray-850 my-2" />

					<div class="  mb-2.5 flex w-full justify-between">
						<div class=" self-center text-xs font-medium">
							{'Web Search'}
						</div>
						<div class="flex items-center relative">
							<Switch bind:state={webConfig.ENABLE_WEB_SEARCH} />
						</div>
					</div>

					<div class="  mb-2.5 flex w-full justify-between">
						<div class=" self-center text-xs font-medium">
							{'Web Search Engine'}
						</div>
						<div class="flex items-center relative">
							<select
								class="dark:bg-gray-900 w-fit pr-8 rounded-sm px-2 p-1 text-xs bg-transparent outline-hidden text-right"
								bind:value={webConfig.WEB_SEARCH_ENGINE}
								placeholder={'Select a engine'}
								required
							>
								<option disabled selected value="">{'Select a engine'}</option>
								{#each webSearchEngines as engine}
									{#if engine === 'duckduckgo' || engine === 'ddgs'}
										<option value={engine}>DDGS</option>
									{:else}
										<option value={engine}>{engine}</option>
									{/if}
								{/each}
							</select>
						</div>
					</div>

					{#if webConfig.WEB_SEARCH_ENGINE !== ''}
						{#if webConfig.WEB_SEARCH_ENGINE === 'perplexity_search'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Perplexity Search API URL'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<input
												class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
												type="text"
												placeholder={'Enter Perplexity Search API URL'}
												bind:value={webConfig.PERPLEXITY_SEARCH_API_URL}
												autocomplete="off"
											/>
										</div>
									</div>
								</div>
							</div>

							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Perplexity API Key'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<SensitiveInput
												placeholder={'Enter Perplexity API Key'}
												bind:value={webConfig.PERPLEXITY_API_KEY}
											/>
										</div>
									</div>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'searxng'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Searxng Query URL'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<input
												class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
												type="text"
												placeholder={'Enter Searxng Query URL'}
												bind:value={webConfig.SEARXNG_QUERY_URL}
												autocomplete="off"
												required
											/>
										</div>
									</div>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'yacy'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Yacy Instance URL'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<input
												class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
												type="text"
												placeholder={'Enter Yacy URL (e.g. http://yacy.example.com:8090)'}
												bind:value={webConfig.YACY_QUERY_URL}
												autocomplete="off"
											/>
										</div>
									</div>
								</div>
							</div>
							<div class="mb-2.5 flex w-full flex-col">
								<div class="flex gap-2">
									<div class="w-full">
										<div class=" self-center text-xs font-medium mb-1">
											{'Yacy Username'}
										</div>

										<input
											class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
											placeholder={'Enter Yacy Username'}
											bind:value={webConfig.YACY_USERNAME}
											required
										/>
									</div>

									<div class="w-full">
										<div class=" self-center text-xs font-medium mb-1">
											{'Yacy Password'}
										</div>

										<SensitiveInput
											placeholder={'Enter Yacy Password'}
											bind:value={webConfig.YACY_PASSWORD}
										/>
									</div>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'google_pse'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Google PSE API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Google PSE API Key'}
										bind:value={webConfig.GOOGLE_PSE_API_KEY}
									/>
								</div>
								<div class="mt-1.5">
									<div class=" self-center text-xs font-medium mb-1">
										{'Google PSE Engine Id'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<input
												class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
												type="text"
												placeholder={'Enter Google PSE Engine Id'}
												bind:value={webConfig.GOOGLE_PSE_ENGINE_ID}
												autocomplete="off"
											/>
										</div>
									</div>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'brave'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Brave Search API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Brave Search API Key'}
										bind:value={webConfig.BRAVE_SEARCH_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'kagi'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Kagi Search API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Kagi Search API Key'}
										bind:value={webConfig.KAGI_SEARCH_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'mojeek'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Mojeek Search API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Mojeek Search API Key'}
										bind:value={webConfig.MOJEEK_SEARCH_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'bocha'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Bocha Search API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Bocha Search API Key'}
										bind:value={webConfig.BOCHA_SEARCH_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'serpstack'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Serpstack API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Serpstack API Key'}
										bind:value={webConfig.SERPSTACK_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'serper'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Serper API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Serper API Key'}
										bind:value={webConfig.SERPER_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'serply'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Serply API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Serply API Key'}
										bind:value={webConfig.SERPLY_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'tavily'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Tavily API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Tavily API Key'}
										bind:value={webConfig.TAVILY_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'searchapi'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'SearchApi API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter SearchApi API Key'}
										bind:value={webConfig.SEARCHAPI_API_KEY}
									/>
								</div>
								<div class="mt-1.5">
									<div class=" self-center text-xs font-medium mb-1">
										{'SearchApi Engine'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<input
												class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
												type="text"
												placeholder={'Enter SearchApi Engine'}
												bind:value={webConfig.SEARCHAPI_ENGINE}
												autocomplete="off"
											/>
										</div>
									</div>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'serpapi'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'SerpApi API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter SerpApi API Key'}
										bind:value={webConfig.SERPAPI_API_KEY}
									/>
								</div>
								<div class="mt-1.5">
									<div class=" self-center text-xs font-medium mb-1">
										{'SerpApi Engine'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<input
												class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
												type="text"
												placeholder={'Enter SerpApi Engine'}
												bind:value={webConfig.SERPAPI_ENGINE}
												autocomplete="off"
											/>
										</div>
									</div>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'jina'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Jina API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Jina API Key'}
										bind:value={webConfig.JINA_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'bing'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Bing Search V7 Endpoint'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<input
												class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
												type="text"
												placeholder={'Enter Bing Search V7 Endpoint'}
												bind:value={webConfig.BING_SEARCH_V7_ENDPOINT}
												autocomplete="off"
											/>
										</div>
									</div>
								</div>

								<div class="mt-2">
									<div class=" self-center text-xs font-medium mb-1">
										{'Bing Search V7 Subscription Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Bing Search V7 Subscription Key'}
										bind:value={webConfig.BING_SEARCH_V7_SUBSCRIPTION_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'exa'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Exa API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Exa API Key'}
										bind:value={webConfig.EXA_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'perplexity'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Perplexity API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Perplexity API Key'}
										bind:value={webConfig.PERPLEXITY_API_KEY}
									/>
								</div>
							</div>

							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class="self-center text-xs font-medium mb-1">
										{'Perplexity Model'}
									</div>
									<input
										list="perplexity-model-list"
										class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
										bind:value={webConfig.PERPLEXITY_MODEL}
									/>

									<datalist id="perplexity-model-list">
										<option value="sonar">{'Sonar'}</option>
										<option value="sonar-pro">{'Sonar Pro'}</option>
										<option value="sonar-reasoning">{'Sonar Reasoning'}</option>
										<option value="sonar-reasoning-pro">{'Sonar Reasoning Pro'}</option>
										<option value="sonar-deep-research">{'Sonar Deep Research'}</option>
									</datalist>
								</div>
							</div>

							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Perplexity Search Context Usage'}
									</div>
									<select
										class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
										bind:value={webConfig.PERPLEXITY_SEARCH_CONTEXT_USAGE}
									>
										<option value="low">{'Low'}</option>
										<option value="medium">{'Medium'}</option>
										<option value="high">{'High'}</option>
									</select>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'sougou'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Sougou Search API sID'}
									</div>

									<SensitiveInput
										placeholder={'Enter Sougou Search API sID'}
										bind:value={webConfig.SOUGOU_API_SID}
									/>
								</div>
							</div>
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Sougou Search API SK'}
									</div>

									<SensitiveInput
										placeholder={'Enter Sougou Search API SK'}
										bind:value={webConfig.SOUGOU_API_SK}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'firecrawl'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'Firecrawl API Base URL'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<input
												class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
												type="text"
												placeholder={'Enter Firecrawl API Base URL'}
												bind:value={webConfig.FIRECRAWL_API_BASE_URL}
												autocomplete="off"
											/>
										</div>
									</div>
								</div>

								<div class="mt-2">
									<div class=" self-center text-xs font-medium mb-1">
										{'Firecrawl API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Firecrawl API Key'}
										bind:value={webConfig.FIRECRAWL_API_KEY}
									/>
								</div>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'ddgs' || webConfig.WEB_SEARCH_ENGINE === 'duckduckgo'}
							<div class="w-full mb-2.5">
								<div class=" self-center text-xs font-medium mb-1">
									{'Concurrent Requests'}
								</div>

								<input
									class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
									placeholder={'Concurrent Requests'}
									bind:value={webConfig.WEB_SEARCH_CONCURRENT_REQUESTS}
									required
								/>
							</div>
						{:else if webConfig.WEB_SEARCH_ENGINE === 'external'}
							<div class="mb-2.5 flex w-full flex-col">
								<div>
									<div class=" self-center text-xs font-medium mb-1">
										{'External Web Search URL'}
									</div>

									<div class="flex w-full">
										<div class="flex-1">
											<input
												class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
												type="text"
												placeholder={'Enter External Web Search URL'}
												bind:value={webConfig.EXTERNAL_WEB_SEARCH_URL}
												autocomplete="off"
											/>
										</div>
									</div>
								</div>

								<div class="mt-2">
									<div class=" self-center text-xs font-medium mb-1">
										{'External Web Search API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter External Web Search API Key'}
										bind:value={webConfig.EXTERNAL_WEB_SEARCH_API_KEY}
									/>
								</div>
							</div>
						{/if}
					{/if}

					{#if webConfig.ENABLE_WEB_SEARCH}
						<div class="mb-2.5 flex w-full flex-col">
							<div class="flex gap-2">
								<div class="w-full">
									<div class=" self-center text-xs font-medium mb-1">
										{'Search Result Count'}
									</div>

									<input
										class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
										placeholder={'Search Result Count'}
										bind:value={webConfig.WEB_SEARCH_RESULT_COUNT}
										required
									/>
								</div>
							</div>
						</div>

						<div class="mb-2.5 flex w-full flex-col">
							<div class="  text-xs font-medium mb-1">
								{'Domain Filter List'}
							</div>

							<input
								class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
								placeholder={'Enter domains separated by commas (e.g., example.com,site.org,!excludedsite.com)'}
								bind:value={webConfig.WEB_SEARCH_DOMAIN_FILTER_LIST}
							/>
						</div>
					{/if}

					<div class="  mb-2.5 flex w-full justify-between">
						<div class=" self-center text-xs font-medium">
							<Tooltip content={'Full Context Mode'} placement="top-start">
								{'Bypass Embedding and Retrieval'}
							</Tooltip>
						</div>
						<div class="flex items-center relative">
							<Tooltip
								content={webConfig.BYPASS_WEB_SEARCH_EMBEDDING_AND_RETRIEVAL
									? 'Inject the entire content as context for comprehensive processing, this is recommended for complex queries.'
									: 'Default to segmented retrieval for focused and relevant content extraction, this is recommended for most cases.'}
							>
								<Switch bind:state={webConfig.BYPASS_WEB_SEARCH_EMBEDDING_AND_RETRIEVAL} />
							</Tooltip>
						</div>
					</div>

					<div class="  mb-2.5 flex w-full justify-between">
						<div class=" self-center text-xs font-medium">
							<Tooltip content={'Bypass Web Loader'} placement="top-start">
								{'Bypass Web Loader'}
							</Tooltip>
						</div>
						<div class="flex items-center relative">
							<Tooltip content={''}>
								<Switch bind:state={webConfig.BYPASS_WEB_SEARCH_WEB_LOADER} />
							</Tooltip>
						</div>
					</div>

					<div class="  mb-2.5 flex w-full justify-between">
						<div class=" self-center text-xs font-medium">
							{'Trust Proxy Environment'}
						</div>
						<div class="flex items-center relative">
							<Tooltip
								content={webConfig.WEB_SEARCH_TRUST_ENV
									? 'Use proxy designated by http_proxy and https_proxy environment variables to fetch page contents.'
									: 'Use no proxy to fetch page contents.'}
							>
								<Switch bind:state={webConfig.WEB_SEARCH_TRUST_ENV} />
							</Tooltip>
						</div>
					</div>
				</div>

				<div class="mb-3">
					<div class=" mt-0.5 mb-2.5 text-base font-medium">{'Loader'}</div>

					<hr class=" border-gray-100 dark:border-gray-850 my-2" />

					<div class="  mb-2.5 flex w-full justify-between">
						<div class=" self-center text-xs font-medium">
							{'Web Loader Engine'}
						</div>
						<div class="flex items-center relative">
							<select
								class="dark:bg-gray-900 w-fit pr-8 rounded-sm px-2 p-1 text-xs bg-transparent outline-hidden text-right"
								bind:value={webConfig.WEB_LOADER_ENGINE}
								placeholder={'Select a engine'}
							>
								<option value="">{'Default'}</option>
								{#each webLoaderEngines as engine}
									<option value={engine}>{engine}</option>
								{/each}
							</select>
						</div>
					</div>

					{#if webConfig.WEB_LOADER_ENGINE === '' || webConfig.WEB_LOADER_ENGINE === 'safe_web'}
						<div class="  mb-2.5 flex w-full justify-between">
							<div class=" self-center text-xs font-medium">
								{'Verify SSL Certificate'}
							</div>
							<div class="flex items-center relative">
								<Switch bind:state={webConfig.ENABLE_WEB_LOADER_SSL_VERIFICATION} />
							</div>
						</div>
					{:else if webConfig.WEB_LOADER_ENGINE === 'playwright'}
						<div class="mb-2.5 flex w-full flex-col">
							<div>
								<div class=" self-center text-xs font-medium mb-1">
									{'Playwright WebSocket URL'}
								</div>

								<div class="flex w-full">
									<div class="flex-1">
										<input
											class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
											type="text"
											placeholder={'Enter Playwright WebSocket URL'}
											bind:value={webConfig.PLAYWRIGHT_WS_URL}
											autocomplete="off"
										/>
									</div>
								</div>
							</div>

							<div class="mt-2">
								<div class=" self-center text-xs font-medium mb-1">
									{'Playwright Timeout (ms)'}
								</div>

								<div class="flex w-full">
									<div class="flex-1">
										<input
											class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
											placeholder={'Enter Playwright Timeout'}
											bind:value={webConfig.PLAYWRIGHT_TIMEOUT}
											autocomplete="off"
										/>
									</div>
								</div>
							</div>
						</div>
					{:else if webConfig.WEB_LOADER_ENGINE === 'firecrawl' && webConfig.WEB_SEARCH_ENGINE !== 'firecrawl'}
						<div class="mb-2.5 flex w-full flex-col">
							<div>
								<div class=" self-center text-xs font-medium mb-1">
									{'Firecrawl API Base URL'}
								</div>

								<div class="flex w-full">
									<div class="flex-1">
										<input
											class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
											type="text"
											placeholder={'Enter Firecrawl API Base URL'}
											bind:value={webConfig.FIRECRAWL_API_BASE_URL}
											autocomplete="off"
										/>
									</div>
								</div>
							</div>

							<div class="mt-2">
								<div class=" self-center text-xs font-medium mb-1">
									{'Firecrawl API Key'}
								</div>

								<SensitiveInput
									placeholder={'Enter Firecrawl API Key'}
									bind:value={webConfig.FIRECRAWL_API_KEY}
								/>
							</div>
						</div>
					{:else if webConfig.WEB_LOADER_ENGINE === 'tavily'}
						<div class="mb-2.5 flex w-full flex-col">
							<div>
								<div class=" self-center text-xs font-medium mb-1">
									{'Tavily Extract Depth'}
								</div>

								<div class="flex w-full">
									<div class="flex-1">
										<input
											class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
											type="text"
											placeholder={'Enter Tavily Extract Depth'}
											bind:value={webConfig.TAVILY_EXTRACT_DEPTH}
											autocomplete="off"
										/>
									</div>
								</div>
							</div>

							{#if webConfig.WEB_SEARCH_ENGINE !== 'tavily'}
								<div class="mt-2">
									<div class=" self-center text-xs font-medium mb-1">
										{'Tavily API Key'}
									</div>

									<SensitiveInput
										placeholder={'Enter Tavily API Key'}
										bind:value={webConfig.TAVILY_API_KEY}
									/>
								</div>
							{/if}
						</div>
					{:else if webConfig.WEB_LOADER_ENGINE === 'external'}
						<div class="mb-2.5 flex w-full flex-col">
							<div>
								<div class=" self-center text-xs font-medium mb-1">
									{'External Web Loader URL'}
								</div>

								<div class="flex w-full">
									<div class="flex-1">
										<input
											class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
											type="text"
											placeholder={'Enter External Web Loader URL'}
											bind:value={webConfig.EXTERNAL_WEB_LOADER_URL}
											autocomplete="off"
										/>
									</div>
								</div>
							</div>

							<div class="mt-2">
								<div class=" self-center text-xs font-medium mb-1">
									{'External Web Loader API Key'}
								</div>

								<SensitiveInput
									placeholder={'Enter External Web Loader API Key'}
									bind:value={webConfig.EXTERNAL_WEB_LOADER_API_KEY}
								/>
							</div>
						</div>
					{/if}

					<div class="mb-2.5 w-full">
						<div class=" self-center text-xs font-medium mb-1">
							{'Concurrent Requests'}
						</div>

						<input
							class="w-full rounded-lg py-2 px-4 text-sm bg-gray-50 dark:text-gray-300 dark:bg-gray-850 outline-hidden"
							placeholder={'Concurrent Requests'}
							bind:value={webConfig.WEB_LOADER_CONCURRENT_REQUESTS}
							required
						/>
					</div>

					<div class="  mb-2.5 flex w-full justify-between">
						<div class=" self-center text-xs font-medium">
							{'Youtube Language'}
						</div>
						<div class="flex items-center relative">
							<input
								class="flex-1 w-full rounded-lg text-sm bg-transparent outline-hidden"
								type="text"
								placeholder={'Enter language codes'}
								bind:value={webConfig.YOUTUBE_LOADER_LANGUAGE}
								autocomplete="off"
							/>
						</div>
					</div>

					<div class="  mb-2.5 flex flex-col w-full justify-between">
						<div class=" mb-1 text-xs font-medium">
							{'Youtube Proxy URL'}
						</div>
						<div class="flex items-center relative">
							<input
								class="flex-1 w-full rounded-lg text-sm bg-transparent outline-hidden"
								type="text"
								placeholder={'Enter proxy URL (e.g. https://user:password@host:port)'}
								bind:value={webConfig.YOUTUBE_LOADER_PROXY_URL}
								autocomplete="off"
							/>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<div class="flex justify-end pt-3 text-sm font-medium">
		<button
			class="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full"
			type="submit"
		>
			{'Save'}
		</button>
	</div>
</form>
