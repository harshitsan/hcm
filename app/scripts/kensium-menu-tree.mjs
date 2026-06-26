/**
 * Stage 1 of the site map — extract the full Kensium navigation tree.
 *
 * Walks ul.main-navigation recursively (top → subnav → dropdown) capturing each
 * item's text + href + onclick + children, then opens the Configuration mega-page
 * and extracts its grouped items. Writes app/.auth/menu-tree.json.
 *
 *   node scripts/kensium-menu-tree.mjs
 */
import { withSession, CONFIG } from './kensium-session.mjs'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', '.auth', 'menu-tree.json')

await withSession(async ({ page }) => {
  await page.goto(CONFIG.url + 'Home/Home', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  // 1) Recursive main-navigation tree
  const tree = await page.evaluate(() => {
    const norm = t => (t || '').replace(/\s+/g, ' ').trim()
    const walk = ul => [...ul.children].filter(li => li.tagName === 'LI').map(li => {
      const a = li.querySelector(':scope > a')
      const sub = li.querySelector(':scope > ul')
      return {
        text: norm(a?.textContent),
        href: a?.getAttribute('href') || null,
        onclick: a?.getAttribute('onclick') || null,
        children: sub ? walk(sub) : [],
      }
    }).filter(n => n.text || n.children.length)
    const nav = document.querySelector('ul.main-navigation')
    return nav ? walk(nav) : []
  })

  // 2) Configuration mega-page
  const cfg = tree.find(n => /^configuration$/i.test(n.text))
  let configPage = null, configUrl = null
  if (cfg?.href) {
    configUrl = new URL(cfg.href, CONFIG.url).href
    await page.goto(configUrl, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    configPage = await page.evaluate(() => {
      const norm = t => (t || '').replace(/\s+/g, ' ').trim()
      // breadcrumb candidates (to learn the selector)
      const bcSel = ['.breadcrumb', '#breadcrumb', '.breadcrumbs', 'nav[aria-label=breadcrumb]', '.page-breadcrumb']
      const breadcrumb = bcSel.map(s => ({ sel: s, text: norm(document.querySelector(s)?.textContent) })).filter(x => x.text)
      // group columns: a heading followed by a list of items (links / li / spans with onclick)
      const groups = [...document.querySelectorAll('h1,h2,h3,h4,strong,.panel-heading,.box-title,legend')]
        .map(h => {
          const title = norm(h.textContent)
          // collect nearby clickable items: walk to the next UL/list within the same container
          const container = h.closest('div,section,td,li') || h.parentElement
          const items = container
            ? [...container.querySelectorAll('a, li, [onclick], [href]')]
                .map(el => ({ text: norm(el.textContent), href: el.getAttribute('href') || null, onclick: el.getAttribute('onclick') || null }))
                .filter(i => i.text && i.text !== title)
            : []
          return { title, count: items.length, items: items.slice(0, 60) }
        })
        .filter(g => g.title && g.count)
      // also a flat anchor dump as fallback
      const anchors = [...document.querySelectorAll('a[href], [onclick]')]
        .map(a => ({ text: norm(a.textContent), href: a.getAttribute('href') || null, onclick: a.getAttribute('onclick') || null }))
        .filter(a => a.text)
      return { breadcrumb, groups, anchorCount: anchors.length, anchors: anchors.slice(0, 200) }
    })
  }

  await mkdir(path.dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify({ baseUrl: CONFIG.url, configUrl, tree, configPage }, null, 2))

  // digest
  const count = ns => ns.reduce((n, x) => n + 1 + count(x.children || []), 0)
  console.log('TOP MENUS:')
  for (const t of tree) console.log(`  • ${t.text}  → href=${t.href || '—'}  children=${t.children.length}`)
  console.log('TOTAL nav nodes:', count(tree))
  if (configPage) {
    console.log('\nCONFIG breadcrumb candidates:', JSON.stringify(configPage.breadcrumb))
    console.log('CONFIG groups:', configPage.groups.map(g => `${g.title}(${g.count})`).join(' | '))
    console.log('CONFIG anchor count:', configPage.anchorCount)
  }
  console.log('\nwrote', OUT)
})
