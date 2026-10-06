<p align="center">
  <img align="center" src="public/favicon.svg" height="96" />
  <h1 align="center">Shadcn Labs</h1>
</p>

<p align="center">
  Pushing the limits of the <a href="https://ui.shadcn.com/">shadcn/ui</a> ecosystem.<br/>
  AI agent recipes, terminal UI, video components, and more.
</p>

<p align="center">
  <a href="https://discord.gg/N6G36KhYK4"><img src="https://www.shieldcn.dev/discord/online-members/N6G36KhYK4.svg?variant=branded&size=xs" alt="Discord Members" /></a>
  <a href="https://x.com/shadcnlabs"><img src="https://www.shieldcn.dev/x/follow/shadcnlabs.svg?variant=branded&size=xs" alt="X Follow" /></a>
  <a href="https://bsky.app/profile/shadcnlabs.bsky.social"><img src="https://www.shieldcn.dev/bluesky/shadcnlabs.bsky.social.svg?variant=branded&size=xs" alt="Bluesky" /></a>
</p>

## Projects

| Project | Description | Stars |
| --- | --- | --- |
| [startercn](https://startercn.vercel.app) | shadcn/ui registry template with docs, landing page, and agent support | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/startercn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/startercn) |
| [skills](https://www.skills.sh/shadcn-labs/skills) | Agent skills for launching and promoting shadcn registries | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/skills.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/skills) |
| [termcn](https://termcn.dev) | Terminal UI components for React, built on Ink and OpenTUI | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/termcn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/termcn) |
| [framecn](https://framecn.dev) | Video components for React, built on Editframe | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/framecn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/framecn) |
| [ogimagecn](https://ogimagecn.com) | Open Graph image components for React, built on Satori | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/ogimagecn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/ogimagecn) |
| [agentcn](https://agentcn.run) | Customizable and production-ready AI agent recipes, built on Eve and Flue | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/agentcn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/agentcn) |
| [shadcn-cssinjs](https://shadcn-cssinjs.com) | CSS-in-JS port of shadcn/ui, built on StyleX | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/shadcn-cssinjs.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/shadcn-cssinjs) |
| [mcpcn](https://mcpcn.dev) | ChatGPT/Claude/MCP app UI components for React, built on Base UI | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/mcpcn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/mcpcn) |
| [emailcn](https://emailcn.run) | email components for React, built on React Email, MJML React and JSX Email | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/emailcn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/emailcn) |
| [pdfcn](https://pdfcn.dev) | PDF components for React, built on Takumi and Forme | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/pdfcn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/pdfcn) |
| [editorcn](https://editorcn.vercel.app) | Rich text editor components for React, built on Tiptap | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/editorcn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/editorcn) |
| [shadercn](https://shadercn.run) | shader components for React, built on vgpu and TypeGPU | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/shadercn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/shadercn) |
| [mdxcn](https://www.mdxcn.dev) | ASCII-framed diagram components for MDX, built on Motion | [![GitHub Stars](https://www.shieldcn.dev/github/stars/shadcn-labs/mdxcn.svg?variant=branded&size=xs)](https://github.com/shadcn-labs/mdxcn) |

## Sponsors

`/sponsors` is rendered on demand and shows, in order: live audience analytics, current sponsors, the sponsorship tiers, and a link to `/contact?inquiry=sponsorship` (the contact form preselects the inquiry type from `?inquiry=`).

### Tiers and checkout

Tiers live in `src/constants/sponsors.ts` and map to monthly subscription products under the **Shadcn Labs** brand (`brnd_0Np8Qij4f66tbqS6feAxJ`) in Dodo Payments live mode:

| Tier    | Price   | Product                     |
| ------- | ------- | --------------------------- |
| Diamond | $999/mo | `pdt_0Np8R91QgiIAaXxuaKJm2` |
| Gold    | $499/mo | `pdt_0Np8R90EdARmakSoI7chr` |
| Silver  | $199/mo | `pdt_0Np8R8ys1qvogPdS6LXXI` |

"Become a sponsor" buttons are Dodo static payment links (`https://checkout.dodopayments.com/buy/<product>`). Dodo prices cannot be edited: to change a price, create a new product and update `productId` and `price`. Keep each tier's `perks` in sync with the product description in Dodo.

### After checkout

Dodo redirects to `/sponsors/welcome?subscription_id=…&status=…`. The page ignores the editable `status` parameter and looks the subscription up with the Dodo API (`src/lib/dodo.ts`), accepting only subscriptions under the Shadcn Labs brand (`SPONSOR_BRAND_ID`). It shows one of: active (next steps, "Send your logo"), pending (re-checks every 5 seconds for a minute), failed/cancelled/expired ("Try again"), on hold/past due, not found, or unavailable when Dodo cannot be reached. The response is never cached. In `pnpm dev`, `?preview=active|pending|failed|on_hold` renders a state without a real subscription.

Sponsors manage their subscription (payment method, invoices, cancellation) in Dodo's hosted customer portal, `SPONSOR_PORTAL_URL`: a static link where they sign in with their checkout email. It is linked from the tiers note, the welcome page, and the refund policy. There is no webhook: Dodo already notifies the merchant of every transaction, and the welcome page reads state straight from the API.

Add active sponsors to `SPONSORS` in the same file. The sponsors section lists each tier's sponsors as logo blocks (larger for higher tiers) and always ends with one open "Your logo here" block that links to that tier's card.

Dodo Payments is the merchant of record. The tiers section says so and links `/terms` and `/refunds`; `/privacy` covers the site itself. Update each page's "Last updated" date whenever you change it.

### Analytics

The analytics block shows production traffic for the last 30 whole UTC days across projects listed in `src/constants/projects.ts` (excluding `skills`, which points to the external skills.sh directory), matched to Vercel projects by name or production domain. Projects can live in different Vercel teams: list every team in `VERCEL_TEAM_IDS` (the token's account must be a member of each), and each project is queried in the team that owns it. A team the token cannot access yet is skipped with a warning instead of failing the page; if two teams match the same project, the team listed first wins. Listed projects without Web Analytics enabled are skipped. Visitors are summed per project, not deduplicated across projects.

The snapshot holds per-project totals, daily series, and top countries and referrers, so the project filter (`src/components/sponsor-analytics.tsx`) recomputes everything in the browser without another Vercel query. The chart is the [EvilCharts](https://evilcharts.com) ECharts line chart, vendored in `src/components/evilcharts/` and excluded from lint so `shadcn add @evilcharts/echarts-line-chart` can update it.

Data comes from the [Vercel Web Analytics API](https://vercel.com/docs/analytics/web-analytics-api) in `src/lib/vercel-analytics.ts`. A refresh costs one project-list request per team plus five queries per project, fetched one project at a time (at most five requests in flight). Rate limiting is layered:

- The page is edge-cached for an hour with a day of stale-while-revalidate, so Vercel is queried roughly once an hour regardless of traffic.
- Each server instance caches the snapshot for an hour and deduplicates concurrent refreshes.
- The `X-RateLimit-Remaining`/`X-RateLimit-Reset` headers are tracked; a refresh that would not fit in the remaining budget is skipped, and a 429 pauses all requests until the reset time.
- A failed refresh serves the last good snapshot, marked stale, and is not retried for five minutes. A partial snapshot is never served.

Add these server-only variables to the ignored `.env` file for local development and to the Vercel project's environment variables for deployment:

```dotenv
VERCEL_TOKEN=<Vercel access token that can read every team below>
VERCEL_TEAM_IDS=<comma-separated team IDs, your own team first>
DODO_PAYMENTS_API_KEY=<live-mode Dodo API key>
DODO_PAYMENTS_ENVIRONMENT=live_mode
```

`DODO_PAYMENTS_ENVIRONMENT` defaults to test mode when unset, so production must set `live_mode`.

Use a long-lived access token from Vercel's account settings, scoped to every team in `VERCEL_TEAM_IDS` (or to the full account); a token scoped to one team cannot read the others, and CLI OAuth tokens expire. Never prefix these variables with `PUBLIC_` or commit `.env`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)

## Contributors

[![Contributors](https://contrib.rocks/image?repo=shadcn-labs/shadcn-labs.com)](https://github.com/shadcn-labs/shadcn-labs.com/graphs/contributors)

> Made with [contrib.rocks](https://contrib.rocks)

## Stats

![Stats](https://repobeats.axiom.co/api/embed/432fe3d2799ee308efb727827cf916db4d0bd60a.svg "Repobeats analytics image")

## Star History

<a href="https://www.star-history.com/?repos=shadcn-labs%2Fshadcn-labs.com&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=shadcn-labs/shadcn-labs.com&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=shadcn-labs/shadcn-labs.com&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=shadcn-labs/shadcn-labs.com&type=date&legend=top-left" />
 </picture>
</a>
