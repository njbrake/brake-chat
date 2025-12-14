<script lang="ts">
        import { toast } from 'svelte-sonner';
        import { createEventDispatcher, onMount } from 'svelte';

        import { settings, config } from '$lib/stores';
        import { getVoices as _getVoices } from '$lib/apis/audio';

        import Switch from '$lib/components/common/Switch.svelte';
        import Tooltip from '$lib/components/common/Tooltip.svelte';
        const dispatch = createEventDispatcher();
        export let saveSettings: Function;

        // Audio
        let conversationMode = false;
        let speechAutoSend = false;
        let responseAutoPlayback = false;
        let nonLocalVoices = false;

        let STTEngine = '';
        let STTLanguage = '';

        let voices = [];
        let voice = '';

        // Audio speed control
        let playbackRate = 1;

        const getVoices = async () => {
                if ($config.audio.tts.engine === '') {
                        const getVoicesLoop = setInterval(async () => {
                                voices = await speechSynthesis.getVoices();

                                if (voices.length > 0) {
                                        clearInterval(getVoicesLoop);
                                }
                        }, 100);
                } else {
                        const res = await _getVoices(localStorage.token).catch((e) => {
                                toast.error(`${e}`);
                        });

                        if (res) {
                                voices = res.voices;
                        }
                }
        };

        const toggleResponseAutoPlayback = async () => {
                responseAutoPlayback = !responseAutoPlayback;
                saveSettings({ responseAutoPlayback: responseAutoPlayback });
        };

        const toggleSpeechAutoSend = async () => {
                speechAutoSend = !speechAutoSend;
                saveSettings({ speechAutoSend: speechAutoSend });
        };

        onMount(async () => {
                playbackRate = $settings.audio?.tts?.playbackRate ?? 1;
                conversationMode = $settings.conversationMode ?? false;
                speechAutoSend = $settings.speechAutoSend ?? false;
                responseAutoPlayback = $settings.responseAutoPlayback ?? false;

                STTEngine = $settings?.audio?.stt?.engine ?? '';
                STTLanguage = $settings?.audio?.stt?.language ?? '';

                if ($settings?.audio?.tts?.defaultVoice === $config.audio.tts.voice) {
                        voice = $settings?.audio?.tts?.voice ?? $config.audio.tts.voice ?? '';
                } else {
                        voice = $config.audio.tts.voice ?? '';
                }

                nonLocalVoices = $settings.audio?.tts?.nonLocalVoices ?? false;

                await getVoices();
        });

        $: if ($settings?.audio?.tts?.engine === 'browser-kokoro') {
                saveSettings({
                        audio: {
                                tts: {
                                        engine: undefined
                                }
                        }
                });
        }
</script>

<form
	id="tab-audio"
	class="flex flex-col h-full justify-between space-y-3 text-sm"
	on:submit|preventDefault={async () => {
		saveSettings({
			audio: {
				stt: {
					engine: STTEngine !== '' ? STTEngine : undefined,
					language: STTLanguage !== '' ? STTLanguage : undefined
				},
                                tts: {
                                        playbackRate: playbackRate,
                                        voice: voice !== '' ? voice : undefined,
                                        defaultVoice: $config?.audio?.tts?.voice ?? '',
                                        nonLocalVoices: $config.audio.tts.engine === '' ? nonLocalVoices : undefined
                                }
			}
		});
		dispatch('save');
	}}
