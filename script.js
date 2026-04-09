/* ============================================================
   MONOLOOG HOTELS — Main JavaScript
   ============================================================ */

'use strict';

/* ── Wishlist toggle ────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.hotel-card__wishlist');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const svg = btn.querySelector('svg');
  const isSaved = btn.dataset.saved === 'true';
  btn.dataset.saved = !isSaved;
  svg.style.fill = isSaved ? 'none' : 'var(--brand-red)';
  btn.style.background = isSaved ? 'rgba(255,255,255,0.85)' : 'white';
});

/* ── Category pills ─────────────────────────────────────────── */
document.querySelectorAll('.category-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

/* ── Search bar focus behavior ──────────────────────────────── */
document.querySelectorAll('.search-segment').forEach(seg => {
  seg.addEventListener('click', () => {
    seg.querySelector('input')?.focus();
  });
});

/* ── Stepper buttons ────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.stepper__btn');
  if (!btn) return;
  const stepper = btn.closest('.stepper');
  const valEl = stepper.querySelector('.stepper__val');
  const isPlus = btn.dataset.dir === 'plus';
  let val = parseInt(valEl.textContent, 10);
  const min = parseInt(stepper.dataset.min ?? 1, 10);
  const max = parseInt(stepper.dataset.max ?? 20, 10);
  val = isPlus ? Math.min(val + 1, max) : Math.max(val - 1, min);
  valEl.textContent = val;

  // Update minus button disabled state
  stepper.querySelector('[data-dir="minus"]').disabled = val <= min;
  stepper.querySelector('[data-dir="plus"]').disabled = val >= max;
});

/* ── Filter chips ───────────────────────────────────────────── */
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('active');
  });
});

/* ── Simple date picker ─────────────────────────────────────── */
class DatePicker {
  constructor(triggerEl, outputEl) {
    this.trigger = triggerEl;
    this.output  = outputEl;
    this.today   = new Date();
    this.month   = this.today.getMonth();
    this.year    = this.today.getFullYear();
    this.start   = null;
    this.end     = null;
    this.open    = false;
    this._buildUI();
    this._bind();
  }

