export interface PressVideo {
  id: string;
  start?: number;
  title: string;
}

export interface PressNewsletter {
  description: string;
  faviconDomain?: string;
  publisher: string;
  title: string;
  url: string;
}

export const PRESS_VIDEOS: PressVideo[] = [
  {
    id: "bFlBogE3DGg",
    title: "Wait… Shadcn Now Has a PDF Library?",
  },
  {
    id: "uHQRroFvWc4",
    title: "Open Source Tool That Feels Illegal to Be Free (part 34)",
  },
  {
    id: "xxan67Tmx_4",
    start: 309,
    title:
      "I Reviewed 10 Indie SaaS Products & Found The Same 5 Mistakes | Project Review EP 10",
  },
  {
    id: "sfmm3P9zX1Y",
    title:
      "agentcn: shadcn for AI agents, one command drops a complete, ownable agent recipe into your project",
  },
  {
    id: "8bbAkVBIRnY",
    title:
      "GitHub Trending Today #45: claudish-to-english, openanalytics, deepseek-harness, human-review, ha.mr",
  },
  {
    id: "3DvmnCKlxdQ",
    start: 151,
    title:
      "GitHub Trending Today #31: wterm, openduck, termcn, GHFS, tegaki, xata, weft, Snapframe, lite-edit",
  },
];

export const PRESS_NEWSLETTERS: PressNewsletter[] = [
  {
    description:
      "pdfcn featured in Projects / Packages / Tools — a React library for making PDFs with prebuilt components and blocks.",
    publisher: "Next.js Weekly",
    title: "React 19.3 Is Here",
    url: "https://nextjsweekly.com/issues/142",
  },
  {
    description:
      "pdfcn featured in Code, Tools & Libraries — copy-paste components for making PDFs, taking the shadcn approach to PDF generation.",
    faviconDomain: "cooperpress.com",
    publisher: "React Status",
    title: "Signals come to React-Redux",
    url: "https://react.statuscode.com/issues/492",
  },
  {
    description:
      "termcn featured in Code, Tools & Libraries — a suite of terminal UI components for React, built on Ink and OpenTUI.",
    faviconDomain: "cooperpress.com",
    publisher: "React Status",
    title: "Meta releases its React design system",
    url: "https://react.statuscode.com/issues/481",
  },
];

export const PRESS_TWEETS: string[] = [
  "2101095603136856378",
  "2098005478995382369",
  "2088172435933642835",
  "2103016613838790783",
  "2088183823381225517",
  "2102194871708856683",
  "2088193913064399131",
];
