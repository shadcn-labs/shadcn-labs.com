export interface Company {
  name: string;
  /** Domain resolved via Google's favicon service for the logo mark. */
  domain?: string;
  /** Explicit logo URL that overrides the favicon service. */
  favicon?: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  handle: string;
  role: string;
  url: string;
}

/** Resolve an X profile avatar via unavatar.io. */
export const avatarFor = (handle: string) => `https://unavatar.io/x/${handle}`;

/** Resolve a company logo mark (grayscale) from its favicon. */
export const faviconFor = (company: Company) =>
  company.favicon ??
  `https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`;

// Companies of the people who replied to the Goeist launch tweet, derived from
// their bios / website links. Each mark is resolved from the site favicon.
export const COMPANIES: Company[] = [
  { domain: "vercel.com", name: "Vercel" },
  { domain: "mastra.ai", name: "Mastra" },
  { domain: "roadmap.sh", name: "roadmap.sh" },
  { domain: "openui.com", name: "OpenUI" },
  {
    domain: "editframe.com",
    favicon: "https://editframe.com/images/favicon.png",
    name: "EditFrame",
  },
  { domain: "diceui.com", name: "DiceUI" },
  { domain: "shadcncraft.com", name: "shadcncraft" },
  { domain: "jam.dev", name: "Jam" },
  { domain: "ocelli.app", name: "Ocelli" },
  { domain: "clankerui.dev", name: "ClankerUI" },
  { domain: "illos.dev", name: "Illos" },
  { domain: "rareui.com", name: "rareui" },
  { domain: "tracwell.app", name: "Tracwell" },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    handle: "evilrabbit_",
    name: "Evil Rabbit",
    quote: "Insane work, Aniket! 🤯🔥",
    role: "Head of Creative Studio, Vercel",
    url: "https://x.com/evilrabbit_/status/2120972443657683111",
  },
  {
    handle: "zahlekhan",
    name: "Zahle Khan",
    quote: "Very whimsical. Me likey.",
    role: "Founding Engineer, OpenUI (ex-Razorpay)",
    url: "https://x.com/zahlekhan/status/2120971786431209916",
  },
  {
    handle: "dominikmartn",
    name: "Dom",
    quote: "Would've needed a rounded Geist in the past.",
    role: "Designer & builder, Ocelli",
    url: "https://x.com/dominikmartn/status/2120955173300548063",
  },
  {
    handle: "imarikchakma",
    name: "Arik Chakma",
    quote: "Noeist 🤌",
    role: "Engineering, roadmap.sh",
    url: "https://x.com/imarikchakma/status/2120956255015682410",
  },
  {
    handle: "saurra3h",
    name: "Saurabh",
    quote: "Will use it in my next project.",
    role: "Builder, Tracwell",
    url: "https://x.com/saurra3h/status/2121091876770226227",
  },
  {
    handle: "maxktz",
    name: "Max Katz",
    quote: "Woah, that is nice!",
    role: "Design Engineer, Mastra",
    url: "https://x.com/maxktz/status/2122415917652906308",
  },
  {
    handle: "SwamiMalode",
    name: "Swami",
    quote: "Wow, I love this.",
    role: "Design Engineer, rareui",
    url: "https://x.com/SwamiMalode/status/2120956121209065762",
  },
  {
    handle: "Navedux",
    name: "Naved",
    quote: "Using this for my next project. 🤩",
    role: "Design Engineer, Illos",
    url: "https://x.com/Navedux/status/2120958742485401699",
  },
  {
    handle: "sadmann17",
    name: "Sadman",
    quote: "Clean.",
    role: "Building DiceUI",
    url: "https://x.com/sadmann17/status/2120966990726943020",
  },
];

export const TWEET_STATS = {
  bookmarks: 81,
  likes: 216,
  replies: 54,
  reposts: 41,
};
