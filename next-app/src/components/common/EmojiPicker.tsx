'use client';

import { useState, useMemo, ReactNode } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Tooltip } from './Tooltip';
import { WEBUI_BASE_URL } from '@/lib/constants';

const emojiGroups: Record<string, string[]> = {
	'Smileys & Emotion': [
		'😀',
		'😁',
		'😂',
		'🤣',
		'😃',
		'😄',
		'😅',
		'😆',
		'😉',
		'😊',
		'😋',
		'😎',
		'😍',
		'😘',
		'🥰',
		'😗',
		'😙',
		'🥲',
		'😚',
		'😜',
		'🤪',
		'😝',
		'🤑',
		'🤗',
		'🤭',
		'🤫',
		'🤔',
		'🤐',
		'🤨',
		'😐',
		'😑',
		'😶',
		'😏',
		'😒',
		'🙄',
		'😬',
		'🤥',
		'😌',
		'😔',
		'😪',
		'🤤',
		'😴',
		'😷',
		'🤒',
		'🤕',
		'🤢',
		'🤮',
		'🤧',
		'🥵',
		'🥶',
		'🥴',
		'😵',
		'🤯',
		'🤠',
		'🥳',
		'🥸',
		'🤓',
		'🧐',
		'😕',
		'😟',
		'🙁',
		'😮',
		'😯',
		'😲',
		'😳',
		'🥺',
		'😦',
		'😧',
		'😨',
		'😰',
		'😥',
		'😢',
		'😭',
		'😱',
		'😖',
		'😣',
		'😞',
		'😓',
		'😩',
		'😫',
		'🥱',
		'😤',
		'😡',
		'😠',
		'🤬',
		'😈',
		'👿',
		'💀',
		'💩',
		'🤡',
		'👹',
		'👺',
		'👻',
		'👽',
		'👾',
		'🤖'
	],
	'People & Body': [
		'👋',
		'🤚',
		'🖐️',
		'✋',
		'🖖',
		'👌',
		'🤌',
		'🤏',
		'✌️',
		'🤞',
		'🤟',
		'🤘',
		'🤙',
		'👈',
		'👉',
		'👆',
		'🖕',
		'👇',
		'☝️',
		'👍',
		'👎',
		'✊',
		'👊',
		'🤛',
		'🤜',
		'👏',
		'🙌',
		'👐',
		'🤲',
		'🤝',
		'🙏',
		'💪'
	],
	'Animals & Nature': [
		'🐶',
		'🐱',
		'🐭',
		'🐹',
		'🐰',
		'🦊',
		'🐻',
		'🐼',
		'🐨',
		'🐯',
		'🦁',
		'🐮',
		'🐷',
		'🐽',
		'🐸',
		'🐵',
		'🙈',
		'🙉',
		'🙊',
		'🐒',
		'🐔',
		'🐧',
		'🐦',
		'🐤',
		'🐣',
		'🐥',
		'🦆',
		'🦅',
		'🦉',
		'🦇',
		'🐺',
		'🐗',
		'🐴',
		'🦄',
		'🐝',
		'🐛',
		'🦋',
		'🐌',
		'🐞'
	],
	'Food & Drink': [
		'🍏',
		'🍎',
		'🍐',
		'🍊',
		'🍋',
		'🍌',
		'🍉',
		'🍇',
		'🍓',
		'🍈',
		'🍒',
		'🍑',
		'🥭',
		'🍍',
		'🥥',
		'🥝',
		'🍅',
		'🍆',
		'🥑',
		'🥦',
		'🥬',
		'🥒',
		'🌶️',
		'🌽',
		'🥕',
		'🥔',
		'🍠',
		'🥐',
		'🍞',
		'🥖',
		'🧀',
		'🥚',
		'🍳',
		'🥞',
		'🧇',
		'🥓',
		'🥩',
		'🍗',
		'🍖',
		'🌭',
		'🍔',
		'🍟',
		'🍕',
		'🥪',
		'🌮',
		'🌯',
		'🥗',
		'🍜',
		'🍝',
		'🍣',
		'🍤',
		'🍙',
		'🍚',
		'🍘',
		'🍥',
		'🥮',
		'🍡',
		'🍧',
		'🍨',
		'🍦',
		'🥧',
		'🧁',
		'🍰',
		'🎂',
		'🍮',
		'🍭',
		'🍬',
		'🍫',
		'🍿',
		'🍩',
		'🍪',
		'☕',
		'🍵',
		'🥤',
		'🍶',
		'🍺',
		'🍻',
		'🥂',
		'🍷',
		'🍸',
		'🍹'
	],
	Activities: [
		'⚽',
		'🏀',
		'🏈',
		'⚾',
		'🥎',
		'🎾',
		'🏐',
		'🏉',
		'🎱',
		'🏓',
		'🏸',
		'🏒',
		'🏑',
		'⛳',
		'🏹',
		'🎣',
		'🥊',
		'🥋',
		'🎿',
		'⛷️',
		'🏂',
		'🎪',
		'🎭',
		'🎨',
		'🎬',
		'🎤',
		'🎧',
		'🎼',
		'🎹',
		'🥁',
		'🎷',
		'🎺',
		'🎸',
		'🎻',
		'🎲',
		'🎯',
		'🎳',
		'🎮',
		'🎰',
		'🧩'
	],
	Symbols: [
		'❤️',
		'🧡',
		'💛',
		'💚',
		'💙',
		'💜',
		'🖤',
		'🤍',
		'🤎',
		'💔',
		'❣️',
		'💕',
		'💞',
		'💓',
		'💗',
		'💖',
		'💘',
		'💝',
		'💟',
		'❌',
		'⭕',
		'💯',
		'💢',
		'❗',
		'❓',
		'❕',
		'❔',
		'‼️',
		'⁉️',
		'⚠️',
		'✅',
		'❇️',
		'✳️',
		'❎',
		'💤',
		'💬',
		'💭',
		'🔔',
		'🔕',
		'📣',
		'📢',
		'⭐',
		'🌟',
		'✨',
		'🔥',
		'💥',
		'⚡',
		'🌈',
		'🎵',
		'🎶',
		'➕',
		'➖',
		'➗',
		'✖️',
		'💲',
		'✔️',
		'☑️',
		'🔴',
		'🟠',
		'🟡',
		'🟢',
		'🔵',
		'🟣',
		'⚫',
		'⚪',
		'🟤'
	]
};

