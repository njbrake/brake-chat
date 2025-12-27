'use client';

import DOMPurify from 'dompurify';
import type { Token } from 'marked';
import { WEBUI_BASE_URL } from '@/lib/constants';
import { unescapeHtml } from '@/lib/utils';
import { Image } from '@/components/common/Image';
import { KatexRenderer } from './KatexRenderer';

interface MarkdownInlineTokensProps {
	id: string;
	done?: boolean;
	tokens: Token[];
	sourceIds?: string[];
	onSourceClick?: (params: unknown) => void;
}

type TokenWithText = Token & {
	text?: string;
	href?: string;
	title?: string;
	tokens?: Token[];
	escapedText?: string;
	fileId?: string;
	raw?: string;
	ids?: number[];
	displayMode?: boolean;
};

export function MarkdownInlineTokens({
	id,
	done = true,
	tokens,
	sourceIds = [],
	onSourceClick
}: MarkdownInlineTokensProps) {
	const renderToken = (token: TokenWithText, tokenIdx: number) => {
		const key = `${id}-${tokenIdx}`;

		switch (token.type) {
			case 'escape':
				return <span key={key}>{unescapeHtml(token.text || '')}</span>;

			case 'html':
				if (typeof window === 'undefined') return null;
				return (
					<span
						key={key}
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(token.raw || token.text || '')
						}}
					/>
				);

			case 'link':
				return (
					<a
						key={key}
						href={token.href}
						target="_blank"
						rel="nofollow noopener noreferrer"
						title={token.title}
					>
						{token.tokens ? (
							<MarkdownInlineTokens
								id={`${id}-a`}
								tokens={token.tokens}
								onSourceClick={onSourceClick}
								done={done}
							/>
						) : (
							token.text
						)}
					</a>
				);

			case 'image':
				return <Image key={key} src={token.href || ''} alt={token.text || ''} />;

			case 'strong':
				return (
					<strong key={key}>
						<MarkdownInlineTokens
							id={`${id}-strong`}
							tokens={token.tokens || []}
							onSourceClick={onSourceClick}
						/>
					</strong>
				);

			case 'em':
				return (
					<em key={key}>
						<MarkdownInlineTokens
							id={`${id}-em`}
							tokens={token.tokens || []}
							onSourceClick={onSourceClick}
						/>
					</em>
				);

			case 'codespan':
				return (
					<code
						key={key}
						className="codespan px-1.5 py-0.5 text-sm rounded-md bg-gray-100 dark:bg-gray-800"
					>
						{token.text}
					</code>
				);

			case 'br':
				return <br key={key} />;

			case 'del':
				return (
					<del key={key}>
						<MarkdownInlineTokens
							id={`${id}-del`}
							tokens={token.tokens || []}
							onSourceClick={onSourceClick}
						/>
					</del>
				);

			case 'inlineKatex':
				return token.text ? (
					<KatexRenderer key={key} content={token.text} displayMode={false} />
				) : null;

			case 'iframe':
				return (
					<iframe
						key={key}
						src={`${WEBUI_BASE_URL}/api/v1/files/${token.fileId}/content`}
						title={token.fileId}
						width="100%"
						frameBorder="0"
						onLoad={(e) => {
							try {
								const iframe = e.currentTarget;
								if (iframe.contentWindow) {
									iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 20 + 'px';
								}
							} catch {
								// Ignore cross-origin errors
							}
						}}
					/>
				);

			case 'footnote':
				if (typeof window === 'undefined') return null;
				return (
					<span
						key={key}
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(
								`<sup class="footnote-ref footnote-ref-text">${token.escapedText || ''}</sup>`
							)
						}}
					/>
				);

			case 'citation':
				if (token.ids && token.ids.length > 0) {
					return (
						<span key={key} className="citation-ref">
							{token.ids.map((sourceId: number) => (
								<button
									key={sourceId}
									className="citation-button text-xs text-blue-500 hover:underline mx-0.5"
									onClick={() => onSourceClick?.({ sourceId: sourceId - 1, sourceIds })}
								>
									[{sourceId}]
								</button>
							))}
						</span>
					);
				}
				return null;

			case 'text':
				if (token.tokens) {
					return (
						<span key={key}>
							<MarkdownInlineTokens
								id={`${id}-text`}
								tokens={token.tokens}
								onSourceClick={onSourceClick}
								done={done}
							/>
						</span>
					);
				}
				return <span key={key}>{token.text}</span>;

			default:
				return token.text ? <span key={key}>{token.text}</span> : null;
		}
	};

	return <>{tokens.map((token, idx) => renderToken(token as TokenWithText, idx))}</>;
}
