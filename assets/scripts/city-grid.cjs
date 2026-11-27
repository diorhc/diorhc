#!/usr/bin/env node
// Isometric "contribution city" for the profile README.
// One building = one week of the last year. The skyline is decorative and
// stable (seeded by week index); real GitHub activity lights a week up:
// lime roof, lit windows, glow and a little extra height.
//
// Usage:
//   node assets/scripts/city-grid.cjs --refresh --user diorhc --out assets/city
//   node assets/scripts/city-grid.cjs --calendar-json path/to/contributions.json --out dir
const fs = require('node:fs/promises');
const path = require('node:path');

// ---------- Contribution data (self-contained; replaces the old readme-city.cjs) ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Checks and sorts [{ date: 'YYYY-MM-DD', count }]; throws on bad data. */
function validateDays(days) {
  if (!Array.isArray(days) || days.length === 0) throw new Error('No contribution days');
  const seen = new Set();
  const clean = days.map((d) => {
    const count = Number(d && d.count);
    if (!d || !DATE_RE.test(d.date) || !Number.isInteger(count) || count < 0) {
      throw new Error('Bad contribution day: ' + JSON.stringify(d));
    }
    if (seen.has(d.date)) throw new Error('Duplicate contribution day ' + d.date);
    seen.add(d.date);
    return { date: d.date, count };
  });
  return clean.sort((a, b) => a.date.localeCompare(b.date));
}

async function getText(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Official API: needs a token (GITHUB_TOKEN in Actions is enough for public data). */
async function fetchViaGraphQL(user, token) {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
    totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
  const body = JSON.parse(
    await getText('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'contribution-city' },
      body: JSON.stringify({ query, variables: { login: user } }),
    })
  );
  const cal = body?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error('GraphQL: ' + JSON.stringify(body.errors || body).slice(0, 200));
  const days = cal.weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
  return { source: 'graphql', total: cal.totalContributions, days };
}

/** Public profile calendar (no token): each cell's tooltip says how many contributions. */
async function fetchViaProfile(user) {
  const html = await getText(`https://github.com/users/${encodeURIComponent(user)}/contributions`, {
    headers: { 'User-Agent': 'contribution-city' },
  });
  const dateById = new Map();
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const date = /data-date="([^"]+)"/.exec(m[0])?.[1];
    const id = /\bid="([^"]+)"/.exec(m[0])?.[1];
    if (date && id) dateById.set(id, date);
  }
  const days = [];
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const date = dateById.get(m[1]);
    if (!date) continue;
    const n = /^(\d+)\s+contribution/.exec(m[2].trim());
    days.push({ date, count: n ? Number(n[1]) : 0 });
  }
  if (days.length < 300) throw new Error(`Profile calendar: only ${days.length} days parsed (markup changed?)`);
  return { source: 'profile', total: days.reduce((a, d) => a + d.count, 0), days };
}

/** Last year of contributions: GraphQL when a token is set, else (or on failure) the public calendar. */
async function fetchCalendar(user) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    try {
      return await fetchViaGraphQL(user, token);
    } catch (e) {
      console.warn('GraphQL failed, using the public calendar: ' + e.message);
    }
  }
  return fetchViaProfile(user);
}

const W = 1600;
const H = 420;
// Classic isometric grid. Tiles are laid out as a horizontal band: depth rows
// (c + r) are screen rows, lateral position (c - r) runs left to right.
const DEPTH = 4; // rows of buildings, back to front
const LATERAL = 15; // lateral half-range; slots per row ~= LATERAL + 1
const A = 46; // half tile width in px
const B = A * 0.56; // half tile height in px
const STOREY = 21; // px per height unit

const THEMES = {
  dark: {
    bg1: '#14181d', bg2: '#0c0f13', frame: '#2b3138', grid: '#3a424c',
    top1: '#77808b', top2: '#434a53', left1: '#30363e', left2: '#1d2228',
    right1: '#252b32', right2: '#15191e', edge: '#c3cbd4', edgeSoft: '#58616b',
    window: '#262b32', windowEdge: '#3d444d', lime: '#c2ef1f', limeDeep: '#86a80f',
    glow: '#b8f000', shadow: '#000000', shadowOpacity: 0.55,
  },
  light: {
    bg1: '#fbfbfc', bg2: '#eef0f3', frame: '#d6dae0', grid: '#c3c9d1',
    top1: '#ffffff', top2: '#eceff3', left1: '#f4f6f8', left2: '#d9dee5',
    right1: '#e3e7ec', right2: '#c7ced7', edge: '#3d4651', edgeSoft: '#9aa3ae',
    window: '#d3d9e0', windowEdge: '#a9b2bd', lime: '#b8ea12', limeDeep: '#7ea300',
    glow: '#c4f20f', shadow: '#55606d', shadowOpacity: 0.22,
  },
};

