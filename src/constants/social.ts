import { LINKS } from "@/constants/links";

export type SocialIcon =
  | "x"
  | "linkedin"
  | "github"
  | "discord"
  | "bluesky"
  | "reddit"
  | "instagram"
  | "threads";

export interface Social {
  name: string;
  url: string;
  icon: SocialIcon;
}

export const SOCIALS: Social[] = [
  {
    icon: "x",
    name: "X",
    url: LINKS.X,
  },
  {
    icon: "linkedin",
    name: "LinkedIn",
    url: LINKS.LINKEDIN,
  },
  {
    icon: "github",
    name: "GitHub",
    url: LINKS.GITHUB,
  },
  {
    icon: "discord",
    name: "Discord",
    url: LINKS.DISCORD,
  },
  {
    icon: "bluesky",
    name: "Bluesky",
    url: LINKS.BLUESKY,
  },
  {
    icon: "reddit",
    name: "Reddit",
    url: LINKS.REDDIT,
  },
  {
    icon: "instagram",
    name: "Instagram",
    url: LINKS.INSTAGRAM,
  },
  {
    icon: "threads",
    name: "Threads",
    url: LINKS.THREADS,
  },
];
