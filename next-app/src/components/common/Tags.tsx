'use client';

import { useState } from 'react';
import { Tooltip } from './Tooltip';
import { X, Plus, Check } from 'lucide-react';

interface Tag {
	name: string;
}

interface TagsProps {
	tags: Tag[];
	suggestionTags?: Tag[];
	onAdd?: (tagName: string) => void;
	onDelete?: (tagName: string) => void;
}

interface TagItemProps {
	tag: Tag;
	onDelete: () => void;
}

function TagItem({ tag, onDelete }: TagItemProps) {
	if (!tag) return null;

	return (
		<Tooltip content={tag.name}>
			<button
				aria-label="Remove this tag from list"
				className="relative group/tags px-1.5 py-[0.5px] gap-0.5 flex justify-between h-fit max-h-fit w-fit items-center rounded-lg bg-gray-500/20 text-gray-700 dark:text-gray-200 transition cursor-pointer"
				onClick={onDelete}
			>
				<div className="text-[0.7rem] font-medium self-center line-clamp-1 w-fit">{tag.name}</div>
				<div className="hidden group-hover/tags:block transition">
					<div className="rounded-full pl-[1px] backdrop-blur-sm h-full flex self-center cursor-pointer">
						<X className="size-3" strokeWidth={2.5} />
					</div>
				</div>
			</button>
		</Tooltip>
	);
}

interface TagInputProps {
	label?: string;
	suggestionTags?: Tag[];
	onAdd: (tagName: string) => void;
}

function TagInput({ label = '', suggestionTags = [], onAdd }: TagInputProps) {
	const [showTagInput, setShowTagInput] = useState(false);
	const [tagName, setTagName] = useState('');

	const addTagHandler = () => {
		const trimmedName = tagName.trim();
		if (trimmedName !== '') {
			onAdd(trimmedName);
			setTagName('');
			setShowTagInput(false);
		}
	};

	return (
		<div className={`px-0.5 flex ${showTagInput ? 'flex-row-reverse' : ''}`}>
			{showTagInput && (
				<div className="flex items-center">
					<input
						value={tagName}
						onChange={(e) => setTagName(e.target.value)}
						className="px-2 cursor-pointer self-center text-xs h-fit bg-transparent outline-hidden line-clamp-1 w-[6.5rem]"
						placeholder="Add a tag"
						aria-label="Add a tag"
						list="tagOptions"
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								addTagHandler();
							}
						}}
					/>
					{suggestionTags.length > 0 && (
						<datalist id="tagOptions">
							{suggestionTags.map((tag) => (
								<option key={tag.name} value={tag.name} />
							))}
						</datalist>
					)}

					<button type="button" aria-label="Save Tag" onClick={addTagHandler}>
						<Check className="size-3" strokeWidth={2} />
					</button>
				</div>
			)}

			<button
				className="cursor-pointer self-center p-0.5 flex h-fit items-center rounded-full transition border dark:border-gray-600 border-dashed"
				type="button"
				aria-label="Add Tag"
				onClick={() => setShowTagInput(!showTagInput)}
			>
				<div className="m-auto self-center">
					<Plus
						className={`size-2.5 ${showTagInput ? 'rotate-45' : ''} transition-all transform`}
					/>
				</div>
			</button>

			{label && !showTagInput && <span className="text-xs pl-2 self-center">{label}</span>}
		</div>
	);
}

export function Tags({ tags, suggestionTags = [], onAdd, onDelete }: TagsProps) {
	return (
		<ul className="flex flex-row flex-wrap gap-[0.3rem] line-clamp-1">
			{tags.map((tag) => (
				<li key={tag.name}>
					<TagItem tag={tag} onDelete={() => onDelete?.(tag.name)} />
				</li>
			))}
			<li>
				<TagInput
					label={tags.length === 0 ? 'Add Tags' : ''}
					suggestionTags={suggestionTags}
					onAdd={(tagName) => onAdd?.(tagName)}
				/>
			</li>
		</ul>
	);
}