const n = (v) => Number(v.toFixed(2));
const esc = (v) => String(v).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));

// Deterministic pseudo-random in [0,1) per integer seed.
function rand(seed) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

function weeks(days) {
  const sorted = validateDays(days);
  const out = [];
  for (let i = sorted.length; i > 0 && out.length < 52; i -= 7) {
    const chunk = sorted.slice(Math.max(0, i - 7), i);
    out.unshift({ start: chunk[0].date, end: chunk.at(-1).date, count: chunk.reduce((a, d) => a + d.count, 0) });
  }
  return out;
}

const C = { x: A, y: B };
const R = { x: -A, y: B };
// Depth row d sits at screen y = ORIGIN.y + d * B; centre the band low in the card.
const ORIGIN = { x: W / 2, y: H - 118 - DEPTH * B };

const pt = (c, r, h = 0) => ({ x: ORIGIN.x + c * C.x + r * R.x, y: ORIGIN.y + c * C.y + r * R.y - h });

// All tiles of the band, ordered left to right (then back to front).
function slots() {
  const out = [];
  for (let d = 0; d < DEPTH; d++) {
    for (let l = -LATERAL; l <= LATERAL; l++) {
      if (((l - d) % 2 + 2) % 2) continue;
      out.push({ c: (d + l) / 2, r: (d - l) / 2, d, l });
    }
  }
  return out.sort((p, q) => p.l - q.l || p.d - q.d);
}
const poly = (pts) => pts.map((p) => `${n(p.x)},${n(p.y)}`).join(' ');

function windowsOnFace(p0, edge, height, cols, rows, litMask, theme, side) {
  // p0: bottom-left corner of the face, edge: vector along the face base.
  const out = [];
  const padU = 0.18, padV = 0.16;
  const cellU = (1 - padU * 2) / cols;
  const cellV = (height - STOREY * 0.5) / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const u0 = padU + i * cellU + cellU * 0.22;
      const u1 = padU + (i + 1) * cellU - cellU * 0.22;
      const v0 = STOREY * padV * 2 + j * cellV + cellV * 0.24;
      const v1 = STOREY * padV * 2 + (j + 1) * cellV - cellV * 0.24;
      if (v1 - v0 < 3) continue;
      const q = (u, v) => ({ x: p0.x + edge.x * u, y: p0.y + edge.y * u - v });
      const lit = litMask(i, j);
      out.push(`<polygon class="${lit ? 'win-lit' : 'win'}${side}" points="${poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)])}"/>`);
    }
  }
  return out.join('');
}

// Draws one box: tile rectangle [c0,c1]x[r0,r1], floor height z0, height h.
function drawBox(c0, r0, c1, r1, z0, h, o = {}) {
  const lift = (p, z) => ({ x: p.x, y: p.y - z });
  const a = lift(pt(c0, r0), z0), b = lift(pt(c1, r0), z0), cc = lift(pt(c1, r1), z0), d = lift(pt(c0, r1), z0);
  const up = (p) => lift(p, h);
  const parts = [];
  parts.push(`<polygon class="face-left" points="${poly([d, cc, up(cc), up(d)])}"/>`);
  parts.push(`<polygon class="face-right" points="${poly([cc, b, up(b), up(cc)])}"/>`);
  if (o.windows) {
    const front = { x: cc.x - d.x, y: cc.y - d.y };
    const right = { x: b.x - cc.x, y: b.y - cc.y };
    if (o.strip) parts.push(windowsOnFace(d, front, h, 2, 1, () => true, null, ' strip'));
    else parts.push(windowsOnFace(d, front, h, 2, o.rows, o.lit(1), null, ''));
    parts.push(windowsOnFace(cc, right, h, 1, o.rows, o.lit(2), null, ' side'));
  }
  const roof = [up(a), up(b), up(cc), up(d)];
  parts.push(`<polygon class="roof" points="${poly(roof)}"/>`);
  if (o.fog) parts.push(`<polygon class="fog" style="opacity:${o.fog}" points="${poly([d, cc, b, up(b), up(a), up(d)])}"/>`);
  if (o.litRoof) {
    parts.push(`<polygon class="roof-glow" points="${poly(roof)}"/>`);
    parts.push(`<polygon class="roof-lit" points="${poly(roof)}"><animate attributeName="opacity" values="1;0.78;1" dur="${o.pulse}s" repeatCount="indefinite"/></polygon>`);
  }
  parts.push(`<polyline class="edge" points="${poly([up(d), up(a), up(b)])}"/>`);
  parts.push(`<polyline class="edge-strong" points="${poly([d, up(d), up(cc), up(b)])}"/>`);
  parts.push(`<line class="edge-strong" x1="${n(cc.x)}" y1="${n(cc.y)}" x2="${n(up(cc).x)}" y2="${n(up(cc).y)}"/>`);
  return { svg: parts.join(''), top: lift(pt((c0 + c1) / 2, (r0 + r1) / 2), z0 + h), z: z0 + h };
}

