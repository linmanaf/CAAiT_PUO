/* ============================================================
   CAAiT Dashboard — Shared JavaScript (SPA version)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── AOS: Animate on Scroll ────────────────────────────────
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 650, easing: 'ease-out-cubic', once: true, offset: 60 });
  }

  // ── Animated counters ─────────────────────────────────────
  function animateCounter(el, target, duration = 1800, suffix = '') {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        clearInterval(timer);
        el.textContent = target.toLocaleString() + suffix;
      } else {
        el.textContent = Math.floor(start).toLocaleString() + suffix;
      }
    }, 16);
  }

  // Trigger counters when KPI section enters viewport
  const kpiCards = document.querySelectorAll('[data-count]');
  if (kpiCards.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = '1';
          const target  = parseInt(entry.target.dataset.count, 10);
          const suffix  = entry.target.dataset.suffix || '';
          animateCounter(entry.target, target, 1800, suffix);
        }
      });
    }, { threshold: 0.3 });
    kpiCards.forEach(card => observer.observe(card));
  }

  // ── Countdown timer ───────────────────────────────────────
  function startCountdown(targetDateStr) {
    const days_el  = document.getElementById('cd-days');
    const hrs_el   = document.getElementById('cd-hours');
    const min_el   = document.getElementById('cd-mins');
    const sec_el   = document.getElementById('cd-secs');
    if (!days_el) return;

    function update() {
      const now  = new Date();
      const end  = new Date(targetDateStr);
      const diff = end - now;
      if (diff <= 0) {
        days_el.textContent = hrs_el.textContent = min_el.textContent = sec_el.textContent = '00';
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000)  / 60000);
      const s = Math.floor((diff % 60000)    / 1000);
      days_el.textContent = String(d).padStart(2, '0');
      hrs_el.textContent  = String(h).padStart(2, '0');
      min_el.textContent  = String(m).padStart(2, '0');
      sec_el.textContent  = String(s).padStart(2, '0');
    }
    update();
    setInterval(update, 1000);
  }
  startCountdown('2026-08-01T09:00:00');

  // ── Program filter tabs ───────────────────────────────────
  const filterTabs    = document.querySelectorAll('.filter-tab');
  const programCards  = document.querySelectorAll('.program-card');
  if (filterTabs.length) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const type = tab.dataset.filter;
        programCards.forEach(card => {
          const match = type === 'all' || card.dataset.type === type;
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.classList.toggle('hidden', !match);
            if (match) {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }
          }, 150);
        });
      });
    });
    programCards.forEach(c => {
      c.style.transition = 'opacity 0.25s, transform 0.25s';
    });
  }

  // ── Modal (programs module) ───────────────────────────────
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    document.querySelectorAll('.program-card').forEach(card => {
      card.addEventListener('click', () => {
        document.getElementById('modal-num').textContent    = card.dataset.num;
        document.getElementById('modal-title').textContent  = card.dataset.title;
        document.getElementById('modal-date').textContent   = card.dataset.date;
        document.getElementById('modal-type').textContent   = card.dataset.typelabel;
        document.getElementById('modal-desc').textContent   = card.dataset.desc;
        document.getElementById('modal-impact').textContent = card.dataset.impact;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
    document.getElementById('modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  // ── Timeline expand ───────────────────────────────────────
  document.querySelectorAll('.timeline-item').forEach(item => {
    item.addEventListener('click', () => {
      const detail = item.querySelector('.timeline-detail');
      if (detail) detail.classList.toggle('hidden');
    });
  });

});
