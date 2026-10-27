import {
  BlueskyIcon,
  DiscordIcon,
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  RedditIcon,
  ThreadsIcon,
  XIcon,
} from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SocialIcon } from "@/constants/social";
import { cn } from "@/lib/utils";

const ICONS = {
  bluesky: BlueskyIcon,
  discord: DiscordIcon,
  github: GitHubIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  reddit: RedditIcon,
  threads: ThreadsIcon,
  x: XIcon,
} as const satisfies Record<SocialIcon, typeof XIcon>;

// Multicolor svgl artwork keeps its detail through grayscale instead of
// brand colors; single-path marks use currentColor and follow the theme.
const GRAYSCALE_ICONS: ReadonlySet<SocialIcon> = new Set([
  "reddit",
  "instagram",
]);

export interface SocialListItem {
  name: string;
  url: string;
  icon: SocialIcon;
}

interface SocialListProps {
  items: SocialListItem[];
  className?: string;
}

export const SocialList = ({ items, className }: SocialListProps) => (
  <TooltipProvider>
    <ul className={cn("flex items-center gap-1", className)}>
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <li key={item.name} className="inline-flex">
            <Tooltip>
              <TooltipTrigger
                render={
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.name}
                    className={buttonVariants({
                      className: "text-muted-foreground",
                      size: "icon-sm",
                      variant: "ghost",
                    })}
                  />
                }
              >
                <Icon
                  className={cn(
                    "size-4",
                    GRAYSCALE_ICONS.has(item.icon) && "grayscale"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>{item.name}</TooltipContent>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  </TooltipProvider>
);