function building(slot, week, index, opts) {
  const { c, r, d: row } = slot;
  const seed = index * 7919 + 17;
  const tower = rand(seed) > 0.86;
  const base = tower ? 5 + Math.floor(rand(seed + 1) * 3) : 1 + Math.floor(rand(seed + 2) * 3.2);
  const active = week.count > 0;
  const bonus = active ? Math.min(2.5, Math.log2(week.count + 1)) : 0;
  const units = base + bonus;
  const h = units * STOREY;
  const m = 0.13 + rand(seed + 3) * 0.06;
  const fog = opts.fog ? n((DEPTH - 1 - row) * 0.13) : 0;
  const litRate = active ? 0.55 + Math.min(0.4, week.count / 10) : 0;
  const parts = [];

  const sh = 0.32;
  parts.push(`<polygon class="shadow" points="${poly([pt(c + m, r + 1 - m), pt(c + 1 - m, r + 1 - m), pt(c + 1 - m + sh, r + 1 - m + sh * 0.4), pt(c + m + sh, r + 1 - m + sh * 0.4)])}"/>`);
  const hasWindows = active || rand(seed + 5) > 0.5;
  const main = drawBox(c + m, r + m, c + 1 - m, r + 1 - m, 0, h, {
    windows: hasWindows,
    strip: tower && active,
    rows: Math.min(6, Math.max(1, Math.round(units * 0.8))),
    lit: (salt) => (i, j) => active && rand(seed * 31 + salt + i * 13 + j * 101) < litRate,
    fog,
    litRoof: active && !(opts.details && tower),
    pulse: (3.2 + rand(seed + 9) * 2).toFixed(1),
  });
  parts.push(main.svg);

  if (opts.details) {
    if (tower) {
      // Setback crown and an antenna with a beacon.
      const k = m + 0.12;
      const crown = drawBox(c + k, r + k, c + 1 - k, r + 1 - k, h, STOREY * 1.3, { fog, litRoof: active, pulse: '3.6' });
      parts.push(crown.svg);
      const top = crown.top;
      parts.push(`<line class="antenna" x1="${n(top.x)}" y1="${n(top.y)}" x2="${n(top.x)}" y2="${n(top.y - 30)}"/>`);
      parts.push(`<circle class="${active ? 'beacon-lit' : 'beacon'}" cx="${n(top.x)}" cy="${n(top.y - 31)}" r="2.6">${active ? '<animate attributeName="opacity" values="1;0.15;1" dur="1.8s" repeatCount="indefinite"/>' : ''}</circle>`);
    } else if (rand(seed + 11) > 0.55) {
      // Small rooftop unit.
      const k = 0.3 + rand(seed + 12) * 0.1;
      parts.push(drawBox(c + k, r + k, c + 1 - k - 0.08, r + 1 - k, h, STOREY * 0.38, { fog }).svg);
    }
  }
  const title = `${week.start} – ${week.end}: ${week.count} contribution${week.count === 1 ? '' : 's'}`;
  return { depth: (c + r) * 1000 + (c - r), svg: `<g><title>${esc(title)}</title>${parts.join('')}</g>` };
}

// Visual presets to compare; the README uses one of them.
const STYLES = {
  base: { glow: false, details: false, fog: false, floor: 'grid' },
  neon: { glow: true, details: false, fog: false, floor: 'grid' },
  depth: { glow: true, details: true, fog: true, floor: 'grid' },
  circuit: { glow: true, details: true, fog: true, floor: 'circuit' },
};

