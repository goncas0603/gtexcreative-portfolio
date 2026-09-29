(() => {
  'use strict';

  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = matchMedia('(min-width: 1101px)');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad = n => String(n).padStart(2, '0');

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Entrada: espera as fontes (máx. 1,5 s) ---------- */
  const start = () => root.classList.add('ready');
  if (motion) {
    Promise.race([
      (window.fontCSS || Promise.resolve()).then(() => document.fonts ? document.fonts.ready : null),
      new Promise(r => setTimeout(r, 1500))
    ]).then(() => requestAnimationFrame(start));
  } else {
    start();
  }

  /* ---------- Relógio: São Paulo e Lisboa ---------- */
  const clocks = $$('[data-tz]');
  const tick = () => {
    const now = new Date();
    clocks.forEach(el => {
      try {
        el.textContent = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: el.dataset.tz }).format(now);
      } catch (e) { el.closest('span').hidden = true; }
    });
  };
  if (clocks.length) { tick(); setInterval(tick, 15000); }

  /* ---------- Menu do celular ---------- */
  const burger = $('#burger');
  const menu = $('#menu');
  const menuLinks = $$('a', menu);
  let menuReturnFocus = null;
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) {
      menuReturnFocus = document.activeElement;
      requestAnimationFrame(() => menuLinks[0]?.focus());
    } else if (menuReturnFocus && document.activeElement !== burger) {
      menuReturnFocus.focus();
      menuReturnFocus = null;
    }
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  menuLinks.forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => {
    if (!document.body.classList.contains('menu-open')) return;
    if (e.key === 'Escape') setMenu(false);
    if (e.key === 'Tab') {
      const focusable = [burger, ...menuLinks];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Revelar ao entrar no ecrã ---------- */
  if (motion) {
    $$('[data-reveal]').forEach(el => {
      const sibs = [...el.parentElement.children].filter(x => x.hasAttribute('data-reveal'));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', (i * (el.closest('.mani__list') ? .16 : .08)) + 's');
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal], .display, .statement, .cta__row, .work').forEach(el => io.observe(el));
  }

  /* ---------- "No ar": cada projeto é verificado agora, no navegador de quem visita ---------- */
  const lives = $$('[data-live]');
  if (window.fetch && 'IntersectionObserver' in window && lives.length) {
    const check = el => {
      const t0 = performance.now();
      fetch(el.dataset.live, { mode: 'no-cors', cache: 'no-store' }).then(() => {
        el.querySelector('.work__ms').textContent = Math.round(performance.now() - t0) + ' ms';
        el.title = 'Tempo de resposta do site, medido agora a partir do seu navegador';
        el.classList.add('is-ok');
      }).catch(() => {});
    };
    const lio = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { lio.unobserve(en.target); check(en.target); }
    }), { rootMargin: '400px 0px' });
    lives.forEach(el => lio.observe(el));
  }

  /* ---------- Contato: o pedido rápido escreve a mensagem do WhatsApp ---------- */
  const brief = $('#brief');
  const goLink = $('#go');
  const goMeta = $('#goMeta');
  if (brief && goLink) {
    const wa = 'https://wa.me/351927874772?text=';
    const base = 'Olá, vi o seu portfólio e quero falar sobre um projeto.';
    const update = () => {
      const picked = ['negocio', 'servico', 'prazo'].map(n => brief.querySelector(`input[name="${n}"]:checked`)).filter(Boolean);
      const msg = picked.length ? ['Olá, vi o seu portfólio.', ...picked.map(i => i.dataset.msg)].join(' ') : base;
      goLink.href = wa + encodeURIComponent(msg);
      goMeta.textContent = picked.length ? picked.map(i => i.value).join(' · ') : 'WhatsApp · +351 927 874 772';
      goLink.classList.toggle('is-ready', picked.length === 3);
    };
    brief.addEventListener('change', update);
    brief.addEventListener('submit', e => e.preventDefault());
    update();
  }

  /* ---------- Faixa editorial do início ---------- */
  const ticks = $$('.ticker__item');
  if (motion && ticks.length > 1) {
    let t = 0;
    setInterval(() => {
      if (document.hidden || scrollY > innerHeight) return;
      const cur = ticks[t];
      t = (t + 1) % ticks.length;
      cur.classList.remove('is-on');
      cur.classList.add('is-out');
      ticks[t].classList.remove('is-out');
      ticks[t].classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-out'), 900);
    }, 3200);
  }

  /* ---------- Rolagem: um só laço ---------- */
  const nav = $('#nav');
  const bar = $('#progress');
  const wa = $('#wa');
  const hero = $('.hero');
  const cta = $('#contato');
  const processEl = $('#processo');
  const navLinks = $$('.nav__link');
  const sections = ['trabalhos', 'sobre', 'processo', 'contato'].map(id => document.getElementById(id));
  const shift = $('.statement__shift');
  const works = $$('.work');
  const rail = $('#rail');
  const railL = $('#railL');
  const railN = $('#railN');
  const railT = $('#railT');
  const railC = $('#railC');
  const railTicks = $$('.rail__ticks a');
  const parts = [
    ['#trabalhos', '01', 'Trabalhos'], ['#sobre', '02', 'Estúdio'], ['#servicos', '03', 'Serviços'],
    ['#processo', '04', 'Processo'], ['#principios', '05', 'Princípios'], ['#contato', '06', 'Contato']
  ].map(([s, n, t]) => ({ el: $(s), n, t }));
  let lastPart = -1;
  const mani = $$('.mani__list li');
  const steps = $$('.step');
  const pmeter = $('#pmeter');
  const pcount = $('#pcount');
  let lastIdx = -1, lastStep = -1, ticking = false;

  function frame() {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    bar.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    nav.classList.toggle('is-solid', y > 40);
    wa.classList.toggle('is-on', y > hero.offsetHeight * .7 && cta.getBoundingClientRect().top > vh * .6);
    const pr = processEl.getBoundingClientRect();
    nav.classList.toggle('on-light', pr.top < nav.offsetHeight && pr.bottom > nav.offsetHeight * .5);

    let cur = '';
    sections.forEach(s => { if (s && s.getBoundingClientRect().top < vh * .45) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('is-on', a.dataset.s === cur));

    // marcador lateral: GTEX/0N · secção (· 03 / 08 nos trabalhos)
    let pi = -1;
    parts.forEach((p, i) => { if (p.el && p.el.getBoundingClientRect().top < vh * .5) pi = i; });
    rail.classList.toggle('is-on', pi > -1);
    rail.classList.toggle('on-light', pr.top < vh * .5 && pr.bottom > vh * .5);
    if (pi !== lastPart && pi > -1) {
      lastPart = pi;
      railN.textContent = 'GTEX/' + parts[pi].n;
      railT.textContent = parts[pi].t;
      if (pi !== 0) railC.textContent = '';
      railTicks.forEach((a, i) => a.classList.toggle('is-on', i === pi));
      if (motion && railL.animate) railL.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      lastIdx = -1;
    }
    if (pi === 0) {
      let idx = 0;
      works.forEach((w, i) => { if (w.getBoundingClientRect().top < vh * .55) idx = i; });
      if (idx !== lastIdx) { lastIdx = idx; railC.textContent = `${pad(idx + 1)} / ${pad(works.length)}`; }
    }

    // processo: o passo mais próximo do centro fica ativo
    let si = 0;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * .55) si = i; });
    if (si !== lastStep) {
      lastStep = si;
      steps.forEach((s, i) => s.classList.toggle('is-on', i === si));
      pmeter.style.setProperty('--pm', ((si + 1) / steps.length).toFixed(3));
      pcount.textContent = `${pad(si + 1)} / ${pad(steps.length)}`;
    }

    // princípios: cada linha acende quando passa dos dois terços do ecrã
    mani.forEach(li => li.classList.toggle('is-lit', li.getBoundingClientRect().top < vh * .68));

    // ecrãs de toque: o projeto que atravessa o centro recebe o estado de "hover"
    if (!fine) {
      works.forEach(w => {
        const r = w.getBoundingClientRect();
        w.classList.toggle('is-cur', r.top < vh * .5 && r.bottom > vh * .5);
      });
    }

    if (motion) {
      // uma linha do "Sobre" desliza de leve
      if (shift) {
        const r = shift.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) {
          const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
          shift.style.setProperty('--shift', ((p - .5) * (wide.matches ? 90 : 20)).toFixed(1) + 'px');
        }
      }
      // paralaxe discreta das imagens dos projetos (só ecrãs largos)
      if (wide.matches) {
        works.forEach(w => {
          const r = w.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return;
          const p = (r.top + r.height / 2 - vh / 2) / vh;
          w.querySelector('.stage__move').style.setProperty('--py', clamp(p * -24, -12, 12).toFixed(1) + 'px');
        });
      }
    }
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  addEventListener('load', kick);
  kick();

  /* ---------- Interações de rato (só computador) ---------- */
  if (!fine) return;

  // projetos: as molduras seguem o rato com atraso suave (lerp).
  // O computador vai no sentido do rato, o celular no oposto e roda menos de 1 grau.
  if (motion) {
    works.forEach(w => {
      const link = w.querySelector('.work__link');
      const stage = w.querySelector('.work__stage');
      const desk = w.querySelector('.stage__move .browser');
      const phone = w.querySelector('.stage__move .phone');
      let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
      const step = () => {
        cx += (tx - cx) * .09;
        cy += (ty - cy) * .09;
        desk.style.translate = `${(cx * 14).toFixed(2)}px ${(cy * 10).toFixed(2)}px`;
        phone.style.translate = `${(cx * -20).toFixed(2)}px ${(cy * -14).toFixed(2)}px`;
        phone.style.rotate = `${(cx * 1.2).toFixed(3)}deg`;
        if (Math.abs(tx - cx) + Math.abs(ty - cy) > .001) { raf = requestAnimationFrame(step); }
        else {
          raf = 0;
          if (!tx && !ty) { desk.style.translate = phone.style.translate = phone.style.rotate = ''; }
        }
      };
      const run = () => { if (!raf) raf = requestAnimationFrame(step); };
      link.addEventListener('pointermove', e => {
        if (!wide.matches) return;
        const r = stage.getBoundingClientRect();
        tx = clamp((e.clientX - r.left) / r.width - .5, -.6, .6);
        ty = clamp((e.clientY - r.top) / r.height - .5, -.6, .6);
        run();
      });
      link.addEventListener('pointerleave', () => { tx = 0; ty = 0; run(); });
    });

    // contato: a seta da linha final aproxima-se um pouco do rato
    const go = $('.go');
    const goArr = go && go.querySelector('.go__arr');
    if (go && goArr) {
      go.addEventListener('pointermove', e => {
        const r = goArr.getBoundingClientRect();
        const dx = clamp((e.clientX - (r.left + r.width / 2)) * .06, -14, 14);
        const dy = clamp((e.clientY - (r.top + r.height / 2)) * .2, -8, 8);
        goArr.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      });
      go.addEventListener('pointerleave', () => { goArr.style.translate = ''; });
    }
  }

  // botões magnéticos (deslocação pequena)
  if (motion) {
    $$('[data-magnetic]').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.translate = `${((e.clientX - (r.left + r.width / 2)) * .12).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * .22).toFixed(1)}px`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
    });
  }
})();
