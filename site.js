(() => {
  const NO = '905459242512';
  const ACILIS = 10, KAPANIS = 20;
  const SAATLER = [10, 12, 14, 16, 18];
  const GUN = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
  const iki = s => String(s).padStart(2, '0') + '.00';
  const buyuk = s => s[0].toLocaleUpperCase('tr') + s.slice(1);

  const durum = dk => {
    if (dk >= ACILIS * 60 && dk < KAPANIS * 60) return 'Şu an açık, kapanış ' + iki(KAPANIS) + '.';
    return 'Şu an kapalı, açılış ' + (dk < ACILIS * 60 ? 'bugün ' : 'yarın ') + iki(ACILIS) + '.';
  };
  console.assert(durum(600) === 'Şu an açık, kapanış 20.00.');
  console.assert(durum(540) === 'Şu an kapalı, açılış bugün 10.00.');
  console.assert(durum(1210) === 'Şu an kapalı, açılış yarın 10.00.');

  const gunler = (g, saat) => {
    const liste = [];
    for (let k = saat >= SAATLER[SAATLER.length - 1] ? 1 : 0; liste.length < 4; k++) liste.push({ ad: k === 0 ? 'bugün' : k === 1 ? 'yarın' : GUN[(g + k) % 7], k });
    return liste;
  };
  console.assert(gunler(1, 11).map(x => x.ad).join() === 'bugün,yarın,çarşamba,perşembe');
  console.assert(gunler(6, 19).map(x => x.ad).join() === 'yarın,pazartesi,salı,çarşamba');

  const mesaj = (hizmet, gun, saat) => {
    const bas = hizmet ? 'Merhaba, ' + hizmet + ' için randevu almak istiyorum.' : 'Merhaba, randevu almak istiyorum; hangi hizmetin uygun olduğunu konuşmak isterim.';
    return [bas, gun && 'Gün: ' + gun, saat && 'Saat: ' + saat + ' civarı'].filter(Boolean).join('\n');
  };
  console.assert(mesaj('ipek kirpik', 'yarın', '14.00') === 'Merhaba, ipek kirpik için randevu almak istiyorum.\nGün: yarın\nSaat: 14.00 civarı');
  console.assert(mesaj('', 'bugün', '') === 'Merhaba, randevu almak istiyorum; hangi hizmetin uygun olduğunu konuşmak isterim.\nGün: bugün');

  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Istanbul', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const bugun = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  const simdi = +p.hour, dk = +p.hour * 60 + +p.minute;
  if (bugun > -1) {
    const metin = durum(dk);
    document.querySelectorAll('[data-durum]').forEach(el => { el.textContent = metin; el.hidden = false; });
    document.querySelectorAll('tr[data-gun="' + bugun + '"]').forEach(tr => {
      tr.classList.add('bugun');
      tr.querySelector('th').insertAdjacentHTML('beforeend', ' <span>bugün</span>');
    });
  }

  const fis = document.querySelector('form[data-fis]');
  if (fis && bugun > -1) {
    const gunKutu = fis.querySelector('[data-gunler]');
    gunKutu.innerHTML = gunler(bugun, simdi).map((x, i) => `<label class="cip"><input type="radio" name="gun" value="${x.ad}" data-k="${x.k}"${i === 0 ? ' checked' : ''}>${buyuk(x.ad)}</label>`).join('');
    const gonder = [...document.querySelectorAll('[data-gonder]')];
    const yenile = () => {
      const h = fis.querySelector('input[name="hizmet"]:checked');
      const g = fis.querySelector('input[name="gun"]:checked');
      const bugunMu = g && g.dataset.k === '0';
      fis.querySelectorAll('input[name="saat"]').forEach(s => {
        const gecti = bugunMu && +s.dataset.saat <= simdi;
        s.disabled = gecti;
        if (gecti && s.checked) s.checked = false;
      });
      const s = fis.querySelector('input[name="saat"]:checked');
      const metin = mesaj(h ? h.value : '', g ? g.value : '', s ? s.value : '');
      fis.querySelector('[data-mesaj]').textContent = metin;
      gonder.forEach(a => a.href = 'https://wa.me/' + NO + '?text=' + encodeURIComponent(metin));
    };
    fis.addEventListener('change', yenile);
    fis.addEventListener('submit', e => { e.preventDefault(); location.href = gonder[0].href; });
    yenile();
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
      kok.dataset.theme = koyuMu() ? 'light' : 'dark';
      try { localStorage.setItem('isenlik-tema', kok.dataset.theme); } catch (e) {}
      goster();
    });
  }
})();
