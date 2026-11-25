import { LINKS } from "./links";
import { ROUTES } from "./routes";
import { SITE } from "./site";

export type SponsorTierId = "silver" | "gold" | "diamond";

export interface SponsorTier {
  id: SponsorTierId;
  name: string;
  /** Monthly price in USD. Mirrors the GitHub Sponsors tier and the Dodo product. */
  price: number;
  /**
   * GitHub Sponsors tier id. GitHub is the primary checkout, and its
   * `?tier_id=` URL opens this exact tier.
   */
  githubTierId: number;
  /**
   * Dodo Payments product, live mode, under SPONSOR_BRAND_ID. The fallback
   * checkout for sponsors who cannot pay through GitHub.
   */
  dodoProductId: string;
  /** Mirrors the GitHub Sponsors tier description; update both together. */
  perks: string[];
}

export interface Sponsor {
  name: string;
  tier: SponsorTierId;
  url: string;
  /** Path under /public or an absolute URL. */
  logo: string;
}

/** Dodo brand "Shadcn Labs"; the welcome page ignores every other brand. */
export const SPONSOR_BRAND_ID = "brnd_0Np8Qij4f66tbqS6feAxJ";

/** GitHub org that receives sponsorships for the whole ecosystem. */
export const GITHUB_SPONSORS_URL = LINKS.GITHUB_SPONSORS;

/**
 * GitHub's tier-selection URL. Appending `?tier_id=` skips the "select a tier"
 * step and opens checkout for that tier directly.
 */
const githubTierUrl = (tierId: number): string =>
  `${GITHUB_SPONSORS_URL}/sponsorships?tier_id=${tierId}`;

/**
 * Dodo's hosted customer portal (static link): sponsors sign in with their
 * checkout email to update payment methods, download invoices, or cancel.
 * It never expires; sign-in emails are only sent in live mode.
 */
export const SPONSOR_PORTAL_URL =
  "https://customer.dodopayments.com/login/bus_kihd1B1zgCtzCIhethwDQ";

/**
 * GitHub's billing settings, where a sponsor changes or cancels a GitHub
 * sponsorship: Settings → Billing and licensing → Additional billing details.
 */
export const SPONSOR_GITHUB_MANAGE_URL =
  "https://github.com/settings/billing/summary";

/** Highest tier first: the sponsors page lists tiers and sponsors in this order. */
export const SPONSOR_TIERS: SponsorTier[] = [
  {
    dodoProductId: "pdt_0Np8R91QgiIAaXxuaKJm2",
    githubTierId: 675_853,
    id: "diamond",
    name: "Diamond",
    perks: [
      "Largest logo on the Shadcn Labs sponsors page",
      "Largest logo on the homepage, sponsors page, and GitHub README of every participating project",
      "Logo in project sidebars where sponsor placements are available",
      "Welcome shoutout from @shadcnlabs on X, plus a monthly mention",
      "Direct line for feedback and feature requests",
      "Dedicated company channel in the Shadcn Labs Discord",
      "Monthly audience report with top pages, referrers, and countries",
    ],
    price: 999,
  },
  {
    dodoProductId: "pdt_0Np8R90EdARmakSoI7chr",
    githubTierId: 675_852,
    id: "gold",
    name: "Gold",
    perks: [
      "Larger logo on the Shadcn Labs sponsors page",
      "Larger logo on the homepage, sponsors page, and GitHub README of every participating project",
      "Welcome shoutout from @shadcnlabs on X",
      "Direct line for feedback and feature requests",
    ],
    price: 499,
  },
  {
    dodoProductId: "pdt_0Np8R8ys1qvogPdS6LXXI",
    githubTierId: 675_851,
    id: "silver",
    name: "Silver",
    perks: [
      "Logo on the Shadcn Labs sponsors page",
      "Logo on the sponsors page and GitHub README of every participating project",
      "Welcome shoutout from @shadcnlabs on X",
      "Support ongoing open-source work across the ecosystem",
    ],
    price: 199,
  },
];

/** Active sponsors. Add an entry once a subscription starts and the logo arrives. */
export const SPONSORS: Sponsor[] = [];

/** Contact form preset used for custom packages and post-checkout logo handoff. */
export const SPONSORSHIP_CONTACT_URL = `${ROUTES.CONTACT}?inquiry=sponsorship`;

/** Direct GitHub checkout for one tier, used for every primary CTA. */
export const sponsorGithubUrl = (tier: SponsorTier): string =>
  githubTierUrl(tier.githubTierId);

/**
 * Dodo static payment link for sponsors without a GitHub account. The
 * `redirect_url` is required; Dodo appends `subscription_id` and `status`, and
 * the welcome page confirms the status with Dodo rather than trusting the
 * query string.
 */
export const sponsorCheckoutUrl = (tier: SponsorTier): string => {
  const url = new URL(
    `https://checkout.dodopayments.com/buy/${tier.dodoProductId}`
  );
  url.searchParams.set("quantity", "1");
  url.searchParams.set(
    "redirect_url",
    new URL(ROUTES.SPONSORS_WELCOME, SITE.URL).toString()
  );
  return url.toString();
};
