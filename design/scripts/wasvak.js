/* Wasvak: de auto in de hero ligt onder een dikke laag stof en modder die je
   met de spons wegveegt. Helemaal schoon = 10% korting (de beloning-kaart).

   Werking. De schone foto staat als gewone afbeelding in het document;
   daarboven ligt een canvas met de vuillaag. Vegen wist stukjes uit dat canvas
   (globalCompositeOperation "destination-out"), waardoor de foto eronder
   zichtbaar wordt. Dat is de betrouwbaarste techniek: cumulatief, dus wat je
   schoon hebt gemaakt blijft schoon, en het kost per beweging alleen een paar
   stempels in plaats van een herberekening van het hele beeld. Een tweede
   canvas tekent het schuim dat van de spons komt.

   De vuillaag wordt AFGELEID uit de foto zelf: per pixel bepaalt de
   helderheid hoeveel vuil er ligt. Zo valt er geen vuil naast de auto (de
   studio-achtergrond is zwart) en hoeft er geen tweede foto te bestaan die
   toch nooit precies zou uitlijnen.

   Zonder JavaScript, of als er iets misgaat, blijft simpelweg de schone foto
   staan. */

(function () {
  'use strict';

  var vak = document.getElementById('wasvak');
  if (!vak) return;

  var beeld = vak.querySelector('.wasvak-beeld');
  var foto = vak.querySelector('img');
  var doek = vak.querySelector('.wasvak-vuil');
  var schuim = vak.querySelector('.wasvak-schuim');
  var spons = vak.querySelector('.wasvak-spons');
  var hint = document.getElementById('wasvakHint');
  var meter = document.getElementById('wasvakMeter');
  var beloning = document.getElementById('wasvakBeloning');
  if (!beeld || !foto || !doek) return;

  var ctx = doek.getContext('2d', { willReadFrequently: true });
  var sctx = schuim ? schuim.getContext('2d') : null;
  if (!ctx) return;

  var rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KLAAR_VANAF = 0.84; // vanaf hier spoelt de rest vanzelf schoon
  var klaar = false;
  var opgebouwd = false;
  var kwast = null;
  var kwastStraal = 0;
  var vorige = null;
  var meetTimer = 0;

  // Kleine, stabiele pseudo-random voor de vuillaag: zelfde plek geeft altijd
  // dezelfde korrel, dus het vuil "flikkert" niet bij opnieuw opbouwen.
  function ruis(x, y) {
    var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  // De foto wordt met object-fit: cover getoond; hier hetzelfde uitgerekend
  // zodat de vuillaag exact over de zichtbare uitsnede valt.
  function coverKader(bb, bh, cb, ch) {
    var schaal = Math.max(cb / bb, ch / bh);
    var b = bb * schaal;
    var h = bh * schaal;
    return { x: (cb - b) / 2, y: (ch - h) / 2, b: b, h: h };
  }

  function maakKwast(straal) {
    var k = document.createElement('canvas');
    k.width = k.height = straal * 2;
    var kc = k.getContext('2d');
    var g = kc.createRadialGradient(straal, straal, 0, straal, straal, straal);
    // Zachte rand: een harde cirkel geeft zichtbare schubben bij overlap.
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.92)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    kc.fillStyle = g;
    kc.beginPath();
    kc.arc(straal, straal, straal, 0, Math.PI * 2);
    kc.fill();
    return k;
  }

  function bouwVuil() {
    var breed = beeld.clientWidth;
    var hoog = beeld.clientHeight;
    if (!breed || !hoog || !foto.naturalWidth) return false;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    doek.width = Math.round(breed * dpr);
    doek.height = Math.round(hoog * dpr);
    doek.style.width = breed + 'px';
    doek.style.height = hoog + 'px';
    if (schuim) {
      schuim.width = doek.width;
      schuim.height = doek.height;
      schuim.style.width = breed + 'px';
      schuim.style.height = hoog + 'px';
    }

    var w = doek.width;
    var h = doek.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    var kader = coverKader(foto.naturalWidth, foto.naturalHeight, w, h);
    ctx.drawImage(foto, kader.x, kader.y, kader.b, kader.h);

    var beeldData;
    try {
      beeldData = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      // Zou alleen bij een foto van een ander domein gebeuren; dan liever
      // helemaal geen vuillaag dan een halve.
      return false;
    }

    var d = beeldData.data;
    for (var i = 0; i < d.length; i += 4) {
      var px = (i / 4) % w;
      var py = (i / 4 - px) / w;

      // Helderheid bepaalt of hier carrosserie zit: de studio-achtergrond is
      // vrijwel zwart, de auto vangt licht.
      var lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      var dekking = (lum - 4) / 24;
      if (dekking <= 0) {
        d[i + 3] = 0;
        continue;
      }
      if (dekking > 1) dekking = 1;

      // Onderin ligt meer opspattend vuil dan op het dak.
      var laag = py / h;
      dekking *= 0.8 + laag * 0.45;

      // Korrel plus een paar bredere banen, zodat het geen egale waas wordt.
      var k = ruis(px * 0.5, py * 0.5);
      var baan = 0.85 + 0.15 * Math.sin(px * 0.012 + py * 0.03);
      dekking *= (0.78 + k * 0.5) * baan;
      if (dekking > 1) dekking = 1;

      // Modderig grijsbruin, donkerder in de korrel: echt vies, niet stoffig.
      d[i] = 126 - k * 30;
      d[i + 1] = 111 - k * 30;
      d[i + 2] = 90 - k * 26;
      d[i + 3] = Math.round(dekking * 248);
    }
    ctx.putImageData(beeldData, 0, 0);

    // Spatten en druipsporen. "source-atop" houdt ze binnen de vuillaag, dus
    // ze vallen nooit naast de auto op de achtergrond.
    ctx.globalCompositeOperation = 'source-atop';
    for (var sp = 0; sp < 420; sp++) {
      var sx = ruis(sp, 1) * w;
      var sy = h * (0.36 + ruis(sp, 2) * 0.64);
      var sr = (1 + ruis(sp, 3) * 6) * (w / 900);
      ctx.fillStyle = 'rgba(66, 54, 40, ' + (0.18 + ruis(sp, 4) * 0.32).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Verticale druipsporen, alsof de laatste regenbui het vuil liet lopen.
    for (var l = 0; l < 90; l++) {
      var lx = ruis(l, 7) * w;
      var ly = h * (0.22 + ruis(l, 8) * 0.5);
      var len = (12 + ruis(l, 9) * 70) * (h / 500);
      var lw = (1 + ruis(l, 10) * 2.5) * (w / 900);
      ctx.fillStyle = 'rgba(60, 49, 36, ' + (0.12 + ruis(l, 11) * 0.22).toFixed(3) + ')';
      ctx.fillRect(lx, ly, lw, len);
    }
    ctx.globalCompositeOperation = 'source-over';

    kwastStraal = Math.max(34, Math.round(w * 0.052));
    kwast = maakKwast(kwastStraal);
    opgebouwd = true;
    return true;
  }

  /* ── Schuim ────────────────────────────────────────────────────────────
     Kleine witte belletjes die van de spons wegdrijven en opstijgen. Eigen
     canvas, eigen animatielus die stopt zodra alle belletjes op zijn. */
  var deeltjes = [];
  var schuimLoopt = false;

  function spawnSchuim(x, y, n) {
    if (!sctx || rustig) return;
    var eenheid = doek.width / 1000;
    for (var i = 0; i < n; i++) {
      deeltjes.push({
        x: x + (Math.random() - 0.5) * kwastStraal * 1.3,
        y: y + (Math.random() - 0.5) * kwastStraal * 0.9,
        r: (2 + Math.random() * 6) * eenheid,
        vx: (Math.random() - 0.5) * 1.6 * eenheid,
        vy: -(0.4 + Math.random() * 1.6) * eenheid,
        a: 0.6 + Math.random() * 0.3,
        verval: 0.012 + Math.random() * 0.028,
      });
    }
    if (!schuimLoopt) {
      schuimLoopt = true;
      requestAnimationFrame(tikSchuim);
    }
  }

  function tikSchuim() {
    if (!sctx) return;
    sctx.clearRect(0, 0, schuim.width, schuim.height);
    for (var i = 0; i < deeltjes.length; i++) {
      var b = deeltjes[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy *= 0.985;
      b.a -= b.verval;
      if (b.a <= 0) continue;
      sctx.beginPath();
      sctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      sctx.fillStyle = 'rgba(255, 255, 255, ' + (b.a * 0.85).toFixed(3) + ')';
      sctx.fill();
      // Klein lichtpuntje linksboven: maakt een stip een belletje.
      sctx.beginPath();
      sctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
      sctx.fillStyle = 'rgba(255, 255, 255, ' + (b.a * 0.5).toFixed(3) + ')';
      sctx.fill();
    }
    deeltjes = deeltjes.filter(function (b) { return b.a > 0; });
    if (deeltjes.length) requestAnimationFrame(tikSchuim);
    else {
      schuimLoopt = false;
      sctx.clearRect(0, 0, schuim.width, schuim.height);
    }
  }

  /* ── Vegen ───────────────────────────────────────────────────────────── */
  function stempel(x, y) {
    if (!kwast) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(kwast, x - kwastStraal, y - kwastStraal);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Tussen twee posities door stempelen, anders laat een snelle beweging
  // gaten achter.
  function veeg(x, y) {
    if (vorige) {
      var dx = x - vorige.x;
      var dy = y - vorige.y;
      var afstand = Math.hypot(dx, dy);
      var stappen = Math.ceil(afstand / (kwastStraal * 0.4));
      for (var i = 1; i < stappen; i++) {
        stempel(vorige.x + (dx * i) / stappen, vorige.y + (dy * i) / stappen);
      }
    }
    stempel(x, y);
    spawnSchuim(x, y, 3);
    vorige = { x: x, y: y };
    planMeting();
  }

  // Voortgang: het canvas verkleind naar een klein raster kopieren en dat
  // uitlezen. Veel goedkoper dan het volledige beeld doorlopen.
  var mini = document.createElement('canvas');
  mini.width = 64;
  mini.height = 36;
  var miniCtx = mini.getContext('2d', { willReadFrequently: true });

  function meet() {
    if (!miniCtx || klaar) return;
    miniCtx.clearRect(0, 0, mini.width, mini.height);
    miniCtx.drawImage(doek, 0, 0, mini.width, mini.height);
    var d = miniCtx.getImageData(0, 0, mini.width, mini.height).data;
    var vuil = 0;
    for (var i = 3; i < d.length; i += 4) {
      if (d[i] > 8) vuil++;
    }
    // Alleen het deel dat ooit vuil WAS telt mee; de zwarte achtergrond niet.
    if (!meet.start) meet.start = vuil || 1;
    var schoon = 1 - vuil / meet.start;
    if (schoon < 0) schoon = 0;
    if (meter) meter.style.transform = 'scaleX(' + schoon.toFixed(3) + ')';
    if (schoon >= KLAAR_VANAF) rondAf();
  }

  function planMeting() {
    if (meetTimer) return;
    meetTimer = window.setTimeout(function () {
      meetTimer = 0;
      meet();
    }, 140);
  }

  function rondAf() {
    if (klaar) return;
    klaar = true;
    vak.dataset.klaar = '1';
    vak.dataset.actief = '0';
    if (meter) meter.style.transform = 'scaleX(1)';
    if (hint) hint.textContent = 'Schoon. Strak. Klaar.';

    // Laatste sopgolf over de hele auto, als afspoel-moment.
    if (sctx && !rustig) {
      var w = doek.width;
      var h = doek.height;
      for (var i = 0; i < 130; i++) {
        spawnSchuim(w * (0.15 + Math.random() * 0.7), h * (0.3 + Math.random() * 0.55), 1);
      }
    }

    // En dan de beloning: 10% korting op de volgende wasbeurt.
    if (beloning) {
      window.setTimeout(function () {
        beloning.hidden = false;
        requestAnimationFrame(function () {
          beloning.classList.add('toon');
        });
      }, rustig ? 0 : 550);
    }
  }

  function positie(e) {
    var r = doek.getBoundingClientRect();
    var schaalX = doek.width / r.width;
    var schaalY = doek.height / r.height;
    return { x: (e.clientX - r.left) * schaalX, y: (e.clientY - r.top) * schaalY, cx: e.clientX - r.left, cy: e.clientY - r.top };
  }

  function volgSpons(p) {
    if (!spons) return;
    spons.style.transform = 'translate3d(' + p.cx + 'px,' + p.cy + 'px,0) rotate(-8deg)';
  }

  beeld.addEventListener('pointerenter', function () {
    if (klaar) return;
    vak.dataset.actief = '1';
  });
  beeld.addEventListener('pointerleave', function () {
    vak.dataset.actief = '0';
    vorige = null;
  });
  beeld.addEventListener('pointermove', function (e) {
    if (klaar || !opgebouwd) return;
    var p = positie(e);
    volgSpons(p);
    // Met de muis veeg je door te bewegen; met een vinger alleen als je
    // ingedrukt houdt, anders zou scrollen de auto poetsen.
    if (e.pointerType === 'mouse' || e.pressure > 0 || e.buttons > 0) veeg(p.x, p.y);
  });
  beeld.addEventListener('pointerdown', function (e) {
    if (klaar || !opgebouwd) return;
    vak.dataset.actief = '1';
    var p = positie(e);
    volgSpons(p);
    vorige = null;
    veeg(p.x, p.y);
  });
  beeld.addEventListener('pointerup', function () {
    vorige = null;
  });

  // Op een aanraakscherm laat de site het gebaar eerst zelf zien: een korte
  // veeg over de motorkap. De rest doet de bezoeker.
  function voorbeeldVeeg() {
    if (klaar || !opgebouwd) return;
    var w = doek.width;
    var h = doek.height;
    var start = performance.now();
    var duur = 1500;
    function stap(nu) {
      var t = Math.min((nu - start) / duur, 1);
      var x = w * (0.18 + t * 0.6);
      var y = h * (0.52 + Math.sin(t * Math.PI * 1.6) * 0.16);
      veeg(x, y);
      if (t < 1) requestAnimationFrame(stap);
      else vorige = null;
    }
    requestAnimationFrame(stap);
  }

  function start() {
    if (!bouwVuil()) return;
    meet.start = 0;
    meet();

    var metVinger = window.matchMedia('(pointer: coarse)').matches;
    if (metVinger && !rustig && 'IntersectionObserver' in window) {
      var kijker = new IntersectionObserver(function (rijen) {
        rijen.forEach(function (rij) {
          if (rij.isIntersecting) {
            kijker.disconnect();
            window.setTimeout(voorbeeldVeeg, 500);
          }
        });
      }, { threshold: 0.5 });
      kijker.observe(vak);
    }
  }

  if (foto.complete && foto.naturalWidth) start();
  else foto.addEventListener('load', start, { once: true });

  // Bij het draaien van een telefoon of het verslepen van een venster klopt de
  // maat niet meer. Opnieuw opbouwen mag alleen zolang er nog werk ligt.
  var maatTimer = 0;
  window.addEventListener('resize', function () {
    if (klaar) return;
    window.clearTimeout(maatTimer);
    maatTimer = window.setTimeout(function () {
      meet.start = 0;
      if (bouwVuil()) meet();
    }, 220);
  });
})();