  _buildUI() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'datepicker-dropdown';
    this.dropdown.innerHTML = `
      <div class="datepicker-header">
        <button class="btn-circle dp-prev" aria-label="Previous month">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="dp-month-label"></span>
        <button class="btn-circle dp-next" aria-label="Next month">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div class="dp-days-header"></div>
      <div class="dp-days-grid"></div>
    `;
    document.body.appendChild(this.dropdown);
    this._addStyles();
    this._render();
  }

  _addStyles() {
    if (document.getElementById('dp-styles')) return;
    const style = document.createElement('style');
    style.id = 'dp-styles';
    style.textContent = `
      .datepicker-dropdown {
        position: fixed;
        background: white;
        border-radius: 20px;
        box-shadow: rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px;
        padding: 20px;
        z-index: 9999;
        width: 320px;
        display: none;
        animation: fadeUp 0.2s ease;
      }
      .datepicker-dropdown.open { display: block; }
      .datepicker-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .dp-month-label {
        font-family: 'Barlow Condensed', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        color: #222;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .dp-days-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        margin-bottom: 4px;
      }
      .dp-day-name {
        font-family: 'Barlow Condensed', sans-serif;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6a6a6a;
        text-align: center;
        padding: 4px 0;
      }
      .dp-days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }
      .dp-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 0.8125rem;
        font-family: 'Roboto', sans-serif;
        cursor: pointer;
        transition: all 0.15s ease;
        color: #222;
      }
      .dp-day:hover:not(.dp-day--disabled) { background: #f2f2f2; }
      .dp-day--disabled { color: rgba(0,0,0,0.24); cursor: default; pointer-events: none; }
      .dp-day--start, .dp-day--end {
        background: #D40424 !important;
        color: white !important;
        font-weight: 700;
      }
      .dp-day--in-range { background: rgba(212,4,36,0.08); border-radius: 0; }
      .dp-day--start { border-radius: 50% 0 0 50%; }
      .dp-day--end { border-radius: 0 50% 50% 0; }
      .dp-day--start.dp-day--end { border-radius: 50%; }
      .dp-day--empty { pointer-events: none; }
    `;
    document.head.appendChild(style);
  }

  _render() {
    const MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    this.dropdown.querySelector('.dp-month-label').textContent =
      `${MONTHS[this.month]} ${this.year}`;

    const daysHeader = this.dropdown.querySelector('.dp-days-header');
    daysHeader.innerHTML = DAYS.map(d => `<div class="dp-day-name">${d}</div>`).join('');

    const grid = this.dropdown.querySelector('.dp-days-grid');
    const firstDay = new Date(this.year, this.month, 1).getDay();
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += `<div class="dp-day dp-day--empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(this.year, this.month, d);
      const ts = date.getTime();
      const isPast = date < today;
      const isStart = this.start && ts === this.start.getTime();
      const isEnd = this.end && ts === this.end.getTime();
      const inRange = this.start && this.end && ts > this.start.getTime() && ts < this.end.getTime();
      let cls = 'dp-day';
      if (isPast) cls += ' dp-day--disabled';
      if (isStart) cls += ' dp-day--start';
      if (isEnd) cls += ' dp-day--end';
      if (inRange) cls += ' dp-day--in-range';
      cells += `<div class="${cls}" data-ts="${ts}">${d}</div>`;
    }
    grid.innerHTML = cells;
  }

  _bind() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open = !this.open;
      if (this.open) {
        const rect = this.trigger.getBoundingClientRect();
        this.dropdown.style.top = `${rect.bottom + 8}px`;
        this.dropdown.style.left = `${rect.left}px`;
        this.dropdown.classList.add('open');
      } else {
        this.dropdown.classList.remove('open');
      }
    });

    this.dropdown.querySelector('.dp-prev').addEventListener('click', () => {
      if (this.month === 0) { this.month = 11; this.year--; }
      else this.month--;
      this._render();
    });

    this.dropdown.querySelector('.dp-next').addEventListener('click', () => {
      if (this.month === 11) { this.month = 0; this.year++; }
      else this.month++;
      this._render();
    });

    this.dropdown.addEventListener('click', (e) => {
      const day = e.target.closest('.dp-day');
      if (!day || day.classList.contains('dp-day--disabled')) return;
      const ts = parseInt(day.dataset.ts, 10);
      const date = new Date(ts);

      if (!this.start || (this.start && this.end) || date < this.start) {
        this.start = date; this.end = null;
      } else {
        this.end = date;
        if (this.output) {
          const fmt = (d) => d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
          this.output.textContent = `${fmt(this.start)} – ${fmt(this.end)}`;
        }
        setTimeout(() => { this.dropdown.classList.remove('open'); this.open = false; }, 300);
      }
      this._render();
    });

    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.trigger) {
        this.dropdown.classList.remove('open');
        this.open = false;
      }
    });
  }
}

/* ── Init date pickers ──────────────────────────────────────── */
document.querySelectorAll('[data-datepicker]').forEach(trigger => {
  const outputId = trigger.dataset.datepicker;
  const output = outputId ? document.getElementById(outputId) : null;
  new DatePicker(trigger, output);
});

/* ── Mobile search overlay ──────────────────────────────────── */
const mobileSearchBtn = document.getElementById('mobile-search-btn');
const searchOverlay   = document.getElementById('search-overlay');
const searchOverlayClose = document.getElementById('search-overlay-close');

if (mobileSearchBtn && searchOverlay) {
  mobileSearchBtn.addEventListener('click', () => {
    searchOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  searchOverlayClose?.addEventListener('click', () => {
    searchOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });
}

/* ── Photo gallery lightbox ─────────────────────────────────── */
document.querySelectorAll('.gallery-img').forEach((img, i, all) => {
  img.addEventListener('click', () => {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightbox__overlay"></div>
      <div class="lightbox__content">
        <button class="lightbox__close">&times;</button>
        <button class="lightbox__prev">&#8249;</button>
        <img class="lightbox__img" src="${img.src}" alt="Hotel photo">
        <button class="lightbox__next">&#8250;</button>
        <div class="lightbox__counter">${i + 1} / ${all.length}</div>
      </div>`;

    if (!document.getElementById('lb-styles')) {
      const s = document.createElement('style');
      s.id = 'lb-styles';
      s.textContent = `
        .lightbox { position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; }
        .lightbox__overlay { position:absolute; inset:0; background:rgba(0,0,0,0.9); cursor:pointer; }
        .lightbox__content { position:relative; z-index:1; display:flex; align-items:center; gap:20px; max-width:90vw; }
        .lightbox__img { max-height:80vh; max-width:80vw; border-radius:12px; object-fit:contain; }
        .lightbox__close { position:fixed; top:20px; right:20px; font-size:2rem; color:white; background:rgba(255,255,255,0.1); border:none; border-radius:50%; width:48px; height:48px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .lightbox__prev, .lightbox__next { font-size:2.5rem; color:white; background:rgba(255,255,255,0.15); border:none; border-radius:50%; width:48px; height:48px; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:background 0.2s; }
        .lightbox__prev:hover, .lightbox__next:hover { background:rgba(255,255,255,0.3); }
        .lightbox__counter { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); color:rgba(255,255,255,0.7); font-family:'Barlow Condensed',sans-serif; font-size:0.875rem; font-weight:600; letter-spacing:0.06em; }
      `;
      document.head.appendChild(s);
    }

    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';

    let cur = i;
    const updateImg = () => {
      lb.querySelector('.lightbox__img').src = all[cur].src;
      lb.querySelector('.lightbox__counter').textContent = `${cur + 1} / ${all.length}`;
    };

    lb.querySelector('.lightbox__close').onclick = () => { lb.remove(); document.body.style.overflow = ''; };
    lb.querySelector('.lightbox__overlay').onclick = () => { lb.remove(); document.body.style.overflow = ''; };
    lb.querySelector('.lightbox__prev').onclick = () => { cur = (cur - 1 + all.length) % all.length; updateImg(); };
    lb.querySelector('.lightbox__next').onclick = () => { cur = (cur + 1) % all.length; updateImg(); };
  });
});

