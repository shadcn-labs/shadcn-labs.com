import { LogosSwap } from "@/components/ui/logos-swap";
import { Marquee, MarqueeContent, MarqueeItem } from "@/components/ui/marquee";
import {
  Testimonial,
  TestimonialAuthor,
  TestimonialAuthorName,
  TestimonialAuthorTagline,
  TestimonialAvatar,
  TestimonialAvatarImg,
  TestimonialAvatarRing,
  TestimonialQuote,
} from "@/components/ui/testimonial";
import {
  avatarFor,
  COMPANIES,
  faviconFor,
  TESTIMONIALS,
} from "@/data/goeist-social";
import type { Company } from "@/data/goeist-social";

const CompanyLogo = ({ company }: { company: Company }) => (
  <span className="text-foreground/70 flex items-center gap-2">
    <img
      src={faviconFor(company)}
      alt=""
      loading="lazy"
      className="size-4 shrink-0 object-contain opacity-70 grayscale"
    />
    <span className="font-medium tracking-tight whitespace-nowrap">
      {company.name}
    </span>
  </span>
);

export const LovedByLogos = () => (
  <LogosSwap
    columnCount={6}
    className="w-full gap-x-4 gap-y-6 [--column-count:2] sm:[--column-count:3] lg:[--column-count:6]"
  >
    {COMPANIES.map((company) => (
      <CompanyLogo key={company.name} company={company} />
    ))}
  </LogosSwap>
);

export const LovedBy = () => (
  <Marquee className="border-border border-y [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
    <MarqueeContent>
      {TESTIMONIALS.map((item) => (
        <MarqueeItem key={item.handle} className="w-80">
          <a
            className="border-border block h-full border-r"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Testimonial>
              <TestimonialQuote>
                <p>&ldquo;{item.quote}&rdquo;</p>
              </TestimonialQuote>
              <TestimonialAuthor>
                <TestimonialAvatar>
                  <TestimonialAvatarImg
                    src={avatarFor(item.handle)}
                    alt={item.name}
                  />
                  <TestimonialAvatarRing />
                </TestimonialAvatar>
                <TestimonialAuthorName>{item.name}</TestimonialAuthorName>
                <TestimonialAuthorTagline>{item.role}</TestimonialAuthorTagline>
              </TestimonialAuthor>
            </Testimonial>
          </a>
        </MarqueeItem>
      ))}
    </MarqueeContent>
  </Marquee>
);
