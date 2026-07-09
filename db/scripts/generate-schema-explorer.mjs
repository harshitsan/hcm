import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractPayload } from './schema-payload.mjs'

// Page template. Constraint: no backticks and no ${ inside — the page JS uses
// string concatenation only, so this literal stays inert.
const TEMPLATE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SatelliteHR — Prisma Schema Explorer</title>
<style>
:root{
  --bg:#ffffff; --fg:#1a1d23; --muted:#667085; --line:#e4e7ec; --panel:#f8fafc;
  --accent:#4f46e5; --accent-bg:#eef2ff; --gold:#b45309; --gold-bg:#fef3c7;
  --blue:#1d4ed8; --blue-bg:#dbeafe; --code:#0f766e;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0e1116; --fg:#e6e9ef; --muted:#8b93a3; --line:#242a35; --panel:#141922;
    --accent:#818cf8; --accent-bg:#20264a; --gold:#fbbf24; --gold-bg:#3a2c10;
    --blue:#93c5fd; --blue-bg:#172a4a; --code:#5eead4;
  }
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--fg);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex}
aside{width:290px;min-width:290px;height:100vh;display:flex;flex-direction:column;border-right:1px solid var(--line);background:var(--panel)}
.searchbox{padding:12px;border-bottom:1px solid var(--line)}
.searchbox input{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font:inherit;outline:none}
.searchbox input:focus{border-color:var(--accent)}
nav{flex:1;overflow-y:auto;padding:8px 0 24px}
nav details{margin:0}
nav summary{display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:6px 14px;font-weight:600;list-style:none;user-select:none}
nav summary::-webkit-details-marker{display:none}
nav summary .count{color:var(--muted);font-weight:400;font-size:12px}
nav ul{margin:0;padding:0;list-style:none}
nav li a{display:block;padding:4px 14px 4px 26px;color:var(--fg);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
nav li a:hover{background:var(--accent-bg)}
nav li a.active,nav li a.kbd{background:var(--accent-bg);color:var(--accent);font-weight:600}
.nores{padding:16px;color:var(--muted)}
main{flex:1;height:100vh;overflow-y:auto;padding:28px 36px 80px}
h1{margin:0 0 2px;font-size:22px}
.sub{color:var(--muted);margin:0 0 4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.moddoc{color:var(--muted);margin:8px 0 0;max-width:72ch;white-space:pre-wrap}
table{border-collapse:collapse;width:100%;margin-top:20px}
th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);text-align:left;padding:6px 10px;border-bottom:1px solid var(--line)}
td{padding:6px 10px;border-bottom:1px solid var(--line);vertical-align:top}
td.col{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;white-space:nowrap}
td.typ{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--code);white-space:nowrap}
td.doc{color:var(--muted);max-width:46ch}
.b{display:inline-block;font-size:11px;font-weight:600;border-radius:5px;padding:1px 6px;margin-right:4px;white-space:nowrap}
.b.pk{color:var(--gold);background:var(--gold-bg)}
.b.uq{color:var(--blue);background:var(--blue-bg)}
.b.opt,.b.list{color:var(--muted);background:var(--panel);border:1px solid var(--line)}
a.fk{color:var(--accent);text-decoration:none;font-weight:600}
a.fk:hover{text-decoration:underline}
h2{font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:36px 0 10px}
svg text{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;fill:var(--fg)}
svg .node rect{fill:var(--panel);stroke:var(--line);rx:7}
svg .node:hover rect{stroke:var(--accent)}
svg .node{cursor:pointer}
svg .center rect{fill:var(--accent-bg);stroke:var(--accent)}
svg .center{cursor:default}
svg line{stroke:var(--line);stroke-width:1.2}
.land{max-width:760px}
.land .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:20px}
.land .card{border:1px solid var(--line);border-radius:10px;padding:12px 14px;cursor:pointer;background:var(--panel)}
.land .card:hover{border-color:var(--accent)}
.land .card b{display:block;font-size:16px}
.land .card span{color:var(--muted);font-size:12px}
.hint{color:var(--muted);margin-top:14px}
kbd{border:1px solid var(--line);border-radius:4px;padding:0 5px;font-size:12px;background:var(--panel)}
</style>
</head>
<body>
<script id="data" type="application/json">__PAYLOAD__</script>
<aside>
  <div class="searchbox"><input id="q" type="search" placeholder="Search models…" autocomplete="off"></div>
  <nav id="tree"></nav>