/* ── Sticky header shrink on scroll ─────────────────────────── */
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('shrunk', window.scrollY > 60);
  }, { passive: true });
}

/* ── Smooth fade-in for cards on scroll ─────────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.hotel-card').forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(16px)';
  card.style.transition = `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s, box-shadow 0.2s ease`;
  observer.observe(card);
});

/* ── Price range slider ─────────────────────────────────────── */
const priceRange = document.getElementById('price-range');
const priceLabel = document.getElementById('price-label');
if (priceRange && priceLabel) {
  priceRange.addEventListener('input', () => {
    priceLabel.textContent = `Up to Rp${Number(priceRange.value).toLocaleString('id-ID')}`;
  });
}

/* ── Tab navigation ─────────────────────────────────────────── */
document.querySelectorAll('[data-tab-trigger]').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const group = trigger.dataset.tabGroup;
    const target = trigger.dataset.tabTrigger;
    document.querySelectorAll(`[data-tab-group="${group}"][data-tab-trigger]`)
      .forEach(t => t.classList.remove('active'));
    document.querySelectorAll(`[data-tab-group="${group}"][data-tab-panel]`)
      .forEach(p => p.hidden = true);
    trigger.classList.add('active');
    const panel = document.querySelector(`[data-tab-group="${group}"][data-tab-panel="${target}"]`);
    if (panel) panel.hidden = false;
  });
});

/* ── Checkout form steps ─────────────────────────────────────── */
const nextStepBtns = document.querySelectorAll('[data-next-step]');
nextStepBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const currentPanel = btn.closest('[data-step-panel]');
    const nextId = btn.dataset.nextStep;
    const nextPanel = document.querySelector(`[data-step-panel="${nextId}"]`);
    const nextTrigger = document.querySelector(`[data-step-num="${nextId}"]`);
    const currentNum = currentPanel?.dataset.stepPanel;
    const currentTrigger = document.querySelector(`[data-step-num="${currentNum}"]`);

    if (currentPanel) currentPanel.hidden = true;
    if (nextPanel) nextPanel.hidden = false;
    if (currentTrigger) { currentTrigger.classList.remove('active'); currentTrigger.classList.add('done'); }
    if (nextTrigger) nextTrigger.classList.add('active');

    // Update step connector
    document.querySelectorAll('.checkout-step').forEach(step => {
      const num = step.dataset.stepNum;
      if (num < nextId) { step.classList.remove('active'); step.classList.add('done'); }
      else if (num == nextId) { step.classList.add('active'); step.classList.remove('done'); }
    });
  });
});

console.log('%c MONOLOOG HOTELS ', 'background:#D40424;color:white;font-family:sans-serif;font-weight:bold;padding:4px 8px;border-radius:4px;', '— Welcome to the booking experience.');
