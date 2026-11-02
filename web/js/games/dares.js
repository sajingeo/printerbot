// Dare deck for the Do or Drink kiosk. Pure data and functions, so Node can test them.
// Anyone walks up, so dares never assume a player list or turns.

export const SPICE = {
  1: { label: 'Chill', emoji: '🧊' },
  2: { label: 'Flirty', emoji: '😏' },
  3: { label: 'Spicy', emoji: '🌶️' },
};

export const WILD_CHANCE = 0.1;

// [text, sips]
const CHILL = [
  ['Do your best impression of Andy until someone guesses who it is.', 2],
  ['Sing "Happy Birthday" to Andy as a dramatic opera solo.', 2],
  ['Talk in a British accent for the next 10 minutes.', 2],
  ['Do 10 push-ups right here. The bar counts out loud.', 2],
  ['Find Andy and give a 30-second birthday toast. Make it emotional.', 1],
  ['Show the last photo in your camera roll to the person next to you. No swiping!', 2],
  ['Dance like nobody is watching (everyone is) for 20 seconds.', 2],
  ['Tell the person next to you the most embarrassing thing that happened to you this year.', 2],
  ['Speak only in questions for the next 5 minutes.', 1],
  ['Let someone draw a "tattoo" on your arm with a pen.', 2],
  ['Strut a full catwalk across the room. Pose at the end.', 1],
  ['Tell a stranger here how you met Andy, but lie dramatically.', 1],
  ['Freestyle rap 4 lines about Andy\'s birthday.', 2],
  ['Moonwalk across the room. Commit to it.', 1],
  ['Act out your morning routine in silent mime.', 1],
  ['Strike a pose and get someone to take a photo. Send it to Andy.', 1],
  ['Describe your drink in your best TV-chef voice.', 1],
  ['Narrate the party like a nature documentary for 30 seconds.', 2],
  ['Hold a plank while the person next to you tells a joke. No laughing.', 2],
  ['Do a magic trick for the bar. It can be terrible. It will be terrible.', 1],
];

const FLIRTY = [
  ['Use your best pickup line on the next person who walks by. Cheesy is mandatory.', 2],
  ['Read the last message you sent out loud, in a seductive voice.', 3],
  ['Get the person next to you to write your dating-app bio. Read it out with a straight face.', 2],
  ['Ask someone to slow dance with you for 30 seconds.', 2],
  ['Wink at the best-looking person in the room. Hold it.', 3],
  ['Serenade someone with one line of a love song.', 2],
  ['Swap one item of clothing with someone for the next 15 minutes.', 3],
  ['Tell the person next to you your type, in exactly 3 words.', 2],
  ['Rate the outfits of everyone at the bar out of 10. Out loud.', 2],
  ['Whisper a compliment in someone\'s ear.', 2],
  ['Give someone your best smoldering look for 10 seconds. No laughing.', 2],
  ['Describe your celebrity crush until someone guesses who.', 1],
  ['Show someone your latest dating-app chat (or your sad empty inbox).', 3],
  ['Offer someone a 20-second shoulder massage. Ask first 😉', 2],
  ['Tell the person next to you about your worst date ever.', 2],
  ['Recreate a famous romantic movie scene with someone.', 2],
  ['Propose to someone on one knee. Make it convincing.', 2],
  ['Let someone restyle your hair. Keep it for the next hour.', 2],
  ['Tell someone the cheesiest line that ever actually worked on you.', 2],
  ['Hold eye contact with someone for 20 seconds without laughing.', 2],
];

const SPICY = [
  ['Give your number to someone here you haven\'t met before.', 3],
  ['Let the person next to you swipe on a dating app for you for 1 minute.', 3],
  ['Text "thinking about you 😘" to the 3rd person in your recent chats. No context.', 4],
  ['Kiss someone on the cheek. Ask first! 😘', 3],
  ['Tell the person next to you who here you\'d go on a date with.', 4],
  ['Let someone scroll your camera roll for 15 seconds.', 4],
  ['Post a selfie with someone captioned "date night 💕".', 3],
  ['Show someone your most recent search history entry.', 3],
  ['Describe your perfect first kiss, in detail.', 2],
  ['Ask the cutest single person here to dance with you. Right now.', 3],
  ['Send a voice note to your crush saying "Happy birthday Andy!" Nothing else.', 4],
  ['Confess your biggest red flag in dating to the person next to you.', 2],
  ['Let the person next to you ask you one question. No lying.', 3],
  ['Sit on someone\'s lap for one song (if they\'re cool with it).', 3],
  ['Let someone send one text from your phone. To anyone.', 4],
  ['Swap phones with someone for 2 minutes. No locking.', 3],
  ['Write your number on this ticket and hand it to someone you fancy.', 3],
  ['Lose one item of clothing. Shoes count, you saint.', 2],
  ['Give someone a cheesy 15-second chair dance. Keep it classy-ish.', 3],
  ['Tell a stranger the most daring thing you\'ve done for love.', 2],
];

const build = (lvl, list) => list.map(([text, sips], i) => ({ id: `${lvl}-${i + 1}`, lvl, sips, text }));

export const DARES = [...build(1, CHILL), ...build(2, FLIRTY), ...build(3, SPICY)];

export const WILDS = [
  { id: 'w-bday', emoji: '🎂', title: 'BIRTHDAY RULE', text: 'Find Andy. Andy picks your dare. Refuse and you drink 3.' },
  { id: 'w-social', emoji: '🍻', title: 'SOCIAL!', text: 'Everyone at the bar drinks. Cheers to Andy!' },
  { id: 'w-pass', emoji: '🛡️', title: 'FREE PASS', text: 'Lucky you. No dare, no drink. Brag about it.' },
  { id: 'w-gift', emoji: '🎁', title: 'GIFT IT', text: 'Hand this ticket to someone. They pull the next dare.' },
  { id: 'w-double', emoji: '👯', title: 'DOUBLE DARE', text: 'Grab a partner. You both pull a dare and you both do it.' },
];

/**
 * Draw an unused dare at the given spice level (1, 2, 3 or 'mix').
 * Returns the dare and the new used-id list. When a level runs dry its ids are cleared.
 */
export function pickDare(dares, spice, used = [], rng = Math.random) {
  const pool = dares.filter((d) => spice === 'mix' || d.lvl === Number(spice));
  if (!pool.length) throw new Error(`No dares for spice ${spice}`);
  const usedSet = new Set(used);
  let fresh = pool.filter((d) => !usedSet.has(d.id));
  if (!fresh.length) {
    const poolIds = new Set(pool.map((d) => d.id));
    used = used.filter((id) => !poolIds.has(id));
    fresh = pool;
  }
  const dare = fresh[Math.floor(rng() * fresh.length)];
  return { dare, used: [...used, dare.id] };
}