const emojiShortCodes: Record<string, string> = {
	'😀': 'grinning',
	'😁': 'grin',
	'😂': 'joy',
	'🤣': 'rofl',
	'😃': 'smiley',
	'😄': 'smile',
	'😅': 'sweat_smile',
	'😆': 'laughing',
	'😉': 'wink',
	'😊': 'blush',
	'😋': 'yum',
	'😎': 'sunglasses',
	'😍': 'heart_eyes',
	'😘': 'kissing_heart',
	'🥰': 'smiling_face_with_three_hearts',
	'😗': 'kissing',
	'😙': 'kissing_smiling_eyes',
	'🥲': 'smiling_face_with_tear',
	'😚': 'kissing_closed_eyes',
	'😜': 'stuck_out_tongue_winking_eye',
	'🤪': 'zany_face',
	'😝': 'stuck_out_tongue_closed_eyes',
	'🤑': 'money_mouth_face',
	'🤗': 'hugs',
	'🤭': 'hand_over_mouth',
	'🤫': 'shushing_face',
	'🤔': 'thinking',
	'🤐': 'zipper_mouth_face',
	'🤨': 'raised_eyebrow',
	'😐': 'neutral_face',
	'😑': 'expressionless',
	'😶': 'no_mouth',
	'😏': 'smirk',
	'😒': 'unamused',
	'🙄': 'roll_eyes',
	'😬': 'grimacing',
	'🤥': 'lying_face',
	'😌': 'relieved',
	'😔': 'pensive',
	'😪': 'sleepy',
	'🤤': 'drooling_face',
	'😴': 'sleeping',
	'😷': 'mask',
	'🤒': 'face_with_thermometer',
	'🤕': 'face_with_head_bandage',
	'🤢': 'nauseated_face',
	'🤮': 'vomiting_face',
	'🤧': 'sneezing_face',
	'🥵': 'hot_face',
	'🥶': 'cold_face',
	'🥴': 'woozy_face',
	'😵': 'dizzy_face',
	'🤯': 'exploding_head',
	'🤠': 'cowboy_hat_face',
	'🥳': 'partying_face',
	'🥸': 'disguised_face',
	'🤓': 'nerd_face',
	'🧐': 'monocle_face',
	'😕': 'confused',
	'😟': 'worried',
	'🙁': 'slightly_frowning_face',
	'😮': 'open_mouth',
	'😯': 'hushed',
	'😲': 'astonished',
	'😳': 'flushed',
	'🥺': 'pleading_face',
	'😦': 'frowning',
	'😧': 'anguished',
	'😨': 'fearful',
	'😰': 'cold_sweat',
	'😥': 'disappointed_relieved',
	'😢': 'cry',
	'😭': 'sob',
	'😱': 'scream',
	'😖': 'confounded',
	'😣': 'persevere',
	'😞': 'disappointed',
	'😓': 'sweat',
	'😩': 'weary',
	'😫': 'tired_face',
	'🥱': 'yawning_face',
	'😤': 'triumph',
	'😡': 'rage',
	'😠': 'angry',
	'🤬': 'cursing_face',
	'😈': 'smiling_imp',
	'👿': 'imp',
	'💀': 'skull',
	'💩': 'poop',
	'🤡': 'clown_face',
	'👹': 'japanese_ogre',
	'👺': 'japanese_goblin',
	'👻': 'ghost',
	'👽': 'alien',
	'👾': 'space_invader',
	'🤖': 'robot',
	'👍': 'thumbsup',
	'👎': 'thumbsdown',
	'❤️': 'heart',
	'✅': 'white_check_mark',
	'❌': 'x',
	'⭐': 'star',
	'🌟': 'star2',
	'✨': 'sparkles',
	'🔥': 'fire',
	'💯': 'hundred',
	'🎉': 'tada',
	'🚀': 'rocket',
	'💡': 'bulb',
	'⚡': 'zap'
};

