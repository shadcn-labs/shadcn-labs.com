import breezeui from "@/components/font/logos/breezeui.svg?raw";
import clankerui from "@/components/font/logos/clankerui.svg?raw";
import diceui from "@/components/font/logos/diceui.svg?raw";
import illos from "@/components/font/logos/illos.svg?raw";
import jam from "@/components/font/logos/jam.svg?raw";
import mastra from "@/components/font/logos/mastra.svg?raw";
import openui from "@/components/font/logos/openui.svg?raw";
import rareui from "@/components/font/logos/rareui.svg?raw";
import roadmap from "@/components/font/logos/roadmap.svg?raw";
import shadcncraft from "@/components/font/logos/shadcncraft.svg?raw";
import tracwell from "@/components/font/logos/tracwell.svg?raw";
import vercel from "@/components/font/logos/vercel.svg?raw";

export interface Company {
  name: string;
  url: string;
  svg: string;
  kind: "wordmark" | "mark";
}

export interface Testimonial {
  quote: string;
  name: string;
  handle: string;
  role: string;
  url: string;
  featured?: boolean;
}

export const avatarFor = (handle: string) => `https://unavatar.io/x/${handle}`;

export const COMPANIES: Company[] = [
  {
    kind: "mark",
    name: "Breeze UI",
    svg: breezeui,
    url: "https://www.breezeui.com/",
  },
  { kind: "wordmark", name: "Vercel", svg: vercel, url: "https://vercel.com" },
  { kind: "wordmark", name: "Mastra", svg: mastra, url: "https://mastra.ai" },
  { kind: "wordmark", name: "OpenUI", svg: openui, url: "https://openui.com" },
  { kind: "wordmark", name: "Illos", svg: illos, url: "https://illos.dev" },
  { kind: "mark", name: "roadmap.sh", svg: roadmap, url: "https://roadmap.sh" },
  { kind: "mark", name: "Dice UI", svg: diceui, url: "https://diceui.com" },
  {
    kind: "mark",
    name: "shadcncraft",
    svg: shadcncraft,
    url: "https://shadcncraft.com",
  },
  { kind: "mark", name: "Jam", svg: jam, url: "https://jam.dev" },
  {
    kind: "mark",
    name: "Clanker UI",
    svg: clankerui,
    url: "https://clankerui.dev",
  },
  { kind: "mark", name: "Rare UI", svg: rareui, url: "https://rareui.com" },
  {
    kind: "mark",
    name: "Tracwell",
    svg: tracwell,
    url: "https://tracwell.app",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    featured: true,
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
    featured: true,
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
  {
    handle: "radiumcoders",
    name: "Jay",
    quote: "using this rn, it's awesome",
    role: "Design Engineer, Breeze UI",
    url: "https://x.com/radiumcoders/status/2123310171254644888",
  },
];
