import { getSecret } from "astro:env/server";
import DodoPayments, { NotFoundError } from "dodopayments";
import type { SubscriptionStatus } from "dodopayments/resources/subscriptions";

import { SPONSOR_BRAND_ID, SPONSOR_TIERS } from "@/constants/sponsors";
import type { SponsorTier } from "@/constants/sponsors";

let client: DodoPayments | undefined;

/**
 * Server-only Dodo client, or `null` when DODO_PAYMENTS_API_KEY is unset.
 * Defaults to test mode so a missing or misspelled
 * DODO_PAYMENTS_ENVIRONMENT can never silently hit live data.
 */
const dodoClient = (): DodoPayments | null => {
  const bearerToken = getSecret("DODO_PAYMENTS_API_KEY");
  if (!bearerToken) {
    return null;
  }
  client ??= new DodoPayments({
    bearerToken,
    environment:
      getSecret("DODO_PAYMENTS_ENVIRONMENT") === "live_mode"
        ? "live_mode"
        : "test_mode",
  });
  return client;
};

export type SponsorCheckout =
  | { kind: "confirmed"; status: SubscriptionStatus; tier: SponsorTier }
  /** No such subscription, or it belongs to another brand (e.g. Shadcn Weekly). */
  | { kind: "not-found" }
  /** Dodo is unreachable or the API key is missing; the payment may still be fine. */
  | { kind: "unavailable" };

/** Subscription IDs are short opaque tokens; anything else is not worth a request. */
const SUBSCRIPTION_ID = /^sub_[A-Za-z0-9]{8,64}$/u;

/**
 * Looks a checkout up in Dodo itself, so the redirect's own `status` query
 * parameter, which anyone can edit, is never trusted.
 */
export const getSponsorCheckout = async (
  subscriptionId: string | null
): Promise<SponsorCheckout> => {
  if (!subscriptionId || !SUBSCRIPTION_ID.test(subscriptionId)) {
    return { kind: "not-found" };
  }
  const dodo = dodoClient();
  if (!dodo) {
    console.warn("[dodo] DODO_PAYMENTS_API_KEY is not set");
    return { kind: "unavailable" };
  }
  try {
    const subscription = await dodo.subscriptions.retrieve(subscriptionId, {
      timeout: 10_000,
    });
    // The Dodo business also sells Shadcn Weekly; only this brand's tiers count.
    const tier =
      subscription.brand_id === SPONSOR_BRAND_ID
        ? SPONSOR_TIERS.find(
            (item) => item.productId === subscription.product_id
          )
        : undefined;
    return tier
      ? { kind: "confirmed", status: subscription.status, tier }
      : { kind: "not-found" };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { kind: "not-found" };
    }
    console.warn("[dodo] Subscription lookup failed", error);
    return { kind: "unavailable" };
  }
};