>
	<div class=" space-y-3 overflow-y-scroll max-h-[28rem] md:max-h-full">
		<div>
			<div class=" mb-1 text-sm font-medium">{'STT Settings'}</div>

			{#if $config.audio.stt.engine !== 'web'}
				<div class=" py-0.5 flex w-full justify-between">
					<div class=" self-center text-xs font-medium">{'Speech-to-Text Engine'}</div>
					<div class="flex items-center relative">
						<select
							class="dark:bg-gray-900 w-fit pr-8 rounded-sm px-2 p-1 text-xs bg-transparent outline-hidden text-right"
							bind:value={STTEngine}
							placeholder={'Select an engine'}
						>
							<option value="">{'Default'}</option>
							<option value="web">{'Web API'}</option>
						</select>
					</div>
				</div>

				<div class=" py-0.5 flex w-full justify-between">
					<div class=" self-center text-xs font-medium">{'Language'}</div>

					<div class="flex items-center relative text-xs px-3">
						<Tooltip
							content={'The language of the input audio. Supplying the input language in ISO-639-1 (e.g. en) format will improve accuracy and latency. Leave blank to automatically detect the language.'}
							placement="top"
						>
							<input
								type="text"
								bind:value={STTLanguage}
								placeholder={'e.g. en'}
								class=" text-sm text-right bg-transparent dark:text-gray-300 outline-hidden"
							/>
						</Tooltip>
					</div>
				</div>
			{/if}

			<div class=" py-0.5 flex w-full justify-between">
				<div class=" self-center text-xs font-medium">
					{'Instant Auto-Send After Voice Transcription'}
				</div>

				<button
					class="p-1 px-3 text-xs flex rounded-sm transition"
					on:click={() => {
						toggleSpeechAutoSend();
					}}
					type="button"
				>
					{#if speechAutoSend === true}
						<span class="ml-2 self-center">{'On'}</span>
					{:else}
						<span class="ml-2 self-center">{'Off'}</span>
					{/if}
				</button>
			</div>
		</div>

		<div>
			<div class=" mb-1 text-sm font-medium">{'TTS Settings'}</div>

			<div class=" py-0.5 flex w-full justify-between">
				<div class=" self-center text-xs font-medium">{'Auto-playback response'}</div>

				<button
					class="p-1 px-3 text-xs flex rounded-sm transition"
					on:click={() => {
						toggleResponseAutoPlayback();
					}}
					type="button"
				>
					{#if responseAutoPlayback === true}
						<span class="ml-2 self-center">{'On'}</span>
					{:else}
						<span class="ml-2 self-center">{'Off'}</span>
					{/if}
				</button>
			</div>

                        <div class=" py-0.5 flex w-full justify-between">
                                <div class=" self-center text-xs font-medium">{'Speech Playback Speed'}</div>

                                <div class="flex items-center relative text-xs px-3">
                                        <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                bind:value={playbackRate}
                                                class=" text-sm text-right bg-transparent dark:text-gray-300 outline-hidden"
                                        />
                                        x
                                </div>
                        </div>
                </div>

                <hr class=" border-gray-100 dark:border-gray-850" />

                {#if $config.audio.tts.engine === ''}
                        <div>
                                <div class=" mb-2.5 text-sm font-medium">{'Set Voice'}</div>
                                <div class="flex w-full">
                                        <div class="flex-1">
                                                <select
                                                        class="w-full text-sm bg-transparent dark:text-gray-300 outline-hidden"
                                                        bind:value={voice}
                                                >
                                                        <option value="" selected={voice !== ''}>{'Default'}</option>
                                                        {#each voices.filter((v) => nonLocalVoices || v.localService === true) as _voice}
                                                                <option
                                                                        value={_voice.name}
                                                                        class="bg-gray-100 dark:bg-gray-700"
                                                                        selected={voice === _voice.name}>{_voice.name}</option>
                                                        {/each}
                                                </select>
                                        </div>
                                </div>
                                <div class="flex items-center justify-between my-1.5">
                                        <div class="text-xs">
                                                {'Allow non-local voices'}
                                        </div>

                                        <div class="mt-1">
                                                <Switch bind:state={nonLocalVoices} />
                                        </div>
                                </div>
                        </div>
                {:else}
                        <div>
                                <div class=" mb-2.5 text-sm font-medium">{'Set Voice'}</div>
                                <div class="flex w-full">
                                        <div class="flex-1">
                                                <input
                                                        list="voice-list"
                                                        class="w-full text-sm bg-transparent dark:text-gray-300 outline-hidden"
                                                        bind:value={voice}
                                                        placeholder={'Select a voice'}
                                                />

                                                <datalist id="voice-list">
                                                        {#each voices as voice}
                                                                <option value={voice.id}>{voice.name}</option>
                                                        {/each}
                                                </datalist>
                                        </div>
                                </div>
                        </div>
                {/if}
        </div>

	<div class="flex justify-end text-sm font-medium">
		<button
			class="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full"
			type="submit"
		>
			{'Save'}
		</button>
	</div>
</form>
