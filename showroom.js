/* Red Panda Publications — data-driven showroom (preview build).
 *
 * Reads window.SHOWROOM_CONFIG / SHOWROOM_BOOKS / SHOWROOM_AUTHORS / PAPER_STOCKS
 * (shapes = packages/schemas/json/showroom-config + book-listing) and drives the prototype's
 * 3D hardcover, grids, hero and monograph from that data.
 *
 * The "Customise showroom" panel is a PREVIEW TOOL: it changes this browser only and lets you
 * download the JSON files. The live site reads the same JSON from the repository.
 */
(function () {
  'use strict';

  // ───────────── state ─────────────
  const STORE_KEY = 'rw-showroom-preview-v1';
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const DEFAULTS = { config: clone(window.SHOWROOM_CONFIG), books: clone(window.SHOWROOM_BOOKS) };
  let state = loadState();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (saved && saved.config && Array.isArray(saved.books)) return saved;
    } catch (e) { /* storage unavailable: use defaults */ }
    return clone(DEFAULTS);
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = () => {
    const m = state.config.motion;
    return reducedMotion ? { cursor_tilt: false, hover_lift: false, spin_on_open: false, page_turn: false } : m;
  };

  // ───────────── helpers ─────────────
  const tie = (s) => String(s ?? '').replace(/\b(Mr|Mrs|Ms|Dr|St)\. /g, '$1.\u00a0');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TRIMS = {
    demy_5_5x8_5: { label: '5.5" × 8.5"', w: 139.7, h: 215.9 },
    us_6x9: { label: '6" × 9"', w: 152.4, h: 228.6 },
    royal_octavo: { label: 'Royal Octavo', w: 156, h: 234 },
  };
  const LANG_LABEL = { en: 'English', hi: 'Hindi', ur: 'Urdu', bn: 'Bengali' };
  const SIZE_PX = { small: 262, medium: 318, large: 368 };
  const FINISH = { silver: '#C9CED6', copper: '#B87333' };
  const EDGES = {
    cream: ['#F6F2E7', '#E4DDD0', '#FBF9F2'],
    white: ['#FDFDFD', '#E4E4E4', '#FFFFFF'],
    gilt: ['#E8C872', '#B8902F', '#F3DC94'],
  };
  // Prototype hand-designed jackets, used only while the book still matches its original design.
  const BESPOKE = {
    'salt-roads': ['waves', 'salt'], 'mirrors-daryaganj': ['arch', 'ghazal'], 'field-notes-tea': ['leaf', 'tea'],
    'quiet-machines': ['orbit', 'machines'], 'monsoon-ferry': ['boat', 'ferry'], 'house-by-river': ['river', 'river'],
  };
  const ORIGINAL_TITLES = Object.fromEntries(DEFAULTS.books.map((b) => [b.slug, b.title]));

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(ch).map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function spineMm(book) {
    const paper = window.PAPER_STOCKS[book.paper] || window.PAPER_STOCKS.cream_bookwove_80;
    const allowance = book.look.binding === 'paperback' ? 0.5 : 6.0;
    return Math.ceil(book.pages / 2) * paper.caliper_mm + allowance;
  }
  function effectiveFoil(look) {
    if (look.foil_finish === 'gold') return look.foil;
    if (look.foil_finish === 'blind') return shade(look.cloth, 0.72);
    if (look.foil_finish === 'none') return look.ink;
    return FINISH[look.foil_finish];
  }
  const price = (b, fmt) => (b.editions.find((e) => e.format === fmt) || {}).price_inr;
  const authorNames = (b) => b.credits.map((c) => c.name).join(', ');
  const formatIsbn = (d) => d ? `${d.slice(0, 3)}-${d[3]}-${d.slice(4, 9)}-${d.slice(9, 12)}-${d[12]}` : 'Pending';

  // Listing (schema shape) → object the prototype renderers expect.
  function toProto(b) {
    const authorsBySlug = Object.fromEntries((window.SHOWROOM_AUTHORS || []).map((a) => [a.book, a]));
    const look = b.look;
    const bespoke = BESPOKE[b.slug];
    const useBespoke = bespoke && bespoke[0] === look.motif && ORIGINAL_TITLES[b.slug] === b.title;
    return {
      id: b.slug, title: b.title, author: authorNames(b), genre: b.genre,
      hardcoverPrice: price(b, 'hardcover') ?? '—', paperbackPrice: price(b, 'paperback') ?? '—',
      pages: b.pages, trim: TRIMS[b.trim].label,
      language: b.languages.map((l) => LANG_LABEL[l] || l).join(' & '),
      isbn: formatIsbn(b.isbn13),
      cloth: look.cloth, spineCloth: look.spine_cloth, ink: look.ink, foil: effectiveFoil(look),
      motif: useBespoke ? bespoke[1] : null,
      synopsis: b.synopsis,
      authorNote: (authorsBySlug[b.slug] || {}).note || '',
      spreads: b.excerpt.length ? b.excerpt.map(spreadHtml) : [{ l: '<p>Excerpt coming soon.</p>', r: '' }],
      _listing: b,
    };
  }
  function spreadHtml(s, i) {
    const para = (t, first) => {
      const verse = t.includes('\n');
      let body = esc(t).replace(/\n/g, '<br/>');
      if (first && !verse && /^[A-Za-z]/.test(t)) {
        body = `<span class="float-left font-playfair font-bold text-4xl leading-[0.85] pr-2 pt-1 text-claret">${body[0]}</span>${body.slice(1)}`;
      }
      return `<p class="${verse ? 'italic' : ''}">${body}</p>`;
    };
    return { l: s.left.map((t, k) => para(t, i === 0 && k === 0)).join(''), r: s.right.map((t) => para(t, false)).join('') };
  }

  // ───────────── generic jacket (for anything not using a bespoke design) ─────────────
  const MOTIFS = {
    none: () => '',
    rule: (f) => `<div class="w-10 h-[1.5px] mx-auto" style="background:${f}"></div>`,
    waves: (f) => `<svg viewBox="0 0 120 38" class="w-full h-9" fill="none" stroke="${f}" stroke-width="1.5"><path d="M0 12 Q20 2 40 12 T80 12 T120 12"/><path d="M0 23 Q20 13 40 23 T80 23 T120 23" opacity=".7"/><path d="M0 34 Q20 24 40 34 T80 34 T120 34" opacity=".4"/></svg>`,
    arch: () => '',
    leaf: (f) => `<svg viewBox="0 0 80 80" class="w-14 h-14 mx-auto" fill="none" stroke="${f}" stroke-width="1.4"><path d="M40 68 C40 45 42 26 48 12"/><path d="M40 52 C21 48 21 30 39 30 C40 40 40 46 40 52 Z" fill="${f}" fill-opacity=".16"/><path d="M42 36 C59 32 59 16 44 18 C42 26 42 31 42 36 Z" fill="${f}" fill-opacity=".22"/></svg>`,
    orbit: (f) => `<svg viewBox="0 0 90 90" class="w-16 h-16 mx-auto"><circle cx="42" cy="45" r="27" fill="none" stroke="${f}" stroke-width="2"/><circle cx="53" cy="36" r="10" fill="${f}"/></svg>`,
    boat: (f) => `<svg viewBox="0 0 100 32" class="w-20 h-7 mx-auto" fill="none" stroke="${f}" stroke-width="1.4"><path d="M6 14 L94 14 L80 25 L20 25 Z"/></svg>`,
    river: (f) => `<svg viewBox="0 0 120 44" class="w-full h-9" fill="none" stroke="${f}" stroke-width="1.3"><path d="M0 12 C35 26 75 -2 120 14"/><path d="M0 24 C35 38 75 10 120 26" opacity=".65"/></svg>`,
  };
  const TITLE_CLASS = {
    modern_sans: 'font-sans font-extrabold tracking-[-0.04em] uppercase text-[22px] leading-[0.98]',
    display_serif: 'font-playfair font-bold tracking-tight uppercase text-[21px] leading-[1.02]',
    classic_serif: 'font-fraunces font-normal text-[22px] leading-[1.08]',
  };
  function genericJacket(book) {
    const look = book._listing.look;
    if (look.cover_image) {
      return `<img src="${esc(look.cover_image)}" alt="" class="absolute inset-0 w-full h-full object-cover">`;
    }
    const f = book.foil;
    const arch = look.motif === 'arch'
      ? `<div class="absolute inset-3.5 left-5 border rounded-t-full pointer-events-none" style="border-color:${f}55"></div>` : '';
    return `
      <div class="h-full p-6 pl-7 flex flex-col justify-between text-center relative z-10">
        ${arch}
        <div class="pt-1 font-fraunces italic font-light text-[11px]" style="color:${f}">${esc(book.genre)}</div>
        <div class="my-auto space-y-3 px-1">
          <div class="${TITLE_CLASS[look.title_style]}">${esc(book.title)}</div>
          ${(MOTIFS[look.motif] || MOTIFS.rule)(f)}
        </div>
        <div class="font-mono text-[9px] tracking-[0.2em] uppercase pb-1">${esc(book.author)}</div>
      </div>`;
  }

  // ───────────── override prototype renderers ─────────────
  const protoJacket = window.renderFrontJacket;
  const protoBuild = window.buildHardcover3D;
  window.renderFrontJacket = function (book, custom) {
    if (custom) return protoJacket(book, custom);
    if (book && book.motif && book._listing) return protoJacket(book);
    return book && book._listing ? genericJacket(book) : protoJacket(book);
  };
  window.buildHardcover3D = function (book, custom) {
    let html = protoBuild(book, custom);
    const look = book && book._listing && book._listing.look;
    if (!look) return html;
    const tex = look.texture === 'buckram' ? 'buckram-weave' : `rw-tex-${look.texture}`;
    html = html.replace(/buckram-weave/g, tex);
    if (spineMm(book._listing) < 5) {
      // Same 5 mm rule as the engine: no lettering on a spine thinner than 5 mm.
      html = html.replace(/(<span class="\[writing-mode:vertical-rl\][^"]*)"/, '$1 invisible"');
    }
    return html;
  };

  function bookVars(listing, { hero = false } = {}) {
    const look = listing.look;
    const trim = TRIMS[listing.trim];
    const h = hero ? 376 : SIZE_PX[state.config.layout.book_size];
    const w = Math.round(h * (trim.w / trim.h));
    const t = Math.max(10, Math.round(spineMm(listing) * (h / trim.h) * 1.4));
    const edge = look.page_edge === 'sprayed'
      ? [look.sprayed_edge || '#8B1E24', shade(look.sprayed_edge || '#8B1E24', 0.8), look.sprayed_edge || '#8B1E24']
      : EDGES[look.page_edge];
    const hb = look.headband || ['#00000000', '#00000000'];
    const cls = ['hardcover-3d', 'rw-var', look.binding === 'paperback' ? 'rw-paperback' : '', look.headband ? '' : 'rw-nohb'].join(' ');
    const style = `width:${w}px;height:${h}px;--t:${t}px;--hb1:${hb[0]};--hb2:${hb[1]};--e1:${edge[0]};--e2:${edge[1]};--e3:${edge[2]}`;
    return { cls, style };
  }

  const visibleBooks = () => state.books.filter((b) => b.status === 'published' && (state.config.include_redworm_books || b.origin !== 'redworm'));
  function sortBooks(list) {
    const s = state.config.layout.sort;
    const byPrice = (b) => price(b, 'hardcover') ?? price(b, 'paperback') ?? Infinity;
    const cmp = {
      newest: (a, b) => b.published_on.localeCompare(a.published_on),
      title: (a, b) => a.title.localeCompare(b.title),
      author: (a, b) => authorNames(a).localeCompare(authorNames(b)),
      price_low: (a, b) => byPrice(a) - byPrice(b),
      price_high: (a, b) => byPrice(b) - byPrice(a),
      manual: (a, b) => b.sort_weight - a.sort_weight,
    }[s];
    return list.slice().sort(cmp);
  }

  function card(listing) {
    const L = state.config.layout;
    const book = toProto(listing);
    const v = bookVars(listing);
    const tilt = motion().cursor_tilt ? 'onmousemove="tiltBookOnHover(event, this)" onmouseleave="resetBookTilt(this)"' : '';
    const pr = price(listing, 'hardcover') != null ? `Hardcover · ₹${price(listing, 'hardcover')}` : (price(listing, 'paperback') != null ? `Paperback · ₹${price(listing, 'paperback')}` : '');
    const badge = L.show_origin_badge && listing.origin === 'redworm'
      ? `<p class="font-mono text-[10px] uppercase tracking-wider text-claret pt-1">Made with Redworm</p>` : '';
    return `
      <div id="book-card-${esc(listing.slug)}" onclick="openMonograph('${esc(listing.slug)}', '3d')" class="book-card-wrap group cursor-pointer flex flex-col items-center text-center">
        <div class="w-full py-6 flex items-center justify-center">
          <div class="book-stage-3d" ${tilt}>
            <div class="${v.cls}" style="${v.style}">${window.buildHardcover3D(book)}</div>
          </div>
        </div>
        <div class="mt-5 space-y-1">
          <h3 class="font-sans font-bold text-[17px] tracking-[-0.02em] text-ink group-hover:text-claret transition">${esc(tie(listing.title))}</h3>
          ${L.show_author ? `<p class="text-[13px] text-slateMuted">${esc(authorNames(listing))}</p>` : ''}
          ${L.show_prices && pr ? `<p class="text-[11.5px] text-slateMuted/80 font-mono pt-0.5">${pr}</p>` : ''}
          ${badge}
        </div>
      </div>`;
  }

  function renderGrid(gridId, genre, limit) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const L = state.config.layout;
    grid.style.setProperty('--cd', L.columns_desktop);
    grid.style.setProperty('--ct', L.columns_tablet);
    let list = sortBooks(visibleBooks());
    if (genre && genre !== 'All') list = list.filter((b) => b.genre === genre);
    const total = list.length;
    if (limit) list = list.slice(0, limit);
    const groups = L.group_by === 'none' ? [[null, list]]
      : L.group_by === 'genre'
        ? state.config.genres.map((g) => [g.label, list.filter((b) => b.genre === g.id)])
        : [['House list', list.filter((b) => b.origin === 'house')], [state.config.redworm_section_title, list.filter((b) => b.origin === 'redworm')]];
    grid.innerHTML = groups.filter(([, items]) => items.length).map(([title, items]) =>
      (title ? `<div style="grid-column:1/-1" class="pt-4 border-b border-hairline pb-3"><h3 class="font-fraunces italic font-light text-2xl text-ink">${esc(title)}</h3></div>` : '') +
      items.map(card).join('')).join('') || '<p class="text-sm text-slateMuted" style="grid-column:1/-1">No books in this view.</p>';
    if (limit && total > limit) {
      grid.insertAdjacentHTML('beforeend', `<div style="grid-column:1/-1" class="text-center pt-2"><button onclick="switchSiteTab('books')" class="text-sm font-medium text-ink hover:text-claret">View all ${total} books →</button></div>`);
    }
  }

  let homeGenre = 'All', booksGenre = 'All', booksLimit = null;
  function renderPills() {
    const L = state.config.layout;
    const mk = (cls, attr, fn, active) => ['All', ...state.config.genres.map((g) => g.id)].map((id) => {
      const label = id === 'All' ? 'All' : state.config.genres.find((g) => g.id === id).label;
      const on = id === active;
      return `<button onclick="${fn}('${esc(id)}')" data-${attr}="${esc(id)}" class="${cls} px-4 py-1.5 rounded-full text-xs ${on ? 'font-semibold bg-ink text-pureWhite' : 'font-medium text-slateMuted hover:text-ink border border-borderCrisp'} transition">${esc(label)}</button>`;
    }).join('');
    const homeBox = document.querySelector('.home-cat-btn')?.parentElement || document.getElementById('rw-home-pills');
    const booksBox = document.querySelector('.book-view-cat')?.parentElement || document.getElementById('rw-books-pills');
    if (homeBox) { homeBox.id = 'rw-home-pills'; homeBox.innerHTML = mk('home-cat-btn', 'hcat', 'filterHomeShowroom', homeGenre); homeBox.style.display = L.show_genre_filter ? '' : 'none'; }
    if (booksBox) { booksBox.id = 'rw-books-pills'; booksBox.innerHTML = mk('book-view-cat', 'bcat', 'filterBooksView', booksGenre); booksBox.style.display = L.show_genre_filter ? '' : 'none'; }
  }
  function renderTitle() {
    const h = document.querySelector('#showroom-sec h2');
    if (!h) return;
    const [first, ...rest] = state.config.title.split(' ');
    h.innerHTML = `<span class="font-sans font-extrabold tracking-[-0.035em]">${esc(first)}</span>` +
      (rest.length ? ` <em class="font-fraunces italic font-light ml-1.5">${esc(rest.join(' '))}</em>` : '');
  }

  window.filterHomeShowroom = function (genre) {
    homeGenre = genre; renderPills(); renderGrid('home-books-grid', genre, state.config.layout.items_per_page);
  };
  window.filterBooksView = function (genre) {
    booksGenre = genre; booksLimit = null; renderPills(); renderBooksView();
  };
  function renderBooksView() {
    const per = state.config.layout.items_per_page;
    const grid = document.getElementById('full-books-grid');
    renderGrid('full-books-grid', booksGenre, null);
    // simple "show more" paging on the catalogue page
    const cards = grid ? grid.querySelectorAll('.book-card-wrap') : [];
    const limit = booksLimit || per;
    cards.forEach((c, i) => { c.style.display = i < limit ? '' : 'none'; });
    if (cards.length > limit) {
      grid.insertAdjacentHTML('beforeend', `<div style="grid-column:1/-1" class="text-center"><button id="rw-more" class="px-5 py-2 rounded-lg border border-borderCrisp hover:border-ink text-xs font-medium">Show more</button></div>`);
      document.getElementById('rw-more').onclick = () => { booksLimit = limit + per; renderBooksView(); };
    }
  }

  function featured() {
    const vis = sortBooks(visibleBooks());
    const L = state.config.layout;
    return vis.find((b) => b.slug === L.featured_slug) || vis.find((b) => b.featured) || vis[0];
  }
  window.mountHeroHardcover = function () {
    const f = featured();
    const mount = document.getElementById('hero-3d-mount');
    if (!f || !mount) { if (mount) mount.innerHTML = ''; return; }
    const v = bookVars(f, { hero: true });
    const tilt = motion().cursor_tilt ? 'onmousemove="tiltBookOnHover(event, this.parentElement)" onmouseleave="resetBookTilt(this.parentElement)"' : '';
    mount.innerHTML = `<div onclick="openMonograph('${esc(f.slug)}', '3d')" class="book-card-wrap cursor-pointer" ${tilt}>
      <div class="${v.cls} hero-book-scale" style="${v.style}">${window.buildHardcover3D(toProto(f))}</div></div>`;
  };

  const protoOpenMono = window.openMonograph;
  window.openMonograph = function (slug, tab) {
    syncProtoArrays();
    protoOpenMono(slug, tab);
    const listing = state.books.find((b) => b.slug === slug);
    const el = document.getElementById('mono-3d-book');
    if (listing && el) {
      const v = bookVars(listing);
      el.className = v.cls;
      el.setAttribute('style', v.style);
      el.innerHTML = window.buildHardcover3D(toProto(listing));
      const end = 'rotateY(-25deg) rotateX(6deg)';
      if (motion().spin_on_open) {
        el.style.transition = 'none';
        el.style.transform = 'rotateY(-205deg) rotateX(6deg)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = 'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)';
          el.style.transform = end;
        }));
      } else {
        el.style.transform = end;
      }
    }
  };
  // Book detail panel: formats the book really has; no fake ordering.
  window.renderMonographMeta = function () {
    const b = activeMonoBook, L = b._listing;
    if (!L) return;
    const eds = L.editions.length ? L.editions : [{ format: 'hardcover', price_inr: null }];
    const fmtName = { hardcover: 'Hardcover', paperback: 'Paperback', ebook: 'Ebook' };
    document.getElementById('mono-meta-col').innerHTML = `
      <div class="space-y-1.5">
        <div class="font-fraunces italic text-xs text-claret">${esc(b.genre)}</div>
        <h2 class="font-sans font-extrabold text-3xl tracking-[-0.035em] text-ink">${esc(tie(b.title))}</h2>
        <p class="text-sm text-slateMuted">by <strong class="font-semibold text-ink">${esc(b.author)}</strong></p>
      </div>
      <p class="font-reader text-[16px] leading-[1.7] text-ink/90">${esc(b.synopsis)}</p>
      ${b.authorNote ? `<p class="text-xs text-slateMuted leading-relaxed border-l-2 border-claret/50 pl-3.5">${esc(b.authorNote)}</p>` : ''}
      <div class="grid grid-cols-2 gap-y-2.5 gap-x-4 py-4 border-y border-hairline text-xs">
        <div><span class="text-slateMuted">Pages:</span> <span class="text-ink font-medium">${b.pages}</span></div>
        <div><span class="text-slateMuted">Size:</span> <span class="text-ink font-medium">${esc(b.trim)}</span></div>
        <div><span class="text-slateMuted">Language:</span> <span class="text-ink font-medium">${esc(b.language)}</span></div>
        <div><span class="text-slateMuted">ISBN:</span> <span class="font-mono text-[11px] text-ink">${esc(b.isbn)}</span></div>
      </div>
      <div class="flex flex-wrap gap-2 text-xs">${eds.map(e => `<span class="px-3 py-2 rounded-lg border border-borderCrisp">${fmtName[e.format]}${e.price_inr != null ? ` · ₹${e.price_inr}` : ''}</span>`).join('')}</div>
      <div class="flex flex-wrap items-center gap-3 pt-1">
        <button disabled class="flex-1 py-3 px-5 rounded-lg bg-subtleSurface text-slateMuted text-xs font-semibold cursor-not-allowed">Ordering opens soon</button>
        <button onclick="setMonographTab('read')" class="py-3 px-4 rounded-lg border border-borderCrisp hover:border-ink text-xs font-medium text-ink transition">Read excerpt</button>
      </div>`;
  };

  const protoTurn = window.turnMonographPage;
  window.turnMonographPage = function (dir) {
    if (motion().page_turn) return protoTurn(dir);
    const len = activeMonoBook.spreads.length;
    monoSpreadIdx = (monoSpreadIdx + dir + len) % len;
    renderMonographSpread();
  };
  const protoTilt = window.tiltBookOnHover;
  window.tiltBookOnHover = function (e, el) { if (motion().cursor_tilt) protoTilt(e, el); };

  // Keep the prototype's BOOKS / AUTHORS arrays (used by the monograph) in step with the data.
  function syncProtoArrays() {
    const protos = state.books.map(toProto);
    BOOKS.length = 0; protos.forEach((p) => BOOKS.push(p));
    AUTHORS.length = 0;
    (window.SHOWROOM_AUTHORS || []).forEach((a) => {
      const b = state.books.find((x) => x.slug === a.book);
      if (b && b.status === 'published') AUTHORS.push({ name: a.name, city: a.city, title: b.title, bookId: b.slug, bio: a.bio });
    });
  }
  function renderAuthors() {
    const grid = document.getElementById('authors-roster-grid');
    if (!grid) return;
    grid.innerHTML = AUTHORS.map((a) => `
      <div class="border-t border-hairline pt-6 space-y-3">
        <div class="flex items-baseline justify-between gap-2"><h3 class="font-sans font-bold text-xl tracking-tight text-ink">${esc(a.name)}</h3><span class="text-xs text-slateMuted">${esc(a.city)}</span></div>
        <p class="text-sm text-slateMuted leading-relaxed">${esc(a.bio)}</p>
        <div class="pt-1 flex items-center justify-between text-xs"><em class="font-fraunces italic text-ink">${esc(a.title)}</em>
        <button onclick="openMonograph('${esc(a.bookId)}', '3d')" class="font-medium text-ink hover:text-claret transition">View edition →</button></div>
      </div>`).join('');
  }

  function renderAll() {
    syncProtoArrays();
    document.body.classList.toggle('rw-nolift', !motion().hover_lift);
    renderTitle();
    window.mountHeroHardcover();
    window.filterHomeShowroom(homeGenre);
    renderBooksView();
    renderAuthors();
  }

  // ───────────── styles for the configurable 3D model ─────────────
  const css = `
  @media (min-width:640px){#home-books-grid,#full-books-grid{grid-template-columns:repeat(var(--ct,2),minmax(0,1fr))}}
  @media (min-width:1024px){#home-books-grid,#full-books-grid{grid-template-columns:repeat(var(--cd,3),minmax(0,1fr))}}
  .hardcover-3d.rw-var .hc-spine{width:var(--t);left:calc(var(--t) / -2)}
  .hardcover-3d.rw-var .hc-front{transform:translateZ(calc(var(--t) / 2))}
  .hardcover-3d.rw-var .hc-back{transform:rotateY(180deg) translateZ(calc(var(--t) / 2))}
  .hardcover-3d.rw-var .hc-foreedge{width:calc(var(--t) - 3px);right:calc((var(--t) - 3px) / -2 + 3px);background:repeating-linear-gradient(90deg,var(--e1) 0px,var(--e2) 1.1px,var(--e3) 2.2px)}
  .hardcover-3d.rw-var .hc-top,.hardcover-3d.rw-var .hc-bottom{height:calc(var(--t) - 3px);background:repeating-linear-gradient(0deg,var(--e1) 0px,var(--e2) 1.2px,var(--e3) 2.4px)}
  .hardcover-3d.rw-var .hc-top{top:calc((var(--t) - 3px) / -2 + 3px)}
  .hardcover-3d.rw-var .hc-bottom{bottom:calc((var(--t) - 3px) / -2 + 3px)}
  .hardcover-3d.rw-var .hc-top::before,.hardcover-3d.rw-var .hc-bottom::before{background:repeating-linear-gradient(0deg,var(--hb1) 0 2px,var(--hb2) 2px 4px)}
  .hardcover-3d.rw-nohb .hc-top::before,.hardcover-3d.rw-nohb .hc-bottom::before{display:none}
  .hardcover-3d.rw-paperback .hc-front::before,.hardcover-3d.rw-paperback .hc-front::after{display:none}
  .hardcover-3d.rw-paperback .hc-front,.hardcover-3d.rw-paperback .hc-back{border-radius:1px}
  .hardcover-3d.rw-paperback .hc-spine{border-radius:0}
  .rw-tex-linen{background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 2px),repeating-linear-gradient(90deg,rgba(0,0,0,.07) 0 1px,transparent 1px 2px)}
  .rw-tex-leather{background-image:radial-gradient(rgba(0,0,0,.14) 1px,transparent 1.6px),radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.6px),linear-gradient(135deg,rgba(255,255,255,.08),rgba(0,0,0,.2));background-size:4px 4px,5px 5px,100% 100%;background-position:0 0,2px 3px,0 0}
  .rw-tex-paper{background-image:linear-gradient(160deg,rgba(255,255,255,.07),rgba(0,0,0,.07))}
  .rw-tex-matte{background-image:none}
  .rw-tex-gloss{background-image:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.3) 45%,rgba(255,255,255,0) 60%)}
  .rw-nolift .book-card-wrap:hover .hardcover-3d:not(.is-tracking){transform:rotateY(-24deg) rotateX(5deg)}
  .rw-nolift .book-card-wrap:hover .book-studio-shadow{transform:translateZ(-26px)}
  #rw-panel label{display:block}
  #rw-panel .row{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.3rem 0}
  #rw-panel select,#rw-panel input[type=number],#rw-panel input[type=text]{border:1px solid #EAEAEA;background:#F7F7F8;border-radius:.375rem;padding:.25rem .45rem;font-size:12px;max-width:11rem}
  #rw-panel input[type=color]{width:2rem;height:1.5rem;border:1px solid #EAEAEA;border-radius:.25rem;padding:0;background:none}
  `;
  document.head.insertAdjacentHTML('beforeend', `<style id="rw-showroom-css">${css}</style>`);

  // ───────────── customise panel (preview tool) ─────────────
  let panelTab = 'layout';
  let selSlug = state.books[0] && state.books[0].slug;
  const opt = (v, cur, label) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(label ?? v)}</option>`;
  const sel = (path, cur, options) => `<select data-path="${path}">${options.map(([v, l]) => opt(v, cur, l)).join('')}</select>`;
  const chk = (path, cur) => `<input type="checkbox" data-path="${path}" ${cur ? 'checked' : ''} class="accent-ink w-4 h-4">`;
  const num = (path, cur, min, max, step = 1) => `<input type="number" data-path="${path}" value="${cur}" min="${min}" max="${max}" step="${step}">`;
  const col = (path, cur) => `<input type="color" data-path="${path}" value="${cur}">`;
  const row = (label, ctl) => `<div class="row"><span class="text-slateMuted">${label}</span>${ctl}</div>`;
  const head = (t) => `<div class="pt-3 pb-1 font-mono text-[10px] uppercase tracking-wider text-slateMuted">${t}</div>`;

  function panelBody() {
    const C = state.config, L = C.layout, M = C.motion;
    if (panelTab === 'layout') {
      return head('Grid') +
        row('Columns (desktop)', sel('config.layout.columns_desktop', L.columns_desktop, [[2, '2'], [3, '3'], [4, '4'], [5, '5']])) +
        row('Columns (tablet)', sel('config.layout.columns_tablet', L.columns_tablet, [[1, '1'], [2, '2'], [3, '3']])) +
        row('Book size', sel('config.layout.book_size', L.book_size, [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']])) +
        row('Books on homepage', num('config.layout.items_per_page', L.items_per_page, 3, 60)) +
        head('Order') +
        row('Sort', sel('config.layout.sort', L.sort, [['manual', 'Manual'], ['newest', 'Newest'], ['title', 'Title'], ['author', 'Author'], ['price_low', 'Price ↑'], ['price_high', 'Price ↓']])) +
        row('Group by', sel('config.layout.group_by', L.group_by, [['none', 'None'], ['genre', 'Genre'], ['origin', 'House / Redworm']])) +
        row('Hero book', sel('config.layout.featured_slug', L.featured_slug ?? '', [['', 'First featured'], ...state.books.map((b) => [b.slug, b.title])])) +
        head('Show') +
        row('Prices', chk('config.layout.show_prices', L.show_prices)) +
        row('Author names', chk('config.layout.show_author', L.show_author)) +
        row('Genre filter', chk('config.layout.show_genre_filter', L.show_genre_filter)) +
        row('"Made with Redworm" badge', chk('config.layout.show_origin_badge', L.show_origin_badge)) +
        row('Include Redworm books', chk('config.include_redworm_books', C.include_redworm_books)) +
        row('Showroom title', `<input type="text" data-path="config.title" value="${esc(C.title)}">`) +
        head('Motion') +
        row('Cursor tilt', chk('config.motion.cursor_tilt', M.cursor_tilt)) +
        row('Lift on hover', chk('config.motion.hover_lift', M.hover_lift)) +
        row('Spin when opened', chk('config.motion.spin_on_open', M.spin_on_open)) +
        row('Page-turn animation', chk('config.motion.page_turn', M.page_turn)) +
        (reducedMotion ? '<p class="text-[11px] text-claret pt-1">Your system asks for reduced motion, so all motion is off regardless.</p>' : '');
    }
    const i = state.books.findIndex((b) => b.slug === selSlug);
    const b = state.books[i];
    if (!b) return '<p>No books.</p>';
    const k = `books.${i}`, lk = `${k}.look`, look = b.look;
    const paperback = look.binding === 'paperback';
    const textures = look.binding === 'cloth'
      ? [['buckram', 'Buckram'], ['linen', 'Linen'], ['leather', 'Leather'], ['paper', 'Paper'], ['matte', 'Matte'], ['gloss', 'Gloss']]
      : [['paper', 'Paper'], ['matte', 'Matte'], ['gloss', 'Gloss']];
    const spine = spineMm(b);
    return row('Book', `<select id="rw-book-pick">${state.books.map((x) => opt(x.slug, selSlug, x.title)).join('')}</select>`) +
      head('Binding & material') +
      row('Binding', sel(`${lk}.binding`, look.binding, [['cloth', 'Clothbound'], ['jacket', 'Dust jacket'], ['paperback', 'Paperback']])) +
      row('Texture', sel(`${lk}.texture`, look.texture, textures)) +
      row('Cover colour', col(`${lk}.cloth`, look.cloth)) +
      row('Spine colour', col(`${lk}.spine_cloth`, look.spine_cloth)) +
      row('Lettering colour', col(`${lk}.ink`, look.ink)) +
      head('Foil & details') +
      row('Foil finish', sel(`${lk}.foil_finish`, look.foil_finish, [['gold', 'Gold'], ['silver', 'Silver'], ['copper', 'Copper'], ['blind', 'Blind (debossed)'], ['none', 'None']])) +
      (look.foil_finish === 'gold' ? row('Foil colour', col(`${lk}.foil`, look.foil)) : '') +
      (paperback ? '' : row('Headband', chk(`${lk}.__headband`, !!look.headband)) +
        (look.headband ? row('Headband colours', col(`${lk}.headband.0`, look.headband[0]) + col(`${lk}.headband.1`, look.headband[1])) : '')) +
      row('Page edges', sel(`${lk}.page_edge`, look.page_edge, [['cream', 'Cream'], ['white', 'White'], ['gilt', 'Gilt'], ['sprayed', 'Sprayed colour']])) +
      (look.page_edge === 'sprayed' ? row('Edge colour', col(`${lk}.sprayed_edge`, look.sprayed_edge || '#8B1E24')) : '') +
      row('Ornament', sel(`${lk}.motif`, look.motif, [['rule', 'Rule'], ['waves', 'Waves'], ['arch', 'Arch'], ['leaf', 'Leaf'], ['orbit', 'Orbit'], ['boat', 'Boat'], ['river', 'River'], ['none', 'None']])) +
      row('Title style', sel(`${lk}.title_style`, look.title_style, [['modern_sans', 'Modern sans'], ['display_serif', 'Display serif'], ['classic_serif', 'Classic serif']])) +
      head('Physical book') +
      row('Trim', sel(`${k}.trim`, b.trim, Object.entries(TRIMS).map(([id, t]) => [id, t.label]))) +
      row('Pages', num(`${k}.pages`, b.pages, 24, 2000, 2)) +
      row('Paper', sel(`${k}.paper`, b.paper, Object.entries(window.PAPER_STOCKS).map(([id, p]) => [id, p.label]))) +
      `<p class="text-[11px] pt-1 ${spine < 5 ? 'text-claret' : 'text-slateMuted'}">Spine ${spine.toFixed(2)} mm${spine < 5 ? ' · under 5 mm, so spine lettering is hidden' : ''}</p>` +
      head('Listing') +
      row('Title', `<input type="text" data-path="${k}.title" value="${esc(b.title)}">`) +
      row('Genre', sel(`${k}.genre`, b.genre, state.config.genres.map((g) => [g.id, g.label]))) +
      row('Status', sel(`${k}.status`, b.status, [['published', 'Published'], ['hidden', 'Hidden'], ['in_review', 'In review'], ['draft', 'Draft']])) +
      row('Featured', chk(`${k}.featured`, b.featured)) +
      row('Manual order weight', num(`${k}.sort_weight`, b.sort_weight, -1000, 1000));
  }

  function setPath(path, value) {
    const parts = path.split('.');
    let o = state;
    for (let j = 0; j < parts.length - 1; j++) o = o[parts[j]];
    const key = parts[parts.length - 1];
    if (key === '__headband') { o.headband = value ? ['#8B1E24', '#D4AF63'] : null; return; }
    o[key] = value;
  }
  function normaliseLooks() {
    // Mirror the schema's validation rules so downloaded JSON is always valid.
    state.books.forEach((b) => {
      const l = b.look;
      if (l.binding === 'paperback') l.headband = null;
      if (l.binding !== 'cloth' && ['buckram', 'linen', 'leather'].includes(l.texture)) l.texture = 'matte';
      if (l.page_edge === 'sprayed' && !l.sprayed_edge) l.sprayed_edge = '#8B1E24';
      if (l.page_edge !== 'sprayed') l.sprayed_edge = null;
      b.pages = Math.max(4, Math.min(2000, parseInt(b.pages, 10) || 4));
      b.sort_weight = parseInt(b.sort_weight, 10) || 0;
      if (b.status === 'published' && b.origin === 'redworm' && !b.rights) b.status = 'in_review';
    });
    const L = state.config.layout;
    L.items_per_page = Math.max(3, Math.min(60, parseInt(L.items_per_page, 10) || 12));
    if (L.featured_slug === '') L.featured_slug = null;
  }

  function onPanelChange(e) {
    const t = e.target;
    if (t.id === 'rw-book-pick') { selSlug = t.value; drawPanel(); return; }
    const path = t.dataset.path;
    if (!path) return;
    let v = t.type === 'checkbox' ? t.checked : t.value;
    if (t.type === 'number' || /columns_/.test(path)) v = Number(v);
    setPath(path, v);
    normaliseLooks();
    saveState();
    renderAll();
    if (t.tagName === 'SELECT' || t.type === 'checkbox') drawPanel();
  }

  function download(name, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2) + '\n'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function drawPanel() {
    const p = document.getElementById('rw-panel-body');
    if (!p) return;
    p.innerHTML = panelBody();
    document.querySelectorAll('#rw-panel [data-tab]').forEach((b) => {
      b.className = 'px-3 py-1.5 rounded-md ' + (b.dataset.tab === panelTab ? 'bg-ink text-pureWhite font-semibold' : 'text-slateMuted hover:text-ink');
    });
    document.getElementById('rw-dl-book').textContent = panelTab === 'look' ? 'Download this book .json' : 'Download showroom.json';
  }

  function mountPanel() {
    document.body.insertAdjacentHTML('beforeend', `
      <button id="rw-panel-open" class="fixed bottom-5 right-5 z-[75] px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-md border border-borderCrisp hover:border-ink text-ink text-xs font-semibold shadow-lg">Customise showroom</button>
      <aside id="rw-panel" class="hidden fixed top-0 right-0 z-[90] h-full w-[340px] max-w-[92vw] bg-white border-l border-borderCrisp shadow-2xl flex-col text-xs">
        <div class="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <div><div class="font-bold text-sm">Customise showroom</div><div class="text-[10.5px] text-slateMuted">Preview tool · saved in this browser only</div></div>
          <button id="rw-panel-close" class="text-slateMuted hover:text-ink">Close ✕</button>
        </div>
        <div class="px-5 pt-3"><div class="inline-flex bg-subtleSurface p-1 rounded-lg border border-borderCrisp">
          <button data-tab="layout">Layout</button><button data-tab="look">Book look</button></div></div>
        <div id="rw-panel-body" class="flex-1 overflow-y-auto px-5 pb-4"></div>
        <div class="px-5 py-3 border-t border-hairline flex flex-wrap gap-2">
          <button id="rw-dl-book" class="px-3 py-2 rounded-md bg-ink text-pureWhite font-semibold"></button>
          <button id="rw-reset" class="px-3 py-2 rounded-md border border-borderCrisp hover:border-ink">Reset</button>
        </div>
      </aside>`);
    const panel = document.getElementById('rw-panel');
    document.getElementById('rw-panel-open').onclick = () => { panel.classList.remove('hidden'); panel.classList.add('flex'); drawPanel(); };
    document.getElementById('rw-panel-close').onclick = () => { panel.classList.add('hidden'); panel.classList.remove('flex'); };
    panel.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { panelTab = b.dataset.tab; drawPanel(); }; });
    panel.addEventListener('change', onPanelChange);
    panel.addEventListener('input', (e) => { if (e.target.type === 'color' || e.target.type === 'text') onPanelChange(e); });
    document.getElementById('rw-dl-book').onclick = () => {
      if (panelTab === 'look') {
        const b = state.books.find((x) => x.slug === selSlug);
        download(`${b.slug}.json`, b);
      } else {
        download('showroom.json', state.config);
      }
    };
    document.getElementById('rw-reset').onclick = () => {
      state = clone(DEFAULTS); saveState(); renderAll(); drawPanel();
    };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.getElementById('rw-panel-close').click(); });
  }

  window.addEventListener('DOMContentLoaded', () => {
    normaliseLooks();
    renderAll();
    mountPanel();
  });
})();
