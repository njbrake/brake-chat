<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { onMount, getContext } from 'svelte';
	import { getCodeExecutionConfig, setCodeExecutionConfig } from '$lib/apis/configs';

	import SensitiveInput from '$lib/components/common/SensitiveInput.svelte';

	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Textarea from '$lib/components/common/Textarea.svelte';
	import Switch from '$lib/components/common/Switch.svelte';
	export let saveHandler: Function;

	let config = null;

	let engines = ['jupyter'];

	const submitHandler = async () => {
		const res = await setCodeExecutionConfig(localStorage.token, config);
	};

	onMount(async () => {
		const res = await getCodeExecutionConfig(localStorage.token);

		if (res) {
			config = res;
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
		{#if config}
			<div>
				<div class="mb-3.5">
					<div class=" mt-0.5 mb-2.5 text-base font-medium">{'General'}</div>

					<hr class=" border-gray-100 dark:border-gray-850 my-2" />

					<div class="mb-2.5">
						<div class=" flex w-full justify-between">
							<div class=" self-center text-xs font-medium">
								{'Enable Code Execution'}
							</div>

							<Switch bind:state={config.ENABLE_CODE_EXECUTION} />
						</div>
					</div>

					<div class="mb-2.5">
						<div class="flex w-full justify-between">
							<div class=" self-center text-xs font-medium">{'Code Execution Engine'}</div>
							<div class="flex items-center relative">
								<select
									class="dark:bg-gray-900 w-fit pr-8 rounded-sm px-2 p-1 text-xs bg-transparent outline-hidden text-right"
									bind:value={config.CODE_EXECUTION_ENGINE}
									placeholder={'Select a engine'}
									required
								>
									<option disabled selected value="">{'Select a engine'}</option>
									{#each engines as engine}
										<option value={engine}>{engine}</option>
									{/each}
								</select>
							</div>
						</div>

						{#if config.CODE_EXECUTION_ENGINE === 'jupyter'}
							<div class="text-gray-500 text-xs">
								{'Warning: Jupyter execution enables arbitrary code execution, posing severe security risks—proceed with extreme caution.'}
							</div>
						{/if}
					</div>

					{#if config.CODE_EXECUTION_ENGINE === 'jupyter'}
						<div class="mb-2.5 flex flex-col gap-1.5 w-full">
							<div class="text-xs font-medium">
								{'Jupyter URL'}
							</div>

							<div class="flex w-full">
								<div class="flex-1">
									<input
										class="w-full text-sm py-0.5 placeholder:text-gray-300 dark:placeholder:text-gray-700 bg-transparent outline-hidden"
										type="text"
										placeholder={'Enter Jupyter URL'}
										bind:value={config.CODE_EXECUTION_JUPYTER_URL}
										autocomplete="off"
									/>
								</div>
							</div>
						</div>

						<div class="mb-2.5 flex flex-col gap-1.5 w-full">
							<div class=" flex gap-2 w-full items-center justify-between">
								<div class="text-xs font-medium">
									{'Jupyter Auth'}
								</div>

								<div>
									<select
										class="dark:bg-gray-900 w-fit pr-8 rounded-sm px-2 p-1 text-xs bg-transparent outline-hidden text-left"
										bind:value={config.CODE_EXECUTION_JUPYTER_AUTH}
										placeholder={'Select an auth method'}
									>
										<option selected value="">{'None'}</option>
										<option value="token">{'Token'}</option>
										<option value="password">{'Password'}</option>
									</select>
								</div>
							</div>

							{#if config.CODE_EXECUTION_JUPYTER_AUTH}
								<div class="flex w-full gap-2">
									<div class="flex-1">
										{#if config.CODE_EXECUTION_JUPYTER_AUTH === 'password'}
											<SensitiveInput
												type="text"
												placeholder={'Enter Jupyter Password'}
												bind:value={config.CODE_EXECUTION_JUPYTER_AUTH_PASSWORD}
												autocomplete="off"
											/>
										{:else}
											<SensitiveInput
												type="text"
												placeholder={'Enter Jupyter Token'}
												bind:value={config.CODE_EXECUTION_JUPYTER_AUTH_TOKEN}
												autocomplete="off"
											/>
										{/if}
									</div>
								</div>
							{/if}
						</div>

						<div class="flex gap-2 w-full items-center justify-between">
							<div class="text-xs font-medium">
								{'Code Execution Timeout'}
							</div>

							<div class="">
								<Tooltip content={'Enter timeout in seconds'}>
									<input
										class="dark:bg-gray-900 w-fit rounded-sm px-2 p-1 text-xs bg-transparent outline-hidden text-right"
										type="number"
										bind:value={config.CODE_EXECUTION_JUPYTER_TIMEOUT}
										placeholder={'e.g. 60'}
										autocomplete="off"
									/>
								</Tooltip>
							</div>
						</div>
					{/if}
				</div>

				<div class="mb-3.5">
					<div class=" mt-0.5 mb-2.5 text-base font-medium">{'Code Interpreter'}</div>

					<hr class=" border-gray-100 dark:border-gray-850 my-2" />

					<div class="mb-2.5">
						<div class=" flex w-full justify-between">
							<div class=" self-center text-xs font-medium">
								{'Enable Code Interpreter'}
							</div>

							<Switch bind:state={config.ENABLE_CODE_INTERPRETER} />
						</div>
					</div>

					{#if config.ENABLE_CODE_INTERPRETER}
						<div class="mb-2.5">
							<div class="  flex w-full justify-between">
								<div class=" self-center text-xs font-medium">
									{'Code Interpreter Engine'}
								</div>
								<div class="flex items-center relative">
									<select
										class="dark:bg-gray-900 w-fit pr-8 rounded-sm px-2 p-1 text-xs bg-transparent outline-hidden text-right"
										bind:value={config.CODE_INTERPRETER_ENGINE}
										placeholder={'Select a engine'}
										required
									>
										<option disabled selected value="">{'Select a engine'}</option>
										{#each engines as engine}
											<option value={engine}>{engine}</option>
										{/each}
									</select>
								</div>
							</div>

							{#if config.CODE_INTERPRETER_ENGINE === 'jupyter'}
								<div class="text-gray-500 text-xs">
									{'Warning: Jupyter execution enables arbitrary code execution, posing severe security risks—proceed with extreme caution.'}
								</div>
							{/if}
						</div>

						{#if config.CODE_INTERPRETER_ENGINE === 'jupyter'}
							<div class="mb-2.5 flex flex-col gap-1.5 w-full">
								<div class="text-xs font-medium">
									{'Jupyter URL'}
								</div>

								<div class="flex w-full">
									<div class="flex-1">
										<input
											class="w-full text-sm py-0.5 placeholder:text-gray-300 dark:placeholder:text-gray-700 bg-transparent outline-hidden"
											type="text"
											placeholder={'Enter Jupyter URL'}
											bind:value={config.CODE_INTERPRETER_JUPYTER_URL}
											autocomplete="off"
										/>
									</div>
								</div>
							</div>

							<div class="mb-2.5 flex flex-col gap-1.5 w-full">
								<div class="flex gap-2 w-full items-center justify-between">
									<div class="text-xs font-medium">
										{'Jupyter Auth'}
									</div>

									<div>
										<select
											class="dark:bg-gray-900 w-fit pr-8 rounded-sm px-2 p-1 text-xs bg-transparent outline-hidden text-left"
											bind:value={config.CODE_INTERPRETER_JUPYTER_AUTH}
											placeholder={'Select an auth method'}
										>
											<option selected value="">{'None'}</option>
											<option value="token">{'Token'}</option>
											<option value="password">{'Password'}</option>
										</select>
									</div>
								</div>

								{#if config.CODE_INTERPRETER_JUPYTER_AUTH}
									<div class="flex w-full gap-2">
										<div class="flex-1">
											{#if config.CODE_INTERPRETER_JUPYTER_AUTH === 'password'}
												<SensitiveInput
													type="text"
													placeholder={'Enter Jupyter Password'}
													bind:value={config.CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD}
													autocomplete="off"
												/>
											{:else}
												<SensitiveInput
													type="text"
													placeholder={'Enter Jupyter Token'}
													bind:value={config.CODE_INTERPRETER_JUPYTER_AUTH_TOKEN}
													autocomplete="off"
												/>
											{/if}
										</div>
									</div>
								{/if}
							</div>

							<div class="flex gap-2 w-full items-center justify-between">
								<div class="text-xs font-medium">
									{'Code Execution Timeout'}
								</div>

								<div class="">
									<Tooltip content={'Enter timeout in seconds'}>
										<input
											class="dark:bg-gray-900 w-fit rounded-sm px-2 p-1 text-xs bg-transparent outline-hidden text-right"
											type="number"
											bind:value={config.CODE_INTERPRETER_JUPYTER_TIMEOUT}
											placeholder={'e.g. 60'}
											autocomplete="off"
										/>
									</Tooltip>
								</div>
							</div>
						{/if}

						<hr class="border-gray-100 dark:border-gray-850 my-2" />

						<div>
							<div class="py-0.5 w-full">
								<div class=" mb-2.5 text-xs font-medium">
									{'Code Interpreter Prompt Template'}
								</div>

								<Tooltip
									content={'Leave empty to use the default prompt, or enter a custom prompt'}
									placement="top-start"
								>
									<Textarea
										bind:value={config.CODE_INTERPRETER_PROMPT_TEMPLATE}
										placeholder={'Leave empty to use the default prompt, or enter a custom prompt'}
									/>
								</Tooltip>
							</div>
						</div>
					{/if}
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
