# Role UX Review — screenshots

Full-page screenshots of every screen a role can reach, for design/UX review.
Generated with Playwright against the running app (mock data, no backend).

One folder per role, each capturing that role's actual nav-scoped screens
(1440×900 @2x, light), numbered in sidebar order. Generated with
`npm run shots` (or `ROLE=<slug> npm run shots`).

| Folder | Persona | Scope | Screens |
|--------|---------|-------|---------|
| `platform-admin/` | Anita Rao (`p1`) | platform console | 11 |
| `portfolio-manager/` | OpsMaven (`p2`) | platform/portfolio console | 11 |
| `hr-admin/` | Priya Sharma (`p3`) | company (full HR app) | 28 |
| `people-manager/` | Rahul Verma (`p4`) | company (team subset) | 17 |
| `employee/` | Meera Iyer (`p5`) | company (self-service) | 13 |

Platform roles land on the **platform console**; company-operational screens
appear after **opening a company** (company scope). `screenshot-platform-admin.mjs`
remains for the platform set alone; `screenshot-roles.mjs` does all roles.

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
