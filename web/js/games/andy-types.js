// Results for "Which Andy Are You?". Pure data and functions, so Node can test them.
// Andy: lawyer, artist, DIYer, hot sauce maker, garden queen, mum to Charlie and Farley.

export const ANDY_TYPES = [
  {
    id: 'flirty', emoji: '😘', name: 'FLIRTY ANDY',
    line: 'You wink first and ask questions later.',
    power: "Turning 'hi' into a phone number.",
    weakness: 'Anyone holding a puppy.',
    mission: 'Compliment three strangers before midnight.',
  },
  {
    id: 'artist', emoji: '🎨', name: 'ARTIST ANDY',
    line: 'You see a masterpiece in every napkin.',
    power: 'Making paint splatters look intentional.',
    weakness: 'Running out of canvas (and wall).',
    mission: 'Draw a portrait of someone on the back of this ticket.',
  },
  {
    id: 'lawyer', emoji: '⚖️', name: 'LAWYER ANDY',
    line: 'You win every argument, even the ones nobody started.',
    power: 'Objection! Sustained. Always.',
    weakness: 'Reading the fine print on the drinks menu.',
    mission: 'Cross-examine someone about their love life.',
  },
  {
    id: 'diy', emoji: '🔨', name: 'DIY ANDY',
    line: 'Why buy it when you can build it at 2 am?',
    power: 'Fixing anything with a drill and pure confidence.',
    weakness: 'The hardware store. Every single aisle.',
    mission: 'Fix something at this party. Anything.',
  },
  {
    id: 'hot-sauce', emoji: '🌶️', name: 'HOT SAUCE ANDY',
    line: 'Your blood type is homemade sriracha.',
    power: 'Eating ghost peppers without blinking.',
    weakness: 'Mild salsa. Frankly, an insult.',
    mission: 'Find the spiciest person here and say hi.',
  },
  {
    id: 'garden-queen', emoji: '👑', name: 'GARDEN QUEEN ANDY',
    line: 'Your tomatoes have a better social life than most people.',
    power: 'Growing peppers from pure willpower.',
    weakness: 'Snails. Never forgive. Never forget.',
    mission: "Tell someone they're growing on you.",
  },
  {
    id: 'dog-mom', emoji: '🐶', name: 'DOG MOM ANDY',
    line: 'Charlie and Farley run the house. You just pay the rent.',
    power: 'Hearing a treat bag open from three rooms away.',
    weakness: 'Every dog. At every park. Ever.',
    mission: 'Show someone 5 photos of a dog. Any dog.',
  },
  {
    id: 'pepper-whisperer', emoji: '🫑', name: 'PEPPER WHISPERER ANDY',
    line: 'Plants grow faster when you talk to them. You never stop talking.',
    power: "Knowing a pepper's heat just by looking at it.",
    weakness: 'Aphids. Ugh.',
    mission: 'Whisper something sweet to someone (not a plant).',
  },
  {
    id: 'party-animal', emoji: '🥳', name: 'PARTY ANIMAL ANDY',
    line: "You arrived early and you're leaving last.",
    power: 'Starting a dance floor out of thin air.',
    weakness: 'Tomorrow morning.',
    mission: 'Get 3 people dancing in the next 10 minutes.',
  },
  {
    id: 'birthday-queen', emoji: '🎂', name: 'BIRTHDAY QUEEN ANDY',
    line: "It's your birthday if you believe hard enough.",
    power: 'Making every room about you (lovingly).',
    weakness: 'Candles. So many candles.',
    mission: 'Start a round of Happy Birthday for the real Andy.',
  },
  {
    id: 'boss', emoji: '💼', name: 'BOSS ANDY',
    line: "You don't have meetings. You have verdicts.",
    power: 'Getting it done before anyone asks.',
    weakness: 'People who reply-all.',
    mission: 'Assign someone a job at this party.',
  },
  {
    id: 'main-character', emoji: '✨', name: 'MAIN CHARACTER ANDY',
    line: 'There is a soundtrack following you around.',
    power: 'Walking in slow motion on demand.',
    weakness: 'Any mirror, any window, any spoon.',
    mission: 'Make a dramatic entrance into the next room.',
  },
  {
    id: 'spicy', emoji: '🔥', name: 'SPICY ANDY',
    line: 'Hot sauce in the bag, hotter takes in the group chat.',
    power: "Saying what everyone's thinking.",
    weakness: "Being told 'it's not that spicy'.",
    mission: 'Share your spiciest opinion with the bar.',
  },
  {
    id: 'zen-garden', emoji: '🧘', name: 'ZEN GARDEN ANDY',
    line: 'Cool as a cucumber. You grew the cucumber.',
    power: 'Staying calm while the dogs eat the couch.',
    weakness: 'Weeds in the veggie patch.',
    mission: 'Lead the bar in three deep breaths. Then a shot.',
  },
  {
    id: 'chaos-gremlin', emoji: '😈', name: 'CHAOS GREMLIN ANDY',
    line: 'You have a glue gun and no supervision.',
    power: "Turning a 'quick project' into a three-day saga.",
    weakness: 'Instruction manuals.',
    mission: 'Start a harmless rumour about Charlie and Farley.',
  },
  {
    id: 'salsa-scientist', emoji: '🍅', name: 'SALSA SCIENTIST ANDY',
    line: 'Garden to bottle, you run the whole empire.',
    power: 'Turning a veggie patch into a condiment brand.',
    weakness: 'A mason jar shortage.',
    mission: 'Rate every snack here out of 10 for heat.',
  },
];

export const SIDEKICKS = ['Charlie 🐶', 'Farley 🐕', 'Charlie AND Farley 🐾'];

export const SCAN_LINES = [
  'Consulting Charlie & Farley… 🐶',
  'Measuring your hot sauce tolerance… 🌶️',
  'Reviewing the case files… ⚖️',
  'Checking your garden credentials… 🌱',
  'Counting your power tools… 🔨',
  'Analysing your brush strokes… 🎨',
  'Calculating Andy-ness… 🧮',
];

/** Random result that avoids the last few, so the queue doesn't see repeats. */
export function pickAndy(recent = [], rng = Math.random) {
  const fresh = ANDY_TYPES.filter((t) => !recent.includes(t.id));
  const pool = fresh.length ? fresh : ANDY_TYPES;
  const type = pool[Math.floor(rng() * pool.length)];
  return {
    type,
    sidekick: SIDEKICKS[Math.floor(rng() * SIDEKICKS.length)],
    andyness: 72 + Math.floor(rng() * 29), // 72..100 %
    heat: 1 + Math.floor(rng() * 5), // 1..5 peppers
    recent: [...recent, type.id].slice(-6),
  };
}