// Circuit traces in the floor plane: each runs in from the left edge along a
// horizontal lane in front of the city, then turns and climbs to a building.
function circuit(targets) {
  const lanes = [...targets].sort((p, q) => q.slot.l - p.slot.l);
  const out = { traces: [], nodes: [], pulses: [] };
  lanes.forEach((tgt, k) => {
    const { c, r } = tgt.slot;
    const lane = DEPTH + 0.45 + k * 0.2;
    const sc = c + 0.5, sr = r + 1; // front edge midpoint of the tile
    const br = lane - sc; // bend: same c, r grows until c + r = lane
    const leftL = -(LATERAL + 8);
    const ec = (lane + leftL) / 2, er = (lane - leftL) / 2;
    const p0 = pt(ec, er), p1 = pt(sc, br), p2 = pt(sc, sr);
    const d = 'M' + n(p0.x) + ' ' + n(p0.y) + ' L' + n(p1.x) + ' ' + n(p1.y) + ' L' + n(p2.x) + ' ' + n(p2.y);
    out.traces.push('<path class="' + (tgt.active ? 'trace-lit' : 'trace') + '" d="' + d + '"/>');
    out.nodes.push('<circle class="' + (tgt.active ? 'node-lit' : 'node') + '" cx="' + n(p1.x) + '" cy="' + n(p1.y) + '" r="' + (tgt.active ? 4.2 : 3.4) + '"/>');
    if (tgt.active) {
      const dur = (3.5 + (k % 3) * 0.7).toFixed(1);
      const motion = '<animateMotion dur="' + dur + 's" repeatCount="indefinite" path="' + d + '"/>';
      out.pulses.push('<circle class="pulse-glow" r="9">' + motion + '</circle>');
      out.pulses.push('<circle class="pulse" r="3.4">' + motion + '</circle>');
    }
  });
  return out;
}

