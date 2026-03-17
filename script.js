/* ───────────── Theme Toggle ───────────── */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  document.getElementById('themeTxt').textContent = next === 'light' ? 'Dark Mode' : 'Light Mode';
  localStorage.setItem('uow-theme', next);
}

// Restore saved theme
(function () {
  const saved = localStorage.getItem('uow-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    const txt = document.getElementById('themeTxt');
    if (txt) txt.textContent = saved === 'light' ? 'Dark Mode' : 'Light Mode';
  } else {
    // Default is light, so button should say "Dark Mode"
    const txt = document.getElementById('themeTxt');
    if (txt) txt.textContent = 'Dark Mode';
  }
})();

/* ───────────── Collapsible Sections ───────────── */
function toggleSection(btn) {
  const section = btn.closest('.proc-section');
  section.classList.toggle('collapsed');
}

/* ───────────── Scroll Reveal ───────────── */
(function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
})();
