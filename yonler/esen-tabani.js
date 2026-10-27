(() => {
  const NO = '905459242512';
  const SAAT = [[10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20]];
  const GUN = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
  const iki = s => String(s).padStart(2, '0') + '.00';

  document.querySelectorAll('form[data-randevu]').forEach(form => {
    const cikti = form.querySelector('[data-mesaj]');
    const gonder = form.querySelector('[data-gonder]');
    const yenile = () => {
      const satir = ['Merhaba, randevu almak istiyorum.'];
      for (const el of form.elements) {
        if (!el.name) continue;
        const deger = String(el.value).trim();
        if (deger) satir.push(form.querySelector('label[for="' + el.id + '"]').textContent.trim() + ': ' + deger);
      }
      const metin = satir.join('\n');
      cikti.textContent = metin;
      gonder.href = 'https://wa.me/' + NO + '?text=' + encodeURIComponent(metin);
    };
    form.addEventListener('input', yenile);
    form.addEventListener('submit', e => { e.preventDefault(); location.href = gonder.href; });
    yenile();
  });

  const durum = (gun, dk) => {
    const s = SAAT[gun];
    if (s && dk >= s[0] * 60 && dk < s[1] * 60) return 'Şu an açık. Kapanış ' + iki(s[1]) + '.';
    if (s && dk < s[0] * 60) return 'Şu an kapalı. Açılış bugün ' + iki(s[0]) + '.';
    let g = (gun + 1) % 7, n = 1;
    while (!SAAT[g]) { g = (g + 1) % 7; n++; }
    return 'Şu an kapalı. Açılış ' + (n === 1 ? 'yarın' : GUN[g]) + ' ' + iki(SAAT[g][0]) + '.';
  };
  console.assert(durum(1, 600) === 'Şu an açık. Kapanış 20.00.');
  console.assert(durum(0, 540) === 'Şu an kapalı. Açılış bugün 10.00.');
  console.assert(durum(6, 1250) === 'Şu an kapalı. Açılış yarın 10.00.');

  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Istanbul', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const gun = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  if (gun > -1) {
    const metin = durum(gun, +p.hour * 60 + +p.minute);
    document.querySelectorAll('[data-durum]').forEach(el => { el.textContent = metin; el.dataset.acik = metin.startsWith('Şu an açık') ? '1' : '0'; el.hidden = false; });
    document.querySelectorAll('tr[data-gun="' + gun + '"]').forEach(tr => {
      tr.classList.add('bugun');
      tr.querySelector('th').insertAdjacentHTML('beforeend', ' <span>bugün</span>');
    });
  }

  const cubuk = document.querySelector('.cubuk');
  if (cubuk && 'IntersectionObserver' in window) {
    const gorunen = new Set();
    const io = new IntersectionObserver(girdiler => {
      girdiler.forEach(g => g.isIntersecting ? gorunen.add(g.target) : gorunen.delete(g.target));
      cubuk.classList.toggle('gizle', gorunen.size > 0);
    }, { rootMargin: '-1px 0px 0px 0px' });
    document.querySelectorAll('[data-cubuk-gizle]').forEach(el => io.observe(el));
  }

  const dugme = document.querySelector('[data-tema-dugme]');
  if (dugme) {
    const isinlar = [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="12" y1="2" x2="12" y2="4.2" transform="rotate(${a} 12 12)"/>`).join('');
    dugme.innerHTML = `<svg class="gece-simge" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><mask id="gece-maske"><rect width="24" height="24" fill="#fff"/><circle class="gece-golge" cx="17.5" cy="6.5" r="6" fill="#000"/></mask><circle class="gece-cekirdek" cx="12" cy="12" r="4.6" fill="currentColor" mask="url(#gece-maske)"/><g class="gece-isinlar" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${isinlar}</g></svg>`;
    const stil = document.createElement('style');
    stil.textContent = '.gece-simge{width:1.25rem;height:1.25rem;overflow:visible}.gece-golge,.gece-cekirdek,.gece-isinlar{transition:transform .5s cubic-bezier(.23,1,.32,1),opacity .3s ease-out}.gece-golge{transform:translate(9px,-9px)}.gece-cekirdek{transform-box:fill-box;transform-origin:center}.gece-isinlar{transform-box:view-box;transform-origin:12px 12px}[data-koyu="1"] .gece-golge{transform:translate(-2.7px,2.7px)}[data-koyu="1"] .gece-cekirdek{transform:scale(1.55)}[data-koyu="1"] .gece-isinlar{opacity:0;transform:rotate(-60deg) scale(.4)}@media (prefers-reduced-motion:reduce){.gece-golge,.gece-cekirdek,.gece-isinlar{transition:none}}';
    document.head.appendChild(stil);
    const kok = document.documentElement;
    const sorgu = matchMedia('(prefers-color-scheme: dark)');
    const koyuMu = () => (kok.dataset.theme || (sorgu.matches ? 'dark' : 'light')) === 'dark';
    const goster = () => {
      const yazi = koyuMu() ? 'Açık temaya geç' : 'Koyu temaya geç';
      dugme.setAttribute('aria-label', yazi);
      dugme.title = yazi;
      dugme.dataset.koyu = koyuMu() ? '1' : '0';
      dugme.hidden = false;
    };
    goster();
    sorgu.addEventListener('change', goster);
    dugme.addEventListener('click', () => {
      const yeni = koyuMu() ? 'light' : 'dark';
      kok.dataset.theme = yeni;
      try { localStorage.setItem('isenlik-tema', yeni); } catch (e) {}
      goster();
    });
  }
})();