function renderCity(snapshot, themeName, opts = STYLES.base) {
  const t = THEMES[themeName];
  const ws = weeks(snapshot.days);
  const all = slots();
  // Leave a few tiles empty (stable choice) so the city breathes.
  const empty = new Set(all.map((s, i) => [rand(i * 104729 + 7), i]).sort((p, q) => p[0] - q[0]).slice(0, Math.max(0, all.length - ws.length)).map((p) => p[1]));
  const used = all.filter((_, i) => !empty.has(i));
  const blocks = ws.map((w, i) => building(used[i], w, i, opts)).sort((p, q) => p.depth - q.depth);
  const activeSlots = ws.map((w, i) => ({ slot: used[i], active: w.count > 0 })).filter((x) => x.active);

  // Lime light pooling on the floor under active buildings.
  const floorGlow = opts.glow
    ? activeSlots.map(({ slot: { c, r } }) => '<polygon class="floor-glow" points="' + poly([pt(c - 0.35, r - 0.35), pt(c + 1.35, r - 0.35), pt(c + 1.35, r + 1.35), pt(c - 0.35, r + 1.35)]) + '"/>').join('')
    : '';
  let traces = '';
  if (opts.floor === 'circuit') {
    // Active weeks plus a few quiet decorative traces.
    const quiet = ws.map((w, i) => ({ slot: used[i], active: false, w, i })).filter((x) => !x.w.count && rand(x.i * 37 + 5) > 0.82 && x.slot.d >= 1);
    const cir = circuit([...activeSlots, ...quiet]);
    traces = '<g mask="url(#fade)">' + cir.traces.join('') + cir.nodes.join('') + cir.pulses.join('') + '</g>';
  }

  // Floor lattice: lines of constant c and constant r, clipped to the band.
  const grid = [];
  const ext = LATERAL + DEPTH + 4;
  for (let k = -ext; k <= ext; k++) {
    grid.push(`<line x1="${n(pt(k, -ext).x)}" y1="${n(pt(k, -ext).y)}" x2="${n(pt(k, ext).x)}" y2="${n(pt(k, ext).y)}"/>`);
    grid.push(`<line x1="${n(pt(-ext, k).x)}" y1="${n(pt(-ext, k).y)}" x2="${n(pt(ext, k).x)}" y2="${n(pt(ext, k).y)}"/>`);
  }
  const bandTop = n(ORIGIN.y - 2 * B), bandBottom = n(ORIGIN.y + (DEPTH + 2) * B);
  const gridOpacity = opts.floor === 'circuit' ? 0.45 : 1;

  const active = ws.filter((w) => w.count > 0).length;
  const total = ws.reduce((a, w) => a + w.count, 0);
  const desc = `${ws.length} buildings, one per week from ${ws[0].start} to ${ws.at(-1).end}. ${active} active weeks (${total} public contributions) glow lime. Architecture is decorative.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title description">
<title id="title">${esc(snapshot.user)} — contribution city</title>
<desc id="description">${esc(desc)}</desc>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
<linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.top1}"/><stop offset="1" stop-color="${t.top2}"/></linearGradient>
<linearGradient id="left" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${t.left1}"/><stop offset="1" stop-color="${t.left2}"/></linearGradient>
<linearGradient id="right" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${t.right1}"/><stop offset="1" stop-color="${t.right2}"/></linearGradient>
<linearGradient id="gridFade" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".12" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="gridFadeY" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff"/><stop offset=".75" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="fade"><rect x="60" y="0" width="${W - 120}" height="${H}" fill="url(#gridFade)"/></mask>
<mask id="fadeY"><rect x="0" y="${bandTop}" width="${W}" height="${n(bandBottom - bandTop)}" fill="url(#gridFadeY)"/></mask>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<style>
.grid line{stroke:${t.grid};stroke-width:1.1}
.shadow{fill:${t.shadow};opacity:${t.shadowOpacity};filter:url(#soft)}
.face-left{fill:url(#left)}.face-right{fill:url(#right)}.roof{fill:url(#top)}
.roof-lit{fill:${t.lime}}.roof-glow{fill:${t.glow};opacity:.55;filter:url(#glow)}
.win,.win.side{fill:${t.window};stroke:${t.windowEdge};stroke-width:.6}
.win-lit,.win-lit.side{fill:${t.lime}}
.win-lit.strip{fill:${t.lime}}
.edge{fill:none;stroke:${t.edge};stroke-width:1.2;stroke-linejoin:round;opacity:.9}
.edge-strong{fill:none;stroke:${t.edgeSoft};stroke-width:1;stroke-linejoin:round}
.fog{fill:${t.bg2}}
.floor-glow{fill:${t.glow};opacity:${themeName === 'dark' ? 0.28 : 0.35};filter:url(#glow)}
.antenna{stroke:${t.edge};stroke-width:1.4}.beacon{fill:${t.edgeSoft}}.beacon-lit{fill:${t.lime}}
.trace{fill:none;stroke:${t.grid};stroke-width:1.6;stroke-linejoin:round}
.trace-lit{fill:none;stroke:${t.limeDeep};stroke-width:2;stroke-linejoin:round}
.node{fill:${t.bg2};stroke:${t.edgeSoft};stroke-width:1.6}.node-lit{fill:${t.bg2};stroke:${t.lime};stroke-width:2}
.pulse{fill:${t.lime}}.pulse-glow{fill:${t.glow};opacity:.45;filter:url(#soft)}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="26" fill="url(#bg)" stroke="${t.frame}" stroke-width="2"/>
<g mask="url(#fadeY)" opacity="${gridOpacity}"><g class="grid" mask="url(#fade)">${grid.join('')}</g></g>
${floorGlow}
${traces}
${blocks.map((b) => b.svg).join('\n')}
</svg>
`;
}

async function main(args = process.argv.slice(2)) {
  const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
  const user = option('--user', 'diorhc');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/.test(user)) throw new Error('Invalid GitHub login');
  const out = path.resolve(option('--out', 'assets/city'));
  const styleName = option('--style', 'base');
  const style = STYLES[styleName];
  if (!style) throw new Error('Unknown --style ' + styleName + '; use one of ' + Object.keys(STYLES).join(', '));
  let snapshot;
  if (args.includes('--calendar-json')) snapshot = JSON.parse(await fs.readFile(option('--calendar-json'), 'utf8'));
  else if (args.includes('--refresh')) snapshot = { user, retrievedAt: new Date().toISOString(), ...(await fetchCalendar(user)) };
  else throw new Error('Pass --refresh or --calendar-json <file>');
  await fs.mkdir(out, { recursive: true });
  for (const theme of ['dark', 'light']) {
    const file = path.join(out, `${theme}.svg`);
    await fs.writeFile(file + '.tmp', renderCity(snapshot, theme, style));
    await fs.rename(file + '.tmp', file);
  }
  console.log(`City: ${weeks(snapshot.days).length} weeks rendered to ${out}`);
}

module.exports = { renderCity, weeks, STYLES };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exitCode = 1; });
