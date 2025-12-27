'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css';
import { copyToClipboard, initMermaid, renderMermaidDiagram } from '@/lib/utils';
import { CodeEditor } from '@/components/common/CodeEditor';
import { useAppStore } from '@/store';

interface CodeBlockToken {
	type?: string;
	raw?: string;
	text?: string;
	lang?: string;
}

interface CodeBlockProps {
	id?: string;
	edit?: boolean;
	onSave?: (code: string) => void;
	onUpdate?: (token: unknown) => void;
	onPreview?: (code: string) => void;
	save?: boolean;
	run?: boolean;
	preview?: boolean;
	collapsed?: boolean;
	token?: CodeBlockToken;
	lang?: string;
	code?: string;
	attributes?: Record<string, unknown>;
	className?: string;
	editorClassName?: string;
	stickyButtonsClassName?: string;
}

export function CodeBlock({
	id = '',
	edit = true,
	onSave,
	onUpdate,
	onPreview,
	save = false,
	preview = false,
	collapsed: initialCollapsed = false,
	token,
	lang = '',
	code: initialCode = '',
	className = 'mb-2',
	editorClassName = '',
	stickyButtonsClassName = 'top-0'
}: CodeBlockProps) {
	const settings = useAppStore((s) => s.settings);
	const [collapsed, setCollapsed] = useState(initialCollapsed);
	const [_code, setCode] = useState(initialCode);
	const [renderHTML, setRenderHTML] = useState<string | null>(null);
	const [renderError, setRenderError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		setCode(initialCode);
	}, [initialCode]);

	const collapseCodeBlock = useCallback(() => {
		setCollapsed((prev) => !prev);
	}, []);

	const saveCode = useCallback(() => {
		setSaved(true);
		onSave?.(_code);
		setTimeout(() => setSaved(false), 1000);
	}, [_code, onSave]);

	const copyCode = useCallback(async () => {
		setCopied(true);
		await copyToClipboard(_code);
		setTimeout(() => setCopied(false), 1000);
	}, [_code]);

	const previewCode = useCallback(() => {
		onPreview?.(initialCode);
	}, [initialCode, onPreview]);

	const isMermaid = lang === 'mermaid';
	const isVega = lang === 'vega' || lang === 'vega-lite';
	const isSpecialLang = isMermaid || isVega;

	useEffect(() => {
		const render = async () => {
			if (token) {
				onUpdate?.(token);
			}

			if (isMermaid && (token?.raw ?? '').slice(-4).includes('```')) {
				try {
					const mermaid = await initMermaid();
					const svg = await renderMermaidDiagram(mermaid, initialCode);
					setRenderHTML(svg);
					setRenderError(null);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : String(error);
					setRenderError('Failed to render diagram: ' + errorMsg);
					setRenderHTML(null);
				}
			}
		};

		render();
	}, [token, isMermaid, initialCode, onUpdate]);

	const highlightedCode = useMemo(() => {
		if (!initialCode) return '';
		try {
			const language = hljs.getLanguage(lang) ? lang : undefined;
			return language
				? hljs.highlight(initialCode, { language }).value
				: hljs.highlightAuto(initialCode).value;
		} catch {
			return initialCode;
		}
	}, [initialCode, lang]);

	const lineCount = initialCode.split('\n').length;

	if (isSpecialLang) {
		return (
			<div>
				<div
					className={`relative ${className} flex flex-col rounded-3xl border border-gray-100 dark:border-gray-850 my-0.5`}
					dir="ltr"
				>
					{renderHTML ? (
						<div
							className="rounded-3xl max-h-fit overflow-hidden p-4"
							dangerouslySetInnerHTML={{ __html: renderHTML }}
						/>
					) : (
						<div className="p-3">
							{renderError && (
								<div className="flex gap-2.5 border px-4 py-3 border-red-600/10 bg-red-600/10 rounded-2xl mb-2">
									{renderError}
								</div>
							)}
							<pre>{initialCode}</pre>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div>
			<div
				className={`relative ${className} flex flex-col rounded-3xl border border-gray-100 dark:border-gray-850 my-0.5`}
				dir="ltr"
			>
				<div className="absolute left-0 right-0 py-2.5 pr-3 text-text-300 pl-4.5 text-xs font-medium dark:text-white">
					{lang}
				</div>

				<div
					className={`sticky ${stickyButtonsClassName} left-0 right-0 py-2 pr-3 flex items-center justify-end w-full z-10 text-xs text-black dark:text-white`}
				>
					<div className="flex items-center gap-0.5">
						<button
							className="flex gap-1 items-center bg-none border-none transition rounded-md px-1.5 py-0.5 bg-white dark:bg-black"
							onClick={collapseCodeBlock}
						>
							<div className="-translate-y-[0.5px]">
								<ChevronsUpDown className="size-3" />
							</div>
							<div>{collapsed ? 'Expand' : 'Collapse'}</div>
						</button>

						{save && (
							<button
								className="save-code-button bg-none border-none transition rounded-md px-1.5 py-0.5 bg-white dark:bg-black"
								onClick={saveCode}
							>
								{saved ? 'Saved' : 'Save'}
							</button>
						)}

						<button
							className="copy-code-button bg-none border-none transition rounded-md px-1.5 py-0.5 bg-white dark:bg-black"
							onClick={copyCode}
						>
							{copied ? 'Copied' : 'Copy'}
						</button>

						{preview && ['html', 'svg'].includes(lang) && (
							<button
								className="flex gap-1 items-center run-code-button bg-none border-none transition rounded-md px-1.5 py-0.5 bg-white dark:bg-black"
								onClick={previewCode}
							>
								<div>Preview</div>
							</button>
						)}
					</div>
				</div>

				<div
					className={`language-${lang} rounded-t-3xl -mt-9 ${editorClassName || 'rounded-b-3xl'} overflow-hidden`}
				>
					<div className="pt-8 bg-white dark:bg-black"></div>

					{!collapsed ? (
						edit ? (
							<CodeEditor
								value={initialCode}
								id={id}
								lang={lang}
								onSave={saveCode}
								onChange={(value) => setCode(value)}
							/>
						) : (
							<pre
								className="hljs p-4 px-5 overflow-x-auto"
								style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
							>
								<code
									className={`language-${lang} rounded-t-none whitespace-pre text-sm`}
									dangerouslySetInnerHTML={{ __html: highlightedCode }}
								/>
							</pre>
						)
					) : (
						<div className="bg-white dark:bg-black dark:text-white rounded-b-3xl! pt-0.5 pb-3 px-4 flex flex-col gap-2 text-xs">
							<span className="text-gray-500 italic">{`${lineCount} hidden lines`}</span>
						</div>
					)}
				</div>

				{!collapsed && (
					<div
						id={`plt-canvas-${id}`}
						className="bg-gray-50 dark:bg-black dark:text-white max-w-full overflow-x-auto scrollbar-hidden"
					/>
				)}
			</div>
		</div>
	);
}
