# Role UX Review — screenshots

Full-page screenshots of every screen a role can reach, for design/UX review.
Generated with Playwright against the running app (mock data, no backend).

## platform-admin/
The **Platform / Provider Admin console** (persona Anita Rao · `p1`, *platform
scope*) — 10 screens, 1440×900 @2x, light theme, numbered in sidebar order
(`01-home.png` … `10-notifications.png`): Platform Home, Portfolio, Companies,
Company Setup, Org & Master Data, Roles & Security, Import/Export, Audit Log,
Profile, Notifications.

Company-operational screens (leave, hiring, ESS, directory, …) are **not** part
of the platform console — the admin reaches them by **opening a company** (which
switches to company scope and reveals that tenant's operational nav).

## Regenerate

```bash
cd app
npm i -D playwright            # once
npx playwright install chromium   # once
npm run dev                    # in another terminal (or set BASE_URL to the deploy)
npm run shots:platform-admin
```

Options:
- `BASE_URL=https://sattelite-hr.vercel.app npm run shots:platform-admin` — shoot the deploy instead of localhost.
- `THEME=dark npm run shots:platform-admin` — capture dark mode.

The script (`app/scripts/screenshot-platform-admin.mjs`) "logs in" by seeding
`localStorage` (`shr.persona=p1`, `shr.company=c1`) then walks every route in the
HashRouter. To add another role, copy it and change `PERSONA` (p2 OpsMaven,
p3 Priya/HR, p4 Rahul/Manager, p5 Meera/Employee, p6 Lim Wei) and the route list.
