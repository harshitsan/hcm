# Role UX Review — screenshots

Full-page screenshots of every screen a role can reach, for design/UX review.
Generated with Playwright against the running app (mock data, no backend).

## platform-admin/
All **30** screens visible to the **Platform / Provider Admin** persona
(Anita Rao · `p1`), captured at 1440×900 @2x, light theme. Files are numbered in
sidebar order (`01-home.png` … `30-audit.png`).

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
