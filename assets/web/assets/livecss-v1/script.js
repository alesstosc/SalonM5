(() => {
  const isBuilder = document.documentElement.classList.contains('is-builder');
  const SCOPE = ':is([data-lc-v1], [data-lc-v1] *)';
  const ITEMS = `[data-lc-items]${SCOPE}`, BOXES = `[data-lc-box]${SCOPE}`, MENUS = `section[data-lc-menu]${SCOPE}`;
  const LOOPS = `:is([data-lc-live] [data-lc-loop], [data-lc-live] [data-lc-loop] *)${SCOPE}`;
  const value = (element, name) => element.getAttribute(`data-lc-${name}`);
  const sectionOf = element => element.closest('[data-lc-section], [data-lc-v1], section') || document.documentElement;
  const box = element => {
    if (!(element instanceof HTMLElement)) { const r = element.getBoundingClientRect(); return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height }; }
    let x = 0, y = 0, node = element;
    while (node) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; }
    return { x, y, w: element.offsetWidth, h: element.offsetHeight };
  };
  const put = (element, name, v) => {
    if (element.style.getPropertyValue(name) === String(v)) return false;
    element.style.setProperty(name, v);
    return true;
  };
  const number = () => {
    let changed = false;
    document.querySelectorAll(ITEMS).forEach(group => {
      let items;
      try { items = group.querySelectorAll(value(group, 'items')); } catch { return; }
      items.forEach((item, index) => { changed = put(item, '--i', index) || changed; changed = put(item, '--n', items.length) || changed; });
    });
    return changed;
  };
  const readBoxes = () => Array.prototype.map.call(document.querySelectorAll(BOXES), element => {
    const section = sectionOf(element), own = box(element), base = box(section);
    return [element, section, { x: own.x - base.x, y: own.y - base.y, px: own.x, py: own.y, w: own.w, h: own.h, cw: element.clientWidth, ch: element.clientHeight, sw: element.scrollWidth, sh: element.scrollHeight }];
  });
  const writeBoxes = boxes => {
    let changed = false;
    boxes.forEach(entry => {
      const element = entry[0], section = entry[1], values = entry[2];
      value(element, 'box').trim().split(/\s+/).forEach(token => {
        const parts = token.split('@'), name = parts[0];
        const target = parts[1] === 'section' ? section : element;
        Object.keys(values).forEach(key => {
          const rounded = Math.round(values[key] * 100) / 100;
          changed = put(target, `--${name}-${key}`, rounded + 'px') || changed;
          changed = put(target, `--${name}-${key}-n`, rounded) || changed;
        });
      });
    });
    return changed;
  };
  const scrollDriven = a => a instanceof window.CSSAnimation && a.timeline && !(a.timeline instanceof window.DocumentTimeline);
  const animations = () => (typeof window.CSSAnimation === 'undefined' || !document.getAnimations ? [] : document.getAnimations());
  const loops = list => {
    const kinds = new Map();
    list.forEach(a => {
      const target = a.effect && a.effect.target;
      if (!(a instanceof window.CSSAnimation) || !target || a.effect.pseudoElement || !target.matches(LOOPS)) return;
      kinds.set(target, (kinds.get(target) || 0) | (scrollDriven(a) ? 2 : 1));
    });
    document.querySelectorAll('[data-lc-timed]').forEach(element => { if (kinds.get(element) !== 1) element.removeAttribute('data-lc-timed'); });
    kinds.forEach((kind, element) => { if (kind === 1 && !element.hasAttribute('data-lc-timed')) element.setAttribute('data-lc-timed', ''); });
  };
  const restart = stale => {
    const parts = new Map();
    stale.forEach(a => {
      const element = a.effect.target, pseudo = a.effect.pseudoElement || '';
      if (!element.isConnected) return;
      if (!parts.has(element)) parts.set(element, new Map());
      const own = parts.get(element);
      if (!own.has(pseudo)) own.set(pseudo, new Set());
      own.get(pseudo).add(a.animationName);
    });
    const plan = [], hosts = new Map();
    parts.forEach((own, element) => own.forEach((gone, pseudo) => {
      const list = getComputedStyle(element, pseudo || null).animationName.split(/\s*,\s*/).map(name => (gone.has(name) ? 'none' : name)).join(', ');
      if (pseudo && !hosts.has(element)) hosts.set(element, hosts.size + 1);
      plan.push([element, pseudo, list, element.style.getPropertyValue('animation-name'), element.style.getPropertyPriority('animation-name'), element.hasAttribute('style')]);
    }));
    const sheet = document.createElement('style');
    sheet.textContent = plan.filter(step => step[1]).map(step => `[data-lc-restart="${hosts.get(step[0])}"]${step[1]} { animation-name: ${step[2]} !important; }`).join('\n');
    plan.forEach(step => { if (!step[1]) step[0].style.setProperty('animation-name', step[2], 'important'); });
    hosts.forEach((n, element) => element.setAttribute('data-lc-restart', n));
    if (hosts.size) document.head.appendChild(sheet);
    plan.forEach(step => getComputedStyle(step[0], step[1] || null).animationName);
    sheet.remove();
    hosts.forEach((n, element) => element.removeAttribute('data-lc-restart'));
    plan.forEach(step => {
      const element = step[0], was = step[3];
      if (step[1]) return;
      if (was) element.style.setProperty('animation-name', was, step[4]);
      else element.style.removeProperty('animation-name');
      if (!step[5] && !element.style.length && element.getAttribute('style') != null) element.removeAttribute('style');
    });
  };
  const range = a => [a.rangeStart, a.rangeEnd].map(r => typeof r === 'string' ? r : `${r.rangeName} ${r.offset}`).join();
  const at = time => (time == null ? null : typeof time === 'number' ? time : time.value);
  const resync = list => {
    const pairs = [];
    list.forEach(a => {
      const target = a.effect && a.effect.target;
      if (!scrollDriven(a) || a.playState === 'idle' || a.playState === 'paused' || !target || !target.closest('[data-lc-v1]')) return;
      pairs.push([a, range(a), target, { timeline: a.timeline, rangeStart: a.rangeStart, rangeEnd: a.rangeEnd, fill: 'both' }]);
    });
    pairs.forEach(pair => { try { pair[2] = pair[2].animate(null, pair[3]); } catch { pair[2] = null; } });
    for (let i = pairs.length; i--;) if (!pairs[i][2]) pairs.splice(i, 1);
    if (pairs.length) window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const stale = [];
      pairs.forEach(pair => {
        const a = pair[0], probe = pair[2], want = at(probe.currentTime), have = at(a.currentTime);
        probe.cancel();
        if (want == null || a.playState === 'idle' || a.playState === 'paused' || range(a) !== pair[1]) return;
        if (have == null || Math.abs(have - want) > 0.1) stale.push(a);
      });
      if (stale.length) restart(stale);
    }));
  };
  const settled = () => { const list = animations(); loops(list); resync(list); };
  let queued = false, forced = false, again = false, layout = '';
  const measure = force => {
    if (force === true) forced = true;
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      try {
        const now = [window.innerWidth, window.innerHeight, document.documentElement.scrollHeight, document.body.className]
          .concat(Array.prototype.map.call(document.querySelectorAll('[data-lc-v1]'), section => `${section.offsetTop}:${section.offsetHeight}`)).join();
        const boxes = readBoxes();
        const changed = number() | writeBoxes(boxes);
        const list = animations();
        loops(list);
        if (forced || now !== layout) resync(list);
        layout = now;
        forced = false;
        if (changed && !again) { again = true; measure(); } else again = false;
      } catch (error) { console.error('[livecss] measure failed', error); }
    });
  };

  function menu(section) {
    const nav = section.querySelector('.navbar');
    const collapse = section.querySelector('.navbar-collapse');
    const listeners = [];
    const on = (target, type, handler, options) => {
      target.addEventListener(type, handler, options);
      listeners.push(() => target.removeEventListener(type, handler, options));
    };
    const modes = (section.getAttribute('data-lc-menu') || '').split(/\s+/);

    if (nav && modes.includes('autohide') && nav.matches('.is-autohide') && !isBuilder) {
      let last = window.scrollY;
      on(window, 'scroll', () => {
        const y = window.scrollY;
        if (nav.matches('.opened')) return;
        if (y > last && y > 160) nav.setAttribute('data-hidden', '');
        else if (y < last) nav.removeAttribute('data-hidden');
        last = y;
      }, { passive: true });
    }

    if (collapse) {
      const close = () => { if (collapse.classList.contains('show')) section.querySelector('.navbar-toggler').click(); };
      on(collapse, 'show.bs.collapse', () => nav && nav.removeAttribute('data-hidden'));
      on(collapse, 'click', event => { if (!isBuilder && event.target.closest('a:not(.dropdown-toggle)')) close(); });
      on(document, 'keydown', event => { if (event.key === 'Escape') close(); });
    }

    return () => {
      listeners.forEach(off => off());
      if (nav) nav.removeAttribute('data-hidden');
    };
  }

  const mounted = new Map();
  const unmount = section => {
    const cleanup = mounted.get(section);
    if (!cleanup) return;
    mounted.delete(section);
    cleanup();
  };
  const mount = section => {
    unmount(section);
    if (section.matches(MENUS)) mounted.set(section, menu(section));
  };
  const sweep = () => {
    const gone = [];
    mounted.forEach((cleanup, section) => { if (!section.isConnected) gone.push(section); });
    gone.forEach(section => unmount(section));
    document.querySelectorAll(MENUS).forEach(section => { if (!mounted.has(section)) mount(section); });
  };

  const start = () => {
    sweep();
    measure();
    new window.ResizeObserver(measure).observe(document.body);
    if (document.fonts) document.fonts.ready.then(measure);
    window.addEventListener('load', measure);
    window.addEventListener('pageshow', () => measure(true));
    let settle;
    window.addEventListener('scrollend', () => { clearTimeout(settle); settle = setTimeout(settled, 200); });
    window.addEventListener('scroll', () => clearTimeout(settle), { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') measure(true); });
    document.addEventListener('load', event => { if (event.target.tagName === 'IMG') measure(); }, true);
    if (isBuilder && window.jQuery) {
      const owner = event => event.target.closest && event.target.closest('section');
      window.jQuery(document).on('add.cards changeParameter.cards drag.cards', event => { const section = owner(event); if (section) mount(section); sweep(); measure(true); });
      window.jQuery(document).on('delete.cards', event => { const section = owner(event); if (section) unmount(section); setTimeout(() => { sweep(); measure(true); }, 60); });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
