'use client';

import { WEBUI_BASE_URL } from '@/lib/constants';

const emojiShortCodes: Record<string, string> = {
  '😀': ':grinning:',
  '😁': ':grin:',
  '😂': ':joy:',
  '🤣': ':rofl:',
  '😃': ':smiley:',
  '😄': ':smile:',
  '😅': ':sweat_smile:',
  '😆': ':laughing:',
  '😉': ':wink:',
  '😊': ':blush:',
  '😋': ':yum:',
  '😎': ':sunglasses:',
  '😍': ':heart_eyes:',
  '😘': ':kissing_heart:',
  '🥰': ':smiling_face_with_three_hearts:',
  '😗': ':kissing:',
  '😙': ':kissing_smiling_eyes:',
  '🥲': ':smiling_face_with_tear:',
  '😚': ':kissing_closed_eyes:',
  '😜': ':stuck_out_tongue_winking_eye:',
  '🤪': ':zany_face:',
  '😝': ':stuck_out_tongue_closed_eyes:',
  '🤑': ':money_mouth_face:',
  '🤗': ':hugs:',
  '🤭': ':hand_over_mouth:',
  '🤫': ':shushing_face:',
  '🤔': ':thinking:',
  '🤐': ':zipper_mouth_face:',
  '🤨': ':raised_eyebrow:',
  '😐': ':neutral_face:',
  '😑': ':expressionless:',
  '😶': ':no_mouth:',
  '😏': ':smirk:',
  '😒': ':unamused:',
  '🙄': ':roll_eyes:',
  '😬': ':grimacing:',
  '😮‍💨': ':face_exhaling:',
  '🤥': ':lying_face:',
  '😌': ':relieved:',
  '😔': ':pensive:',
  '😪': ':sleepy:',
  '🤤': ':drooling_face:',
  '😴': ':sleeping:',
  '😷': ':mask:',
  '🤒': ':face_with_thermometer:',
  '🤕': ':face_with_head_bandage:',
  '🤢': ':nauseated_face:',
  '🤮': ':vomiting_face:',
  '🤧': ':sneezing_face:',
  '🥵': ':hot_face:',
  '🥶': ':cold_face:',
  '🥴': ':woozy_face:',
  '😵': ':dizzy_face:',
  '🤯': ':exploding_head:',
  '🤠': ':cowboy_hat_face:',
  '🥳': ':partying_face:',
  '🥸': ':disguised_face:',
  '🤓': ':nerd_face:',
  '🧐': ':monocle_face:',
  '😕': ':confused:',
  '😟': ':worried:',
  '🙁': ':slightly_frowning_face:',
  '☹️': ':frowning_face:',
  '😮': ':open_mouth:',
  '😯': ':hushed:',
  '😲': ':astonished:',
  '😳': ':flushed:',
  '🥺': ':pleading_face:',
  '😦': ':frowning:',
  '😧': ':anguished:',
  '😨': ':fearful:',
  '😰': ':cold_sweat:',
  '😥': ':disappointed_relieved:',
  '😢': ':cry:',
  '😭': ':sob:',
  '😱': ':scream:',
  '😖': ':confounded:',
  '😣': ':persevere:',
  '😞': ':disappointed:',
  '😓': ':sweat:',
  '😩': ':weary:',
  '😫': ':tired_face:',
  '🥱': ':yawning_face:',
  '😤': ':triumph:',
  '😡': ':rage:',
  '😠': ':angry:',
  '🤬': ':cursing_face:',
  '😈': ':smiling_imp:',
  '👿': ':imp:',
  '💀': ':skull:',
  '☠️': ':skull_and_crossbones:',
  '💩': ':poop:',
  '🤡': ':clown_face:',
  '👹': ':japanese_ogre:',
  '👺': ':japanese_goblin:',
  '👻': ':ghost:',
  '👽': ':alien:',
  '👾': ':space_invader:',
  '🤖': ':robot:',
  '😺': ':smiley_cat:',
  '😸': ':smile_cat:',
  '😹': ':joy_cat:',
  '😻': ':heart_eyes_cat:',
  '😼': ':smirk_cat:',
  '😽': ':kissing_cat:',
  '🙀': ':scream_cat:',
  '😿': ':crying_cat_face:',
  '😾': ':pouting_cat:',
  '🙈': ':see_no_evil:',
  '🙉': ':hear_no_evil:',
  '🙊': ':speak_no_evil:',
  '❤️': ':heart:',
  '🧡': ':orange_heart:',
  '💛': ':yellow_heart:',
  '💚': ':green_heart:',
  '💙': ':blue_heart:',
  '💜': ':purple_heart:',
  '🖤': ':black_heart:',
  '🤍': ':white_heart:',
  '🤎': ':brown_heart:',
  '💔': ':broken_heart:',
  '❣️': ':heart_exclamation:',
  '💕': ':two_hearts:',
  '💞': ':revolving_hearts:',
  '💓': ':heartbeat:',
  '💗': ':heartpulse:',
  '💖': ':sparkling_heart:',
  '💘': ':cupid:',
  '💝': ':gift_heart:',
  '💟': ':heart_decoration:',
  '👍': ':thumbsup:',
  '👎': ':thumbsdown:',
  '✅': ':white_check_mark:',
  '❌': ':x:',
  '⭐': ':star:',
  '🌟': ':star2:',
  '✨': ':sparkles:',
  '🔥': ':fire:',
  '💯': ':100:',
  '🎉': ':tada:',
  '🎊': ':confetti_ball:',
  '🚀': ':rocket:',
  '💡': ':bulb:',
  '⚡': ':zap:',
  '🌈': ':rainbow:',
};

const shortCodesToEmojis = Object.entries(emojiShortCodes).reduce(
  (acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[value] = key;
    }
    return acc;
  },
  {} as Record<string, string>
);

interface EmojiProps {
  shortCode: string;
  className?: string;
}

export function Emoji({ shortCode, className = 'size-4' }: EmojiProps) {
  const emoji = shortCodesToEmojis[shortCode];

  if (emoji) {
    return (
      <img
        src={`${WEBUI_BASE_URL}/assets/emojis/${emoji.toLowerCase()}.svg`}
        alt={shortCode}
        className={className}
        loading="lazy"
      />
    );
  }

  return <div>{shortCode}</div>;
}
