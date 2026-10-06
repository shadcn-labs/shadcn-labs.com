import { ROUTES } from "./routes";
import { SITE } from "./site";

export type SponsorTierId = "silver" | "gold" | "diamond";

export interface SponsorTier {
  id: SponsorTierId;
  name: string;
  /** Monthly price in USD. Mirrors the Dodo product; Dodo prices are immutable. */
  price: number;
  /** Dodo Payments product, live mode, brand "Shadcn Labs" (brnd_0Np8Qij4f66tbqS6feAxJ). */
  productId: string;
  /** Mirrors the Dodo product description; update both together. */
  perks: string[];
}

export interface Sponsor {
  name: string;
  tier: SponsorTierId;
  /** Do-follow link, as promised by every tier. */
  url: string;
  /** Path under /public or an absolute URL. */
  logo: string;
}

/** Highest tier first: the sponsors page lists both tiers and sponsors in this order. */
export const SPONSOR_TIERS: SponsorTier[] = [
  {
    id: "diamond",
    name: "Diamond",
    perks: [
      "Top logo placement on the sponsors page, above Gold sponsors",
      "Diamond sponsor badge",
      "Do-follow link to your website",
      "Most prominent logo placement on every Shadcn Labs project site",
      "Logo in the README of every Shadcn Labs repository",
      "Monthly traffic report with top pages, referrers, and countries across all projects",
      "Priority on feature requests and integrations for your product",
      "Dedicated channel for your product on the Shadcn Labs Discord",
    ],
    price: 999,
    productId: "pdt_0Np8R91QgiIAaXxuaKJm2",
  },
  {
    id: "gold",
    name: "Gold",
    perks: [
      "Priority logo placement on the sponsors page, above Silver sponsors",
      "Gold sponsor badge",
      "Do-follow link to your website",
      "Logo on the docs and landing page of every Shadcn Labs project",
      "Logo in the README of every Shadcn Labs repository",
      "Welcome shoutout from @shadcnlabs on X, plus a monthly mention",
      "Dedicated channel for your product on the Shadcn Labs Discord",
    ],
    price: 499,
    productId: "pdt_0Np8R90EdARmakSoI7chr",
  },
  {
    id: "silver",
    name: "Silver",
    perks: [
      "Logo on the Shadcn Labs sponsors page",
      "Silver sponsor badge",
      "Do-follow link to your website or X profile",
      "Logo in the README of every Shadcn Labs repository",
      "Welcome shoutout from @shadcnlabs on X",
      "Support ongoing open-source work across the ecosystem",
    ],
    price: 199,
    productId: "pdt_0Np8R8ys1qvogPdS6LXXI",
  },
];

/** Active sponsors. Add an entry once a subscription starts and the logo arrives. */
export const SPONSORS: Sponsor[] = [];

/** Contact form preset used for custom packages and post-checkout logo handoff. */
export const SPONSORSHIP_CONTACT_URL = `${ROUTES.CONTACT}?inquiry=sponsorship`;

/** Dodo static payment link; `redirect_url` is required by Dodo. */
export const sponsorCheckoutUrl = (tier: SponsorTier): string => {
  const url = new URL(
    `https://checkout.dodopayments.com/buy/${tier.productId}`
  );
  url.searchParams.set("quantity", "1");
  url.searchParams.set(
    "redirect_url",
    new URL(SPONSORSHIP_CONTACT_URL, SITE.URL).toString()
  );
  return url.toString();
};