</aside>
<main id="main"></main>
<script>
var DATA = JSON.parse(document.getElementById('data').textContent)
var tree = document.getElementById('tree')
var main = document.getElementById('main')
var q = document.getElementById('q')
var kbdIndex = 0
var flat = []

function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
function current(){
  var h = decodeURIComponent(location.hash.replace(/^#/,''))
  return DATA.models[h] ? h : null
}

function renderTree(){
  var cur = current()
  var html = ''
  DATA.schemas.forEach(function(s){
    var open = s.models.indexOf(cur) >= 0 ? ' open' : ''
    html += '<details' + open + '><summary><span>' + esc(s.name) + '</span><span class="count">' + s.models.length + '</span></summary><ul>'
    s.models.forEach(function(name){
      html += '<li><a href="#' + esc(name) + '"' + (name === cur ? ' class="active"' : '') + '>' + esc(name) + '</a></li>'
    })
    html += '</ul></details>'
  })
  tree.innerHTML = html
  var act = tree.querySelector('a.active')
  if (act) act.scrollIntoView({block:'nearest'})
}

function matchRank(query, m){
  var name = m.name.toLowerCase()
  var full = m.pgSchema + '.' + m.tableName
  if (name.indexOf(query) >= 0 || full.indexOf(query) >= 0) return 1
  var j = 0
  for (var i = 0; i < name.length && j < query.length; i++) if (name[i] === query[j]) j++
  return j === query.length ? 2 : 0
}

function renderSearch(){
  var query = q.value.trim().toLowerCase()
  if (!query){ renderTree(); return }
  var hits = []
  Object.keys(DATA.models).forEach(function(name){
    var r = matchRank(query, DATA.models[name])
    if (r) hits.push({name:name, r:r})
  })
  hits.sort(function(a,b){ return a.r - b.r || (a.name < b.name ? -1 : 1) })
  flat = hits.map(function(h){ return h.name })
  if (kbdIndex >= flat.length) kbdIndex = 0
  if (!flat.length){ tree.innerHTML = '<div class="nores">No models match "' + esc(query) + '"</div>'; return }
  var html = '<ul>'
  flat.forEach(function(name, i){
    var m = DATA.models[name]
    html += '<li><a href="#' + esc(name) + '"' + (i === kbdIndex ? ' class="kbd"' : '') + '>' + esc(name) + ' <span style="color:var(--muted)">· ' + esc(m.pgSchema) + '</span></a></li>'
  })
  tree.innerHTML = html + '</ul>'
  var k = tree.querySelector('a.kbd')
  if (k) k.scrollIntoView({block:'nearest'})
}

q.addEventListener('input', function(){ kbdIndex = 0; renderSearch() })
q.addEventListener('keydown', function(e){
  if (!q.value.trim()) return
  if (e.key === 'ArrowDown'){ e.preventDefault(); kbdIndex = Math.min(kbdIndex + 1, flat.length - 1); renderSearch() }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); kbdIndex = Math.max(kbdIndex - 1, 0); renderSearch() }
  else if (e.key === 'Enter' && flat.length){ location.hash = '#' + flat[kbdIndex] }
})

function badge(cls, label){ return '<span class="b ' + cls + '">' + label + '</span>' }

function fieldRow(f){
  var badges = ''
  if (f.pk) badges += badge('pk','PK')
  if (f.unique) badges += badge('uq','unique')
  if (f.opt) badges += badge('opt','optional')
  if (f.list) badges += badge('list','list')
  var typ = esc(f.type) + (f.list ? '[]' : '') + (f.opt ? '?' : '')
  var extra = ''
  if (f.fk){
    extra = '<a class="fk" href="#' + esc(f.fk.target) + '">→ ' + esc(f.fk.target) + '</a>'
    if (f.fk.from) extra += ' <span style="color:var(--muted)">(' + esc(f.fk.from.join(', ')) + ')</span>'
  } else if (f.def){
    extra = '<span style="color:var(--muted)">default: ' + esc(f.def) + '</span>'
  }
  return '<tr><td class="col">' + esc(f.col) + '</td><td class="typ">' + typ + '</td><td>' + badges + ' ' + extra + '</td><td class="doc">' + (f.doc ? esc(f.doc) : '') + '</td></tr>'
}

function nodeSvg(name, x, y, w, cls){
  return '<a class="node ' + cls + '" href="#' + esc(name) + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="26" rx="7"></rect>' +
    '<text x="' + (x + w/2) + '" y="' + (y + 17) + '" text-anchor="middle">' + esc(name) + '</text></a>'
}

