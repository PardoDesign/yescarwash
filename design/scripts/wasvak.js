/* Wasvak: de auto in de hero ligt onder een dikke laag stof en modder die je
   met de spons wegveegt. Helemaal schoon = korting (de beloning-kaart).

   De actie is eenmalig: wie de code al heeft gehaald staat al op de lijst, dus
   dan blijft de auto gewoon schoon staan en gebeurt er niets meer.

   Werking. De schone foto staat als gewone afbeelding in het document;
   daarboven ligt een canvas met de vuillaag. Vegen wist stukjes uit dat canvas
   (globalCompositeOperation "destination-out"), waardoor de foto eronder
   zichtbaar wordt. Dat is de betrouwbaarste techniek: cumulatief, dus wat je
   schoon hebt gemaakt blijft schoon, en het kost per beweging alleen een paar
   stempels in plaats van een herberekening van het hele beeld. Een tweede
   canvas tekent het schuim dat van de spons komt.

   De vuillaag is een ECHTE foto van dezelfde auto onder de modder, pixel-op-
   pixel uitgelijnd met de schone versie (beide vrijstaand, met alpha-kanaal).
   Daardoor komt er onder je spons geen berekend waas vandaan maar de auto
   zoals hij werkelijk schoon is.

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

  // Onthouden dat de bezoeker de code al heeft opgehaald. Alleen een vlaggetje,
  // geen persoonsgegeven; localStorage kan geblokkeerd zijn (privacymodus),
  // vandaar de try.
  var GEHAD = 'yescarwash-korting-gehad';
  function alGehad() {
    try { return window.localStorage.getItem(GEHAD) === '1'; } catch (e) { return false; }
  }
  function onthoudGehad() {
    try { window.localStorage.setItem(GEHAD, '1'); } catch (e) { /* niet erg */ }
  }

  // Al gehad: geen modderlaag, geen oproep, geen spons. Gewoon een schone auto.
  if (alGehad()) {
    vak.removeAttribute('data-laden');
    vak.dataset.klaar = '1';
    var oproepAf = document.getElementById('wasvakOproep');
    if (oproepAf) oproepAf.hidden = true;
    if (hint) hint.hidden = true;
    return;
  }
  var KLAAR_VANAF = 0.84; // vanaf hier spoelt de rest vanzelf schoon
  var klaar = false;
  var opgebouwd = false;
  var kwast = null;
  var kwastStraal = 0;
  var vorige = null;
  var meetTimer = 0;
  var demoLoopt = false;

  var kaderNu = null;

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

  var viesBeeld = null;

  function bouwVuil() {
    var breed = beeld.clientWidth;
    var hoog = beeld.clientHeight;
    if (!breed || !hoog || !viesBeeld || !viesBeeld.naturalWidth) return false;

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

    // De vieze foto vult het vak precies zoals de schone eronder (beide
    // hetzelfde doekformaat), dus ze liggen pixel-op-pixel.
    kaderNu = { x: 0, y: 0, b: w, h: h };
    ctx.drawImage(viesBeeld, 0, 0, w, h);

    kwastStraal = Math.max(30, Math.round(w * 0.046));
    kwast = maakKwast(kwastStraal);
    opgebouwd = true;
    // Nu pas de schone auto eronder vrijgeven: hij is vanaf hier toch bedekt,
    // dus de bezoeker ziet hem nooit onbedekt oplichten.
    vak.removeAttribute('data-laden');
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
    if (!demoLoopt) vak.dataset.bezig = '1';
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
    if (!miniCtx || klaar || !kaderNu) return;
    miniCtx.clearRect(0, 0, mini.width, mini.height);
    var mx = kaderNu.x + kaderNu.b * 0.26;
    miniCtx.drawImage(
      doek,
      mx, kaderNu.y, kaderNu.x + kaderNu.b - mx, kaderNu.h,
      0, 0, mini.width, mini.height,
    );
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
    if (hint) hint.textContent = 'Schoon werk.';

    // Laatste sopgolf over de hele auto, als afspoel-moment.
    if (sctx && !rustig && kaderNu) {
      for (var i = 0; i < 130; i++) {
        spawnSchuim(
          kaderNu.x + kaderNu.b * (0.12 + Math.random() * 0.76),
          kaderNu.y + kaderNu.h * (0.28 + Math.random() * 0.55),
          1,
        );
      }
    }

    // En dan de beloning: e-mailadres achterlaten voor 10% korting.
    if (beloning) {
      window.setTimeout(function () {
        beloning.hidden = false;
        requestAnimationFrame(function () {
          beloning.classList.add('toon');
          var veld = beloning.querySelector('input[type="email"]');
          if (veld && window.matchMedia('(pointer: fine)').matches) veld.focus();
        });
      }, rustig ? 0 : 550);
    }
  }

  /* ── Beloning: e-mail naar de mailinglijst ─────────────────────────────
     Het adres gaat naar het YES-ledenplatform (data-api op het formulier).
     Lukt dat niet, bijvoorbeeld omdat het platform nog niet publiek draait,
     dan krijgt de bezoeker ALSNOG de code plus een eerlijke melding: de
     korting mag nooit sneuvelen op techniek. */
  var form = document.getElementById('beloningForm');
  if (form && beloning) {
    var codeRegel = beloning.querySelector('.beloning-code');
    var statusRegel = beloning.querySelector('.beloning-status');
    var privacyRegel = beloning.querySelector('.beloning-privacy');

    var toonCode = function (bericht) {
      form.hidden = true;
      if (privacyRegel) privacyRegel.hidden = true;
      if (codeRegel) codeRegel.hidden = false;
      if (statusRegel && bericht) {
        statusRegel.hidden = false;
        statusRegel.textContent = bericht;
      }
      // Vanaf nu is de actie voorbij voor deze bezoeker.
      onthoudGehad();
    };

    var sluitKnop = document.getElementById('beloningSluit');
    if (sluitKnop) {
      sluitKnop.addEventListener('click', function () {
        beloning.classList.remove('toon');
        window.setTimeout(function () { beloning.hidden = true; }, 450);
      });
    }
    // Escape sluit hem ook, zoals elk paneel.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !beloning.hidden) {
        beloning.classList.remove('toon');
        window.setTimeout(function () { beloning.hidden = true; }, 450);
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var veld = form.querySelector('input[type="email"]');
      if (!veld || !veld.checkValidity()) {
        if (veld && veld.reportValidity) veld.reportValidity();
        return;
      }

      var api = form.getAttribute('data-api') || '';
      // Alleen proberen als het endpoint bereikbaar kan zijn: zolang het
      // platform alleen lokaal draait, zou een poging vanaf de publieke site
      // enkel op de CSP stuklopen.
      var lokaal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
      var eigenOrigin = api.indexOf(location.origin + '/') === 0;
      if (!api || (!lokaal && !eigenOrigin)) {
        toonCode('Je e-mailadres kon nu niet worden opgeslagen; de code werkt gewoon.');
        return;
      }

      var knop = form.querySelector('button');
      if (knop) {
        knop.disabled = true;
        knop.textContent = 'Versturen...';
      }
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = ctrl ? window.setTimeout(function () { ctrl.abort(); }, 6000) : 0;

      fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'yescarwash',
          email: veld.value.trim(),
          bron: 'wasvak-hero',
          actieCode: 'SPONS10',
        }),
        signal: ctrl ? ctrl.signal : undefined,
      })
        .then(function (r) {
          if (timer) window.clearTimeout(timer);
          if (!r.ok) throw new Error('http ' + r.status);
          toonCode('Gelukt! Je staat op de lijst.');
        })
        .catch(function () {
          if (timer) window.clearTimeout(timer);
          toonCode('Je e-mailadres kon nu niet worden opgeslagen; de code werkt gewoon.');
        });
    });
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

  // Alleen op de auto zelf poetsen: daarbuiten (de lege hero en de tekst)
  // hoort de gewone cursor.
  function opAuto(p) {
    if (!kaderNu) return false;
    var m = kwastStraal;
    return (
      p.x > kaderNu.x - m && p.x < kaderNu.x + kaderNu.b + m &&
      p.y > kaderNu.y - m && p.y < kaderNu.y + kaderNu.h + m
    );
  }

  beeld.addEventListener('pointerleave', function () {
    vak.dataset.actief = '0';
    vorige = null;
  });
  beeld.addEventListener('pointermove', function (e) {
    if (klaar || !opgebouwd) return;
    var p = positie(e);
    var binnen = opAuto(p);
    vak.dataset.actief = binnen ? '1' : '0';
    if (!binnen) {
      vorige = null;
      return;
    }
    volgSpons(p);
    // Met de muis veeg je door te bewegen; met een vinger alleen als je
    // ingedrukt houdt, anders zou scrollen de auto poetsen.
    if (e.pointerType === 'mouse' || e.pressure > 0 || e.buttons > 0) veeg(p.x, p.y);
  });
  beeld.addEventListener('pointerdown', function (e) {
    if (klaar || !opgebouwd) return;
    var p = positie(e);
    if (!opAuto(p)) return;
    vak.dataset.actief = '1';
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
    if (klaar || !opgebouwd || !kaderNu) return;
    var k = kaderNu;
    var start = performance.now();
    var duur = 1500;
    demoLoopt = true;
    function stap(nu) {
      var t = Math.min((nu - start) / duur, 1);
      var x = k.x + k.b * (0.18 + t * 0.6);
      var y = k.y + k.h * (0.52 + Math.sin(t * Math.PI * 1.6) * 0.16);
      veeg(x, y);
      if (t < 1) requestAnimationFrame(stap);
      else {
        vorige = null;
        demoLoopt = false;
      }
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

  // De vieze laag wordt apart geladen (staat als data-attribuut op het vak),
  // zodat de HTML alleen de schone auto bevat: zonder JavaScript zie je die.
  var viesPad = beeld.getAttribute('data-vies');
  if (viesPad) {
    viesBeeld = new Image();
    viesBeeld.decoding = 'async';
    viesBeeld.addEventListener('load', function () {
      if (foto.complete && foto.naturalWidth) start();
      else foto.addEventListener('load', start, { once: true });
    }, { once: true });
    viesBeeld.addEventListener('error', function () {
      // Geen vieze laag = gewoon een schone auto in de hero, geen kapot vak.
      vak.removeAttribute('data-laden');
      if (hint) hint.hidden = true;
      var oproep = document.getElementById('wasvakOproep');
      if (oproep) oproep.hidden = true;
    }, { once: true });
    viesBeeld.src = viesPad;
    // Vangnet: wat er ook gebeurt, na 4 seconden staat de auto in beeld.
    window.setTimeout(function () { vak.removeAttribute('data-laden'); }, 4000);
  } else {
    vak.removeAttribute('data-laden');
  }

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
