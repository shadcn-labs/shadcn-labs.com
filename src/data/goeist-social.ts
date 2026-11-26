import apppshot from "@/components/font/logos/apppshot.svg?raw";
import barclays from "@/components/font/logos/barclays.svg?raw";
import breezeui from "@/components/font/logos/breezeui.svg?raw";
import clankerui from "@/components/font/logos/clankerui.svg?raw";
import craftui from "@/components/font/logos/craftui.svg?raw";
import cuedesign from "@/components/font/logos/cuedesign.svg?raw";
import detentui from "@/components/font/logos/detentui.svg?raw";
import diceui from "@/components/font/logos/diceui.svg?raw";
import expokit from "@/components/font/logos/expokit.svg?raw";
import illos from "@/components/font/logos/illos.svg?raw";
import mastra from "@/components/font/logos/mastra.svg?raw";
import openui from "@/components/font/logos/openui.svg?raw";
import primitive8 from "@/components/font/logos/primitive8.svg?raw";
import rareui from "@/components/font/logos/rareui.svg?raw";
import reelfolio from "@/components/font/logos/reelfolio.svg?raw";
import roadmap from "@/components/font/logos/roadmap.svg?raw";
import sapientaste from "@/components/font/logos/sapientaste.svg?raw";
import shadcnblocks from "@/components/font/logos/shadcnblocks.svg?raw";
import shadcncraft from "@/components/font/logos/shadcncraft.svg?raw";
import smoothrecorder from "@/components/font/logos/smoothrecorder.svg?raw";
import spreadjam from "@/components/font/logos/spreadjam.svg?raw";
import tracwell from "@/components/font/logos/tracwell.svg?raw";
import tssaas from "@/components/font/logos/tssaas.svg?raw";
import uicoolkit from "@/components/font/logos/uicoolkit.svg?raw";
import vercel from "@/components/font/logos/vercel.svg?raw";
import vibecode from "@/components/font/logos/vibecode.svg?raw";

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
  {
    kind: "mark",
    name: "Barclays",
    svg: barclays,
    url: "https://www.barclays.co.uk/",
  },
  {
    kind: "mark",
    name: "Primitive8",
    svg: primitive8,
    url: "https://primitive8.com",
  },
  {
    kind: "mark",
    name: "Sapien Taste",
    svg: sapientaste,
    url: "https://sapientaste.com",
  },
  {
    kind: "mark",
    name: "VibeCode",
    svg: vibecode,
    url: "https://vibecode.fun",
  },
  { kind: "mark", name: "CraftUI", svg: craftui, url: "https://craftui.space" },
  {
    kind: "mark",
    name: "SmoothRecorder",
    svg: smoothrecorder,
    url: "https://smoothrecorder.com",
  },
  {
    kind: "mark",
    name: "UICoolkit",
    svg: uicoolkit,
    url: "https://uicoolkit.com",
  },
  {
    kind: "mark",
    name: "Detent UI",
    svg: detentui,
    url: "https://detentui.com",
  },
  {
    kind: "mark",
    name: "Apppshot",
    svg: apppshot,
    url: "https://apppshot.xyz",
  },
  {
    kind: "wordmark",
    name: "Cue Design",
    svg: cuedesign,
    url: "https://cuedesign.space",
  },
  {
    kind: "mark",
    name: "spreadjam",
    svg: spreadjam,
    url: "https://www.spreadjam.com/",
  },
  {
    kind: "mark",
    name: "shadcnblocks",
    svg: shadcnblocks,
    url: "https://shadcnblocks.com",
  },
  {
    kind: "mark",
    name: "reelfolio",
    svg: reelfolio,
    url: "https://reelfolio.io",
  },
  { kind: "mark", name: "Expo Kit", svg: expokit, url: "https://expokit.in" },
  { kind: "mark", name: "TS SaaS", svg: tssaas, url: "https://ts-saas.com" },
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
    quote: "damn this is crazyyyy 🤯🤯🤯",
    role: "Design Engineer, Breeze UI",
    url: "https://x.com/radiumcoders/status/2126006148793094452",
  },
  {
    handle: "SatyamVyas04",
    name: "savy",
    quote: "Lovely 🤌",
    role: "SWE, Barclays",
    url: "https://x.com/SatyamVyas04/status/2120954835180949665",
  },
  {
    handle: "quantapar",
    name: "manu",
    quote: "noicee 🔥",
    role: "Design Engineer, Clanker UI",
    url: "https://x.com/quantapar/status/2121115008402960751",
  },
  {
    handle: "Metagravity0",
    name: "max",
    quote: "banger",
    role: "Designer, Primitive8",
    url: "https://x.com/Metagravity0/status/2121163590371848537",
  },
  {
    handle: "oiharshit",
    name: "Harshit",
    quote: "Love this",
    role: "Designer & Builder, Sapien Taste",
    url: "https://x.com/oiharshit/status/2120963197725516035",
  },
  {
    handle: "rikventure",
    name: "Rik",
    quote:
      "ah this looks clean, i'd use this on my next vibecoded app to make it look less vibecoded",
    role: "Building TestDrive & VibeCode",
    url: "https://x.com/rikventure/status/2120954637356613993",
  },
  {
    handle: "iamncdai",
    name: "Chánh Đại",
    quote: "Wow 🔥",
    role: "Design Engineer, shadcncraft",
    url: "https://x.com/iamncdai/status/2121081825783415096",
  },
  {
    handle: "jia_seed",
    name: "jia",
    quote: "nice!",
    role: "Co-founder, SpreadJam",
    url: "https://x.com/jia_seed/status/2120967858532618262",
  },
  {
    handle: "Nil_phy_dreamer",
    name: "Nil",
    quote: "goated Goeist ...",
    role: "Founder, CraftUI",
    url: "https://x.com/Nil_phy_dreamer/status/2120991354625175889",
  },
  {
    handle: "mdanassaif",
    name: "Mohd Anas",
    quote: "Gonna use in next project , Looks so clean: )",
    role: "Building SmoothRecorder",
    url: "https://x.com/mdanassaif/status/2121135809827107260",
  },
  {
    handle: "nikhilshares",
    name: "Nikhil Yadav",
    quote: "This is nice man. Would love to try it in one of my projects soon.",
    role: "Designer, UICoolkit",
    url: "https://x.com/nikhilshares/status/2120970681626296468",
  },
  {
    handle: "next_gendev",
    name: "Deep",
    quote: "This is sickkkk fr. 🙌🔥",
    role: "Design Engineer, Detent UI",
    url: "https://x.com/next_gendev/status/2123048139984970207",
  },
  {
    handle: "itsmeekaran",
    name: "Karan",
    quote: "goat",
    role: "Designer, Expo Kit",
    url: "https://x.com/itsmeekaran/status/2120954300553929020",
  },
  {
    handle: "Prasanjit_ui",
    name: "Prasanjit Dey",
    quote: "Cool work",
    role: "Design Engineer, Apppshot",
    url: "https://x.com/Prasanjit_ui/status/2120969442092036268",
  },
  {
    handle: "kshvbgde",
    name: "keshav",
    quote: "bruh, this is so sick! putting this on my portfolio 🫪",
    role: "Design Engineer",
    url: "https://x.com/kshvbgde/status/2120962535402922276",
  },
  {
    handle: "Alok619308",
    name: "Alok",
    quote: "Amazinggggggg!!!!!!!",
    role: "Building Cue Design",
    url: "https://x.com/Alok619308/status/2120983817116950588",
  },
  {
    handle: "krishnasinghdev",
    name: "Krishna Singh",
    quote: "Awesome work 😎, it will be my default fonts now",
    role: "Building TS SaaS",
    url: "https://x.com/krishnasinghdev/status/2121104909483315578",
  },
  {
    handle: "YassineZaanouni",
    name: "Yassine Zaanouni",
    quote: "Fire 👌",
    role: "Design Engineer, shadcnblocks",
    url: "https://x.com/YassineZaanouni/status/2120957965201293707",
  },
];