function diagram(name){
  var inc = {}, out = {}
  DATA.edges.forEach(function(e){
    if (e.to === name && e.from !== name) inc[e.from] = 1
    if (e.from === name && e.to !== name) out[e.to] = 1
  })
  var L = Object.keys(inc).sort(), R = Object.keys(out).sort()
  if (!L.length && !R.length) return ''
  var rowH = 34, W = 900, colW = 260
  var rows = Math.max(L.length, R.length, 1)
  var H = rows * rowH + 20
  var cy = H / 2 - 13
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px;width:100%">'
  L.forEach(function(n, i){
    var y = 10 + i * rowH + (rows - L.length) * rowH / 2
    svg += '<line x1="' + (10 + colW) + '" y1="' + (y + 13) + '" x2="' + (W/2 - colW/2) + '" y2="' + (cy + 13) + '"></line>'
    svg += nodeSvg(n, 10, y, colW, '')
  })
  R.forEach(function(n, i){
    var y = 10 + i * rowH + (rows - R.length) * rowH / 2
    svg += '<line x1="' + (W/2 + colW/2) + '" y1="' + (cy + 13) + '" x2="' + (W - 10 - colW) + '" y2="' + (y + 13) + '"></line>'
    svg += nodeSvg(n, W - 10 - colW, y, colW, '')
  })
  svg += nodeSvg(name, W/2 - colW/2, cy, colW, 'center')
  return svg + '</svg><p class="hint">' + L.length + ' referencing · ' + R.length + ' referenced — click a box to jump</p>'
}

function renderModel(name){
  var m = DATA.models[name]
  var html = '<h1>' + esc(m.name) + '</h1><p class="sub">' + esc(m.pgSchema) + '.' + esc(m.tableName) + '</p>'
  if (m.doc) html += '<p class="moddoc">' + esc(m.doc) + '</p>'
  html += '<table><thead><tr><th>Column</th><th>Type</th><th>Constraints / relation</th><th>Notes</th></tr></thead><tbody>'
  m.fields.forEach(function(f){ html += fieldRow(f) })
  html += '</tbody></table>'
  var d = diagram(name)
  if (d) html += '<h2>Relations (1 hop)</h2>' + d
  main.innerHTML = html
  main.scrollTop = 0
}

function renderLanding(){
  var html = '<div class="land"><h1>SatelliteHR schema</h1><p class="sub">' + DATA.modelCount + ' models · ' + DATA.schemas.length + ' postgres schemas · ' + DATA.edges.length + ' relations</p><div class="cards">'
  DATA.schemas.forEach(function(s){
    html += '<div class="card" data-s="' + esc(s.name) + '"><b>' + esc(s.name) + '</b><span>' + s.models.length + ' models</span></div>'
  })
  html += '</div><p class="hint">Pick a schema, use the sidebar, or press <kbd>/</kbd> to search. <kbd>↑</kbd><kbd>↓</kbd> + <kbd>Enter</kbd> to navigate results.</p></div>'
  main.innerHTML = html
  main.querySelectorAll('.card').forEach(function(c){
    c.addEventListener('click', function(){
      q.value = ''
      renderTree()
      var det = null
      tree.querySelectorAll('details').forEach(function(d){
        if (d.querySelector('summary span').textContent === c.dataset.s) det = d
      })
      if (det){ det.open = true; det.scrollIntoView({block:'start'}) }
    })
  })
}

function route(){
  var cur = current()
  if (cur) renderModel(cur); else renderLanding()
  if (!q.value.trim()) renderTree()
}

document.addEventListener('keydown', function(e){
  if (e.key === '/' && document.activeElement !== q){ e.preventDefault(); q.focus() }
})
window.addEventListener('hashchange', route)
route()
</script>
</body>
</html>`

const here = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(here, '..', 'prisma', 'schema.prisma')
const outPath = path.join(here, '..', 'prisma', 'schema-explorer.html')

try {
  const payload = await extractPayload(schemaPath)
  const json = JSON.stringify(payload).replace(/</g, '\\u003c')
  fs.writeFileSync(outPath, TEMPLATE.replace('__PAYLOAD__', () => json))
  const kb = Math.round(fs.statSync(outPath).size / 1024)
  console.log('Wrote ' + outPath + ' (' + payload.modelCount + ' models, ' + kb + ' KB)')
} catch (err) {
  console.error('schema-explorer generation failed:\n', err.message || err)
  process.exit(1)
}
