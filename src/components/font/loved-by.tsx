import { XIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogosSwap } from "@/components/ui/logos-swap";
import { Marquee, MarqueeContent, MarqueeItem } from "@/components/ui/marquee";
import {
  Testimonial,
  TestimonialAuthor,
  TestimonialAuthorName,
  TestimonialAuthorTagline,
  TestimonialQuote,
} from "@/components/ui/testimonial";
import { avatarFor, COMPANIES, TESTIMONIALS } from "@/data/goeist-social";
import type {
  Company,
  Testimonial as TestimonialData,
} from "@/data/goeist-social";
import { cn } from "@/lib/utils";

const CompanyLogo = ({ company }: { company: Company }) => (
  <a
    href={company.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={company.name}
    className="text-foreground/70 hover:text-foreground flex h-6 items-center gap-2 grayscale transition-colors"
  >
    <span
      className={
        company.kind === "wordmark"
          ? "flex h-5 items-center [&>svg]:h-full [&>svg]:w-auto"
          : "flex size-5 shrink-0 items-center [&>svg]:size-full"
      }
      // oxlint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: company.svg }}
    />
    {company.kind === "mark" && (
      <span className="font-medium tracking-tight whitespace-nowrap">
        {company.name}
      </span>
    )}
  </a>
);

export const LovedByLogos = () => (
  <LogosSwap
    columnCount={8}
    className="w-full gap-x-4 gap-y-6 [--column-count:2] sm:[--column-count:3] lg:[--column-count:8]"
  >
    {COMPANIES.map((company) => (
      <CompanyLogo key={company.name} company={company} />
    ))}
  </LogosSwap>
);

const initialsFor = (name: string) =>
  name
    .split(/\s+/u)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const TestimonialBody = ({
  featured = false,
  item,
}: {
  featured?: boolean;
  item: TestimonialData;
}) => (
  <a
    className={cn(
      "border-border/60 bg-muted/30 hover:bg-muted relative block rounded-xl border transition-colors dark:bg-[#212017]",
      featured ? "h-44" : "h-36"
    )}
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
  >
    <Testimonial>
      <TestimonialQuote
        className={cn(
          "line-clamp-3",
          featured && "text-2xl tracking-[-0.02em]"
        )}
      >
        <p>{item.quote}</p>
      </TestimonialQuote>
      <TestimonialAuthor className="pr-12">
        <Avatar className="ring-foreground/10 row-span-2 ring-1 dark:ring-white/15">
          <AvatarImage
            src={avatarFor(item.handle)}
            alt={item.name}
            loading="lazy"
          />
          <AvatarFallback className="text-[10px] font-medium">
            {initialsFor(item.name)}
          </AvatarFallback>
        </Avatar>
        <TestimonialAuthorName className="min-w-0 truncate">
          {item.name}
        </TestimonialAuthorName>
        <TestimonialAuthorTagline className="line-clamp-1 min-w-0">
          {item.role}
        </TestimonialAuthorTagline>
      </TestimonialAuthor>
    </Testimonial>
    <XIcon className="text-muted-foreground absolute right-5 bottom-6 size-4" />
  </a>
);

const FEATURED = TESTIMONIALS.filter((item) => item.featured);
const REST = TESTIMONIALS.filter((item) => !item.featured);
const half = Math.ceil(REST.length / 2);
const ROWS = [
  { direction: "left", items: REST.slice(0, half) },
  { direction: "right", items: REST.slice(half) },
] as const;

export const LovedBy = () => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {FEATURED.map((item) => (
        <TestimonialBody key={item.handle} featured item={item} />
      ))}
    </div>
    <div className="space-y-3 mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      {ROWS.map((row) => (
        <Marquee key={row.direction}>
          <MarqueeContent direction={row.direction} speed={32}>
            {row.items.map((item) => (
              <MarqueeItem key={item.handle} className="w-72 px-1.5">
                <TestimonialBody item={item} />
              </MarqueeItem>
            ))}
          </MarqueeContent>
        </Marquee>
      ))}
    </div>
  </div>
);