interface EmojiPickerProps {
	onClose?: () => void;
	onSubmit: (shortCode: string) => void;
	side?: 'top' | 'right' | 'bottom' | 'left';
	align?: 'start' | 'center' | 'end';
	children: ReactNode;
}

export function EmojiPicker({
	onClose,
	onSubmit,
	side = 'top',
	align = 'start',
	children
}: EmojiPickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');

	const filteredGroups = useMemo(() => {
		if (!search) return emojiGroups;

		const searchLower = search.toLowerCase();
		const result: Record<string, string[]> = {};

		Object.entries(emojiGroups).forEach(([group, emojis]) => {
			const filtered = emojis.filter((emoji) => {
				const shortCode = emojiShortCodes[emoji];
				return shortCode?.includes(searchLower) || emoji.includes(searchLower);
			});
			if (filtered.length > 0) {
				result[group] = filtered;
			}
		});

		return result;
	}, [search]);

	const selectEmoji = (emoji: string) => {
		const shortCode = emojiShortCodes[emoji];
		if (shortCode) {
			onSubmit(shortCode);
		}
		setOpen(false);
	};

	const hasResults = Object.keys(filteredGroups).length > 0;

	return (
		<DropdownMenuPrimitive.Root
			open={open}
			onOpenChange={(state) => {
				setOpen(state);
				if (!state) {
					setSearch('');
					onClose?.();
				}
			}}
		>
			<DropdownMenuPrimitive.Trigger asChild>{children}</DropdownMenuPrimitive.Trigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					className="max-w-full w-80 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 rounded-3xl z-[9999] shadow-lg dark:text-white"
					sideOffset={8}
					side={side}
					align={align}
				>
					<div className="mb-1 px-4 pt-2.5 pb-2">
						<input
							type="text"
							className="w-full text-sm bg-transparent outline-none"
							placeholder="Search all emojis"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<div className="w-full h-96 overflow-y-auto px-3 pb-3 text-sm">
						{!hasResults ? (
							<div className="text-center text-xs text-gray-500 dark:text-gray-400 py-4">
								No results
							</div>
						) : (
							Object.entries(filteredGroups).map(([group, emojis]) => (
								<div key={group} className="mb-4">
									<div className="text-xs font-medium mb-2 text-gray-500 dark:text-gray-400">
										{group}
									</div>
									<div className="flex flex-wrap gap-1">
										{emojis.map((emoji) => {
											const shortCode = emojiShortCodes[emoji];
											return (
												<Tooltip key={emoji} content={shortCode ? `:${shortCode}:` : emoji}>
													<button
														className="p-1.5 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition text-xl"
														onClick={() => selectEmoji(emoji)}
													>
														{emoji}
													</button>
												</Tooltip>
											);
										})}
									</div>
								</div>
							))
						)}
					</div>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}
