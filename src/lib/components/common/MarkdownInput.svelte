<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { onMount, createEventDispatcher, getContext, tick } from 'svelte';

	const i18n = getContext('i18n');
	const eventDispatch = createEventDispatcher();

	marked.use({
		breaks: true,
		gfm: true
	});

	export let id = '';
	export let value = '';
	export let html = '';
	export let placeholder = $i18n.t('Type here...');
	export let editable = true;
	export let className = 'input-prose';
	export let onChange = (e) => {};
	export let onSelectionUpdate = (e) => {};
	export let onFileDrop = (currentEditor, files, pos) => {};
	export let onFilePaste = (currentEditor, files, htmlContent) => {};
	export let files = [];
	export let showPreview = false;
	export let json = false;
	export let raw = false;
	export let collaboration = false;
	export let socket = null;
	export let user = null;
	export let documentId = '';
	export let dragHandle = false;
	export let link = false;
	export let image = false;
	export let fileHandler = false;
	export let richText = true;
	export let messageInput = false;
	export let shiftEnter = false;

	let textareaElement: HTMLTextAreaElement;
	let mdValue = '';
	let htmlValue = '';
	let wordCount = 0;
	let charCount = 0;

	export let editor = {
		storage: { files: files, characterCount: { words: () => wordCount, characters: () => charCount } },
		commands: {
			focus: () => focus(),
			clearContent: () => {
				mdValue = '';
				value = '';
				handleInput();
			},
			setContent: (content) => {
				if (typeof content === 'string') {
					mdValue = content;
					value = content;
				} else {
					mdValue = '';
					value = '';
				}
				handleInput();
			}
		},
		chain: () => ({
			focus: () => ({ run: () => focus() }),
			undo: () => ({ run: () => {} }),
			redo: () => ({ run: () => {} })
		}),
		can: () => ({
			undo: () => false,
			redo: () => false
		}),
		isActive: (type) => false,
		getHTML: () => htmlValue
	};

	$: if (value === null && html !== null) {
		mdValue = html;
		value = html;
	}

	$: if (value !== mdValue && value !== null) {
		mdValue = value;
	}

	$: if (files && editor) {
		editor.storage.files = files;
	}

	export const focus = () => {
		textareaElement?.focus();
	};

	export const setText = (text: string) => {
		mdValue = text;
		value = text;
		handleInput();
	};

	export const setContent = (content: string) => {
		if (typeof content === 'string') {
			mdValue = content;
			value = content;
		} else {
			mdValue = '';
			value = '';
		}
		handleInput();
	};

	export const insertContent = (content: string) => {
		const start = textareaElement?.selectionStart || 0;
		const end = textareaElement?.selectionEnd || 0;
		const newValue = mdValue.slice(0, start) + content + mdValue.slice(end);
		mdValue = newValue;
		value = newValue;
		handleInput();
		tick().then(() => {
			if (textareaElement) {
				textareaElement.selectionStart = textareaElement.selectionEnd = start + content.length;
				textareaElement.focus();
			}
		});
	};

	export const getWordAtDocPos = () => {
		if (!textareaElement) return '';
		const pos = textareaElement.selectionStart;
		const text = mdValue;
		let start = pos;
		let end = pos;
		while (start > 0 && !/\s/.test(text[start - 1])) start--;
		while (end < text.length && !/\s/.test(text[end])) end++;
		return text.slice(start, end);
	};

	export const replaceCommandWithText = async (text: string) => {
		if (!textareaElement) return;
		const pos = textareaElement.selectionStart;
		const currentText = mdValue;
		let start = pos;
		while (start > 0 && !/\s/.test(currentText[start - 1])) start--;
		const newValue = currentText.slice(0, start) + text + currentText.slice(pos);
		mdValue = newValue;
		value = newValue;
		handleInput();
		await tick();
		textareaElement.selectionStart = textareaElement.selectionEnd = start + text.length;
	};

	export const replaceVariables = (variables: Record<string, any>) => {
		mdValue = mdValue.replace(/{{\s*([^|}]+)(?:\|[^}]*)?\s*}}/g, (match, varName) => {
			const trimmedVarName = varName.trim();
			return variables.hasOwnProperty(trimmedVarName) ? String(variables[trimmedVarName]) : match;
		});
		value = mdValue;
		handleInput();
	};

	const getHTML = () => {
		return DOMPurify.sanitize(marked.parse(mdValue || '', { breaks: true, gfm: true }));
	};

	const updateCounts = () => {
		wordCount = mdValue.trim().split(/\s+/).filter(Boolean).length;
		charCount = mdValue.length;
	};

	const handleInput = () => {
		value = mdValue;
		htmlValue = getHTML();
		updateCounts();
		onChange({
			md: mdValue,
			html: htmlValue,
			json: null
		});
	};

	const handleKeydown = (e: KeyboardEvent) => {
		eventDispatch('keydown', { event: e });

		if (messageInput && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
			eventDispatch('keydown', { event: e });
		}
	};

	const handleKeyup = (e: KeyboardEvent) => {
		eventDispatch('keyup', { event: e });
	};

	const handleFocus = (e: FocusEvent) => {
		eventDispatch('focus', { event: e });
	};

	const handlePaste = (e: ClipboardEvent) => {
		eventDispatch('paste', { event: e });
	};

	const handleDrop = (e: DragEvent) => {
		if (e.dataTransfer?.files && fileHandler) {
			e.preventDefault();
			const filesArray = Array.from(e.dataTransfer.files);
			const pos = textareaElement?.selectionStart || 0;
			onFileDrop(editor, filesArray, pos);
		}
	};

	const handleSelection = () => {
		if (textareaElement) {
			const from = textareaElement.selectionStart;
			const to = textareaElement.selectionEnd;
			onSelectionUpdate({
				editor: {
					state: {
						selection: { from, to },
						doc: { textBetween: (f, t) => mdValue.slice(f, t) }
					}
				}
			});
		}
	};

	onMount(() => {
		mdValue = value || '';
		htmlValue = getHTML();
		updateCounts();
	});
</script>

<div class="relative w-full h-full {className}">
	{#if showPreview}
		<div class="prose dark:prose-invert max-w-full p-4 overflow-auto h-full">
			{@html htmlValue}
		</div>
	{:else}
		<textarea
			bind:this={textareaElement}
			bind:value={mdValue}
			{id}
			{placeholder}
			disabled={!editable}
			class="w-full h-full resize-none bg-transparent outline-none {!editable
				? 'cursor-not-allowed'
				: ''}"
			on:input={handleInput}
			on:keydown={handleKeydown}
			on:keyup={handleKeyup}
			on:focus={handleFocus}
			on:paste={handlePaste}
			on:drop={handleDrop}
			on:select={handleSelection}
			on:dragover={(e) => e.preventDefault()}
		/>
	{/if}
</div>
