/* ───────────── Theme Toggle ───────────── */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  const txt = document.getElementById('themeTxt');
  if (txt) txt.textContent = next === 'light' ? 'Dark Mode' : 'Light Mode';
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
    // Default is light
    const txt = document.getElementById('themeTxt');
    if (txt) txt.textContent = 'Dark Mode';
  }
})();

/* ───────────── Collapsible Sections ───────────── */
function toggleSection(btn) {
  const section = btn.closest('.proc-section');
  if (section) section.classList.toggle('collapsed');
}

/* ───────────── Scroll Reveal ───────────── */
function initReveal() {
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
}

document.addEventListener('DOMContentLoaded', initReveal);

/* ───────────── UoW Calculator Logic ───────────── */
function initForm() {
    const grid = document.getElementById('weightsGrid');
    if (!grid) return;

    // Generate 20 inputs
    for (let i = 1; i <= 20; i++) {
        const div = document.createElement('div');
        div.className = 'weight-input-box reveal';
        div.innerHTML = `
            <span>${i}</span>
            <input type="number" step="0.0001" placeholder="0.0000" class="weight-input" data-index="${i}">
        `;
        grid.appendChild(div);
    }

    // Add listeners
    document.querySelectorAll('.weight-input').forEach(input => {
        input.addEventListener('input', calculateResults);
    });

    document.querySelectorAll('input[name="dosageType"]').forEach(radio => {
        radio.addEventListener('change', calculateResults);
    });

    // Initial reveal for dynamic content
    initReveal();
}

function calculateResults() {
    const inputs = document.querySelectorAll('.weight-input');
    const dosageType = document.querySelector('input[name="dosageType"]:checked').value;
    
    let weights = [];
    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) weights.push(val);
    });

    if (weights.length === 0) {
        resetResults();
        return;
    }

    const sum = weights.reduce((a, b) => a + b, 0);
    const avg = sum / weights.length;
    document.getElementById('avgWeight').textContent = avg.toFixed(4) + ' g';

    let limit1Percent, limit2Percent;

    if (dosageType === 'kapsul') {
        limit1Percent = 10;
        limit2Percent = 10; // Kapsul only has one limit stage (10%)
        document.getElementById('limitLabel1').textContent = 'Had ± 10%';
        document.getElementById('limitLabel2').textContent = 'Had ± 10% (N/A)';
    } else {
        // Tablet / Lozenges (USP 43)
        if (avg < 0.130) {
            limit1Percent = 10;
            limit2Percent = 20;
        } else if (avg <= 0.324) {
            limit1Percent = 7.5;
            limit2Percent = 15;
        } else {
            limit1Percent = 5;
            limit2Percent = 10;
        }
        document.getElementById('limitLabel1').textContent = `Had ± ${limit1Percent}%`;
        document.getElementById('limitLabel2').textContent = `Had ± ${limit2Percent}%`;
    }

    const l1Min = avg * (1 - limit1Percent / 100);
    const l1Max = avg * (1 + limit1Percent / 100);
    const l2Min = avg * (1 - limit2Percent / 100);
    const l2Max = avg * (1 + limit2Percent / 100);

    document.getElementById('limitRange1').textContent = `${l1Min.toFixed(4)} - ${l1Max.toFixed(4)}`;
    document.getElementById('limitRange2').textContent = `${l2Min.toFixed(4)} - ${l2Max.toFixed(4)}`;

    let count1 = 0;
    let count2 = 0;

    weights.forEach(w => {
        if (w < l1Min - 0.00001 || w > l1Max + 0.00001) count1++;
        if (w < l2Min - 0.00001 || w > l2Max + 0.00001) count2++;
    });

    document.getElementById('count1').textContent = count1;
    document.getElementById('count2').textContent = count2;
    
    // UI feedback for counts
    if (dosageType === 'kapsul') {
        document.getElementById('count1').className = 'count-val ' + (count1 > 0 ? 'fail' : '');
        document.getElementById('count2').className = 'count-val';
    } else {
        document.getElementById('count1').className = 'count-val ' + (count1 > 2 ? 'fail' : '');
        document.getElementById('count2').className = 'count-val ' + (count2 > 0 ? 'fail' : '');
    }

    // Verdict Logic
    let isPass = false;
    let verdictMsg = '';

    if (weights.length < 20) {
        verdictMsg = `Data belum lengkap (${weights.length}/20)`;
        setVerdict('neutral', 'Sila Tunggu', verdictMsg);
        return;
    }

    if (dosageType === 'kapsul') {
        isPass = (count1 === 0);
        verdictMsg = isPass ? 'Memenuhi kriteria USP 43 (Tiada > ±10%)' : 'GAGAL: Terdapat kapsul melebihi had ±10%';
    } else {
        isPass = (count1 <= 2 && count2 === 0);
        if (isPass) {
            verdictMsg = 'Memenuhi kriteria USP 43';
        } else if (count2 > 0) {
            verdictMsg = 'GAGAL: Terdapat tablet melebihi HAD KEDUA (±10%/15%/20%)';
        } else {
            verdictMsg = 'GAGAL: Lebih 2 tablet melebihi HAD PERTAMA (±5%/7.5%/10%)';
        }
    }

    setVerdict(isPass ? 'pass' : 'fail', isPass ? 'LULUS' : 'TIDAK LULUS', verdictMsg);
}

function setVerdict(status, title, desc) {
    const card = document.getElementById('verdictCard');
    if (card) {
        card.className = 'verdict-card ' + status;
        document.getElementById('verdictStatus').textContent = title;
        document.getElementById('verdictDesc').textContent = desc;
    }
}

function resetResults() {
    const avgEl = document.getElementById('avgWeight');
    if (avgEl) {
        avgEl.textContent = '0.0000 g';
        document.getElementById('limitRange1').textContent = '-';
        document.getElementById('limitRange2').textContent = '-';
        document.getElementById('count1').textContent = '0';
        document.getElementById('count2').textContent = '0';
        document.getElementById('count1').className = 'count-val';
        document.getElementById('count2').className = 'count-val';
        setVerdict('', 'Sila Masuk Data', 'Kiraan akan bermula selepas data lengkap.');
    }
}

function resetForm() {
    if (confirm('Padam semua data dan mula semula?')) {
        document.querySelectorAll('.weight-input').forEach(i => i.value = '');
        document.getElementById('sampleNo').value = '';
        document.getElementById('balanceId').value = '';
        resetResults();
    }
}
