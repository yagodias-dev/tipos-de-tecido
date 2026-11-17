/* =========================================================
   Histologia aplicada à Enfermagem — script.js
   JavaScript puro, sem dependências.
   Módulos: tema · menu · progresso/navegação ativa · revelação
            · imagens (espaço reservado) · esquemas SVG · hotspots
            · galeria (filtro + alternância) · lightbox · hero
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------------------------------------------------------
     1. Tema claro/escuro
     --------------------------------------------------------- */
  function initTheme() {
    var btn = $('#theme-toggle');
    var meta = $('meta[name="theme-color"]');
    function apply(theme, save) {
      root.setAttribute('data-theme', theme);
      if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d131a' : '#0d6a72');
      if (save) { try { localStorage.setItem('histo-tema', theme); } catch (e) { /* armazenamento indisponível */ } }
    }
    apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
    if (btn) btn.addEventListener('click', function () {
      apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ---------------------------------------------------------
     2. Menu móvel
     --------------------------------------------------------- */
  function initMenu() {
    var toggle = $('#menu-toggle');
    var nav = $('#menu-principal');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      var use = toggle.querySelector('use');
      if (use) use.setAttribute('href', open ? '#i-close' : '#i-menu');
    }
    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && nav.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ---------------------------------------------------------
     3. Barra de progresso, link ativo e botão "voltar ao topo"
     --------------------------------------------------------- */
  function initScrollUI() {
    var bar = $('#progress-bar');
    var toTop = $('#to-top');
    var headerLinks = $all('.main-nav a[href^="#"]');
    var tocLinks = $all('.toc a[href^="#"]');
    var sections = $all('main > section[id]');
    var ticking = false;

    function setActive(links, id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (bar) bar.style.transform = 'scaleX(' + p + ')';
      if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight * 0.9);

      var pos = y + 120;
      var current = sections.length ? sections[0].id : '';
      sections.forEach(function (s) { if (s.offsetTop <= pos) current = s.id; });

      // menu principal: "Início" ou a parte do tecido em que o leitor está
      var headerId = current === 'inicio' ? 'inicio' : (current.indexOf('ep-') === 0 || current === 'epitelial' ? 'epitelial' : current);
      setActive(headerLinks, headerId);
      setActive(tocLinks, current);
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();

    if (toTop) toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var brand = $('.brand');
      if (brand) brand.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------
     4. Animação de entrada (respeita prefers-reduced-motion)
     --------------------------------------------------------- */
  function initReveal() {
    var items = $all('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     5. Imagens reais x espaço reservado
     Se o arquivo existir em assets/img/, a foto aparece;
     se não existir, a caixa cinza "Imagem: ..." continua visível.
     --------------------------------------------------------- */
  function initImages() {
    $all('.photo img').forEach(function (img) {
      var box = img.closest('.photo');
      function ok() { img.classList.add('is-loaded'); box.classList.add('has-image'); }
      function fail() { img.classList.remove('is-loaded'); box.classList.remove('has-image'); img.setAttribute('aria-hidden', 'true'); }
      if (img.complete) {
        if (img.naturalWidth > 0) ok(); else if (img.currentSrc || img.src) fail();
      }
      img.addEventListener('load', ok);
      img.addEventListener('error', fail);
    });
  }

  /* ---------------------------------------------------------
     6. Esquemas SVG gerados por código (galeria)
     viewBox 300 × 170 · membrana basal em y = 128
     --------------------------------------------------------- */
  var W = 300, BM = 128;

  function r1(n) { return Math.round(n * 10) / 10; }
  function rect(x, y, w, h, cls, rx) {
    return '<rect class="' + cls + '" x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="' + (rx == null ? 3 : rx) + '"/>';
  }
  function ell(cx, cy, rx, ry, cls) {
    return '<ellipse class="' + cls + '" cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="' + r1(rx) + '" ry="' + r1(ry) + '"/>';
  }
  function circ(cx, cy, r, cls) {
    return '<circle class="' + cls + '" cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r) + '"/>';
  }
  function line(x1, y1, x2, y2, cls) {
    return '<line class="' + cls + '" x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '"/>';
  }
  /* fileira de células com deslocamento horizontal opcional */
  function row(y, h, w, offset, cls, nucleus) {
    var out = '';
    for (var x = offset - w; x < W; x += w) {
      out += rect(x + 0.6, y + 0.6, w - 1.2, h - 1.2, cls, 3);
      if (nucleus) out += nucleus(x + w / 2, y + h / 2);
    }
    return out;
  }
  function goblet(x, w, top) {
    var p = 'M' + r1(x + 2) + ' ' + top +
      ' H' + r1(x + w - 2) +
      ' C' + r1(x + w + 3) + ' ' + (top + 30) + ', ' + r1(x + w - 5) + ' ' + (top + 58) + ', ' + r1(x + w - 7) + ' ' + BM +
      ' H' + r1(x + 7) +
      ' C' + r1(x + 5) + ' ' + (top + 58) + ', ' + r1(x - 3) + ' ' + (top + 30) + ', ' + r1(x + 2) + ' ' + top + 'Z';
    return '<path class="sv-goblet" d="' + p + '"/>' + ell(x + w / 2, BM - 9, 5, 3.5, 'sv-nuc-dark');
  }
  function base() {
    return '<rect class="sv-bm" x="0" y="' + BM + '" width="300" height="3"/>' +
      '<rect class="sv-ct" x="0" y="' + (BM + 3) + '" width="300" height="' + (170 - BM - 3) + '"/>' +
      '<path class="sv-fiber" d="M0 148 C 50 140, 90 158, 150 147 S 240 140, 300 152"/>' +
      '<ellipse class="sv-fibroblast" cx="80" cy="161" rx="13" ry="2.6"/>' +
      circ(240, 154, 9, 'sv-vessel') + ell(240, 154, 4, 2.4, 'sv-rbc');
  }

  var SCHEMATICS = {
    'simples-pavimentoso': function () {
      var s = '', w = 60;
      for (var i = 0; i < 5; i++) {
        var x = i * w;
        s += '<path class="sv-cell" d="M' + (x + 0.6) + ' ' + BM + 'V114H' + (x + 17) + 'Q' + (x + 30) + ' 103 ' + (x + 43) + ' 114H' + (x + w - 0.6) + 'V' + BM + 'Z"/>';
        s += ell(x + 30, 115, 11, 4, 'sv-nuc');
      }
      return s;
    },
    'simples-cubico': function () {
      var s = '', n = 7, w = W / n;
      for (var i = 0; i < n; i++) { var x = i * w; s += rect(x + 0.6, 86, w - 1.2, 42, 'sv-cell') + circ(x + w / 2, 107, 8, 'sv-nuc'); }
      return s;
    },
    'simples-colunar': function () {
      var s = '', n = 11, w = W / n, gob = 5;
      for (var i = 0; i < n; i++) {
        if (i === gob) continue;
        var x = i * w;
        s += rect(x + 0.6, 40, w - 1.2, 88, 'sv-cell') + ell(x + w / 2, 106, 6, 11, 'sv-nuc');
        for (var k = 1; k < 6; k++) s += line(x + (w * k) / 6, 40, x + (w * k) / 6, 34, 'sv-mv');
      }
      s += goblet(gob * w, w, 40);
      return s;
    },
    'pseudoestratificado': function () {
      var s = '', n = 9, w = W / n, gob = 4;
      var ny = [72, 92, 64, 96, 0, 78, 94, 68, 86];
      for (var i = 0; i < n; i++) {
        if (i === gob) continue;
        var x = i * w;
        s += rect(x + 0.6, 44, w - 1.2, 84, 'sv-cell') + ell(x + w / 2, ny[i], 6, 10, 'sv-nuc');
        for (var c = x + 3; c < x + w - 2; c += 3.6) s += line(c, 44, c - 1, 33, 'sv-cilia');
      }
      s += goblet(gob * w, w, 44);
      [1, 3, 6, 8].forEach(function (b) {
        var bx = b * w;
        s += rect(bx - 9, 108, 18, 20, 'sv-cell-alt', 4) + circ(bx, 118, 4.5, 'sv-nuc-dark');
      });
      return s;
    },
    'estratificado-queratinizado': function () {
      var s = '';
      s += row(112, 16, 20, 0, 'sv-cell-alt', function (cx, cy) { return ell(cx, cy, 3.5, 5.5, 'sv-nuc-dark'); });
      s += row(96, 16, 26, 0, 'sv-cell', function (cx, cy) { return circ(cx, cy, 4, 'sv-nuc'); });
      s += row(80, 16, 26, 13, 'sv-cell', function (cx, cy) { return circ(cx, cy, 4, 'sv-nuc'); });
      s += row(64, 16, 26, 0, 'sv-cell', function (cx, cy) { return circ(cx, cy, 4, 'sv-nuc'); });
      s += row(52, 12, 36, 18, 'sv-cell-alt', function (cx, cy) {
        return ell(cx, cy, 7, 2.5, 'sv-nuc') + circ(cx - 11, cy - 2, 1.5, 'sv-gran') + circ(cx + 11, cy + 1, 1.5, 'sv-gran') + circ(cx - 6, cy + 3, 1.3, 'sv-gran');
      });
      for (var y = 22; y < 52; y += 6) s += rect(-2, y, 304, 5, 'sv-ker', 2);
      return s;
    },
    'estratificado-nao-queratinizado': function () {
      var s = '';
      s += row(112, 16, 20, 0, 'sv-cell-alt', function (cx, cy) { return ell(cx, cy, 3.5, 5.5, 'sv-nuc-dark'); });
      s += row(96, 16, 26, 0, 'sv-cell', function (cx, cy) { return circ(cx, cy, 4, 'sv-nuc'); });
      s += row(80, 16, 26, 13, 'sv-cell', function (cx, cy) { return circ(cx, cy, 4, 'sv-nuc'); });
      s += row(64, 16, 26, 0, 'sv-cell', function (cx, cy) { return circ(cx, cy, 4, 'sv-nuc'); });
      s += row(53, 11, 40, 20, 'sv-cell', function (cx, cy) { return ell(cx, cy, 8, 2.5, 'sv-nuc'); });
      s += row(43, 10, 48, 0, 'sv-cell', function (cx, cy) { return ell(cx, cy, 9, 2.2, 'sv-nuc'); });
      s += row(34, 9, 56, 28, 'sv-cell', function (cx, cy) { return ell(cx, cy, 10, 2, 'sv-nuc'); });
      return s;
    },
    'estratificado-cubico': function () {
      var s = '';
      s += row(100, 28, 30, 0, 'sv-cell-alt', function (cx, cy) { return circ(cx, cy, 6, 'sv-nuc'); });
      s += row(72, 28, 30, 15, 'sv-cell', function (cx, cy) { return circ(cx, cy, 6, 'sv-nuc'); });
      return s;
    },
    'transicao': function () {
      var s = '';
      s += row(110, 18, 20, 0, 'sv-cell-alt', function (cx, cy) { return ell(cx, cy, 3.5, 5, 'sv-nuc-dark'); });
      s += row(90, 20, 28, 14, 'sv-cell', function (cx, cy) { return circ(cx, cy, 4.5, 'sv-nuc'); });
      s += row(70, 20, 32, 0, 'sv-cell', function (cx, cy) { return circ(cx, cy, 4.5, 'sv-nuc'); });
      var w = 60;
      for (var i = 0, x = -10; x < W; i++, x += w) {
        s += '<path class="sv-cell" d="M' + (x + 1) + ' 70V48Q' + (x + 30) + ' 18 ' + (x + w - 1) + ' 48V70Z"/>';
        if (i === 2) s += circ(x + 21, 52, 5.5, 'sv-nuc') + circ(x + 39, 52, 5.5, 'sv-nuc');
        else s += circ(x + 30, 52, 6.5, 'sv-nuc');
      }
      return s;
    }
  };

  function initSchematics() {
    $all('[data-schematic]').forEach(function (el) {
      var fn = SCHEMATICS[el.getAttribute('data-schematic')];
      if (!fn) return;
      el.innerHTML = '<svg viewBox="0 0 300 170" aria-hidden="true" focusable="false">' +
        '<rect class="sv-lumen" width="300" height="170"/>' + fn() + base() + '</svg>';
    });
  }

  /* ---------------------------------------------------------
     7. Hotspots — dados (x/y em % da figura)
     Cada item: o que é · na lâmina · na prática
     --------------------------------------------------------- */
  var HOTSPOTS = {
    anatomia: [
      { x: 25, y: 15.6, t: 'Polo apical e microvilos',
        o: 'O <strong>polo apical</strong> é a face voltada para a luz. Pode ter especializações: <strong>microvilos</strong> (projeções curtas que aumentam a área de absorção), <strong>cílios</strong> (mais longos, se movem e empurram o muco) ou estereocílios (microvilos longos e imóveis).',
        l: 'Microvilos aparecem como uma faixa rosada, fina e uniforme no topo das células: a <strong>borda em escova</strong> (ou estriada). Cílios formam uma franja mais alta, com fios individuais visíveis em bom aumento.',
        p: 'No cuidado de enfermagem, isso significa que a enorme área de absorção do intestino depende dessas estruturas; quando a mucosa é lesada, a absorção de nutrientes e de medicamentos orais pode cair.' },
      { x: 50, y: 22.2, t: 'Faces laterais e junções',
        o: 'Nas faces laterais, <strong>junções celulares</strong> unem as células vizinhas, vedam o espaço entre elas e permitem comunicação. É por causa delas que o epitélio funciona como uma barreira contínua.',
        l: 'As junções não aparecem individualmente ao microscópio óptico. Às vezes se vê um ponto escuro no topo, entre duas células colunares: a <strong>barra terminal</strong>. Os tipos estão na seção Junções celulares.',
        p: 'No cuidado de enfermagem, isso significa que, enquanto as junções estão íntegras, a mucosa impede a passagem livre de micro-organismos e toxinas; a inflamação pode afrouxá-las e aumentar a permeabilidade.' },
      { x: 75, y: 52.8, t: 'Núcleo',
        o: 'Contém o DNA da célula. A <strong>forma e a posição do núcleo acompanham a forma da célula</strong>: achatado nas pavimentosas, redondo e central nas cúbicas, ovalado e perto da base nas colunares.',
        l: 'Cora em roxo-azulado pela hematoxilina (é <strong>basófilo</strong>). Observar os núcleos é o jeito mais rápido de contar camadas e reconhecer a forma das células.',
        p: 'No cuidado de enfermagem, isso significa entender laudos de citologia (como o Papanicolau), que descrevem justamente alterações de tamanho e forma dos núcleos das células epiteliais.' },
      { x: 88.3, y: 64.7, t: 'Membrana basal',
        o: 'Camada fina de matriz extracelular entre o epitélio e o conjuntivo, formada pela <strong>lâmina basal</strong> (produzida pelo epitélio) e pela <strong>lâmina reticular</strong> (produzida pelo conjuntivo). Dá apoio, filtra moléculas e serve de "trilho" para a regeneração.',
        l: 'Linha fina logo abaixo da última camada de células. No H&amp;E nem sempre é visível; fica evidente com <strong>PAS</strong> (cor magenta) ou com impregnação pela prata.',
        p: 'No cuidado de enfermagem, isso significa compreender laudos oncológicos: um carcinoma <strong>in situ</strong> ainda não ultrapassou a membrana basal; um carcinoma <strong>invasivo</strong> já a atravessou e alcançou o conjuntivo, onde há vasos.' },
      { x: 18.3, y: 86.1, t: 'Lâmina própria (conjuntivo)',
        o: '<strong>Lâmina própria</strong> é a camada de tecido conjuntivo frouxo logo abaixo do epitélio de uma mucosa. Tem fibras, <strong>fibroblastos</strong> (células que produzem as fibras), células de defesa e vasos.',
        l: 'Região mais frouxa, com fibras rosadas finas e núcleos espalhados — bem diferente do epitélio, em que as células ficam coladas umas às outras.',
        p: 'No cuidado de enfermagem, isso significa que epitélio e conjuntivo trabalham juntos: o epitélio protege; o conjuntivo nutre e defende. O edema e a reação inflamatória acontecem no conjuntivo.' },
      { x: 50, y: 82.8, t: 'Capilar sanguíneo',
        o: 'Os vasos ficam no conjuntivo. O epitélio é <strong>avascular</strong>: recebe oxigênio e nutrientes por difusão, através da membrana basal.',
        l: 'Círculo delimitado por células achatadas (endotélio), muitas vezes com hemácias rosa-alaranjadas dentro. Nunca aparece no meio das células epiteliais.',
        p: 'No cuidado de enfermagem, isso significa que uma escoriação restrita à epiderme não costuma sangrar; sangramento indica que a lesão chegou à derme (conjuntivo), onde estão os vasos.' }
    ],

    pele: [
      { x: 50, y: 6.5, t: 'Estrato córneo',
        o: 'Camada mais superficial: células mortas, achatadas, sem núcleo e cheias de <strong>queratina</strong> (proteína resistente). Descamam continuamente e são repostas pelas camadas de baixo.',
        l: 'Faixa rosa (eosinofílica) sem núcleos no topo da epiderme, muitas vezes "desfiada" em aspecto de cesta trançada por artefato de preparo. É muito espessa na pele de palmas e plantas.',
        p: 'No cuidado de enfermagem, isso significa que a umidade prolongada (suor, urina, fezes) amolece essa camada — a <strong>maceração</strong> — e deixa a pele mais vulnerável à fricção e a lesões. Manter a pele limpa e seca protege essa barreira.' },
      { x: 15, y: 11.3, t: 'Estrato granuloso',
        o: 'Células achatadas com <strong>grânulos de querato-hialina</strong>. Nessa altura as células liberam lipídios que vedam os espaços entre elas, formando a principal barreira contra a perda de água.',
        l: 'Poucas fileiras de células achatadas com grânulos roxo-escuros (basófilos) bem visíveis — o marco que separa o córneo das camadas vivas.',
        p: 'No cuidado de enfermagem, isso significa que banhos muito quentes e sabonetes agressivos removem essa proteção lipídica, favorecendo ressecamento e fissuras, sobretudo em idosos.' },
      { x: 35, y: 20.4, t: 'Estrato espinhoso',
        o: 'Várias camadas de células poligonais unidas por muitos <strong>desmossomos</strong>. É a camada que dá resistência mecânica à epiderme.',
        l: 'Células poligonais de núcleo redondo. No preparo, elas se retraem e os desmossomos aparecem como pequenas "pontes" ou "espinhos" entre as células — daí o nome.',
        p: 'No cuidado de enfermagem, isso significa entender o <strong>pênfigo</strong>: anticorpos contra componentes dos desmossomos separam essas células e formam bolhas frágeis dentro da epiderme.' },
      { x: 55, y: 29.8, t: 'Estrato basal',
        o: 'Uma única fileira de células cúbicas a colunares apoiadas na membrana basal. Contém as <strong>células-tronco</strong> que se dividem e renovam toda a epiderme, além dos <strong>melanócitos</strong> (células produtoras de melanina).',
        l: 'Fileira de núcleos escuros e alongados, bem alinhados logo acima da membrana basal; pode conter pigmento acastanhado.',
        p: 'No cuidado de enfermagem, isso significa que lesões que preservam a camada basal (como abrasões superficiais) tendem a reepitelizar mais rápido e sem cicatriz; perder a camada basal em área extensa torna a cicatrização mais lenta.' },
      { x: 91.7, y: 32.2, t: 'Membrana basal (junção dermoepidérmica)',
        o: 'Une epiderme e derme. Na pele real ela é ondulada: as <strong>cristas epidérmicas</strong> se encaixam nas <strong>papilas dérmicas</strong>, aumentando a adesão (no esquema, aparece reta para simplificar). As células basais se prendem a ela por hemidesmossomos.',
        l: 'Limite ondulado entre o epitélio (células coladas) e a derme (fibras rosadas). Bem visível com PAS.',
        p: 'No cuidado de enfermagem, isso significa que <strong>fricção e cisalhamento</strong> podem separar as camadas e formar bolhas. No idoso essa junção é mais achatada e a pele se descola com mais facilidade — por isso o cuidado ao reposicionar o paciente e ao remover adesivos.' },
      { x: 16.7, y: 38, t: 'Derme papilar',
        o: 'Parte superficial da derme, de <strong>tecido conjuntivo frouxo</strong>, com alças de capilares que nutrem a epiderme por difusão e terminações nervosas.',
        l: 'Faixa logo abaixo da epiderme, com fibras finas, mais células e muitos capilares pequenos.',
        p: 'No cuidado de enfermagem, isso significa que é na derme que a <strong>via intradérmica</strong> deposita a substância, formando uma pequena elevação (pápula) na pele.' },
      { x: 35.8, y: 55.6, t: 'Derme reticular',
        o: 'Parte profunda e mais espessa da derme, de <strong>tecido conjuntivo denso não modelado</strong>: feixes grossos de colágeno em várias direções, que dão resistência à tração. Abriga os anexos (folículos e glândulas).',
        l: 'Feixes rosa grossos e entrelaçados, com poucos núcleos entre eles.',
        p: 'No cuidado de enfermagem, isso significa que feridas que atingem a derme profunda cicatrizam com formação de tecido cicatricial (colágeno novo), e não com a regeneração completa da pele original.' },
      { x: 48.3, y: 61.1, t: 'Vaso sanguíneo',
        o: 'Os vasos ficam na derme e na hipoderme — nunca na epiderme. São revestidos internamente pelo <strong>endotélio</strong>, um epitélio simples pavimentoso.',
        l: 'Espaço redondo ou oval delimitado por células achatadas, com hemácias no interior.',
        p: 'No cuidado de enfermagem, isso significa que o sangramento de uma lesão indica que ela alcançou a derme. Na punção venosa, a agulha atravessa a pele e o tecido subcutâneo até a parede da veia.' },
      { x: 25, y: 68.2, t: 'Glândula sudorípara',
        o: 'Glândula exócrina tubular enovelada (écrina). A porção secretora fica na derme profunda ou na hipoderme; o ducto, revestido por <strong>epitélio estratificado cúbico</strong>, sobe em espiral até a superfície.',
        l: 'Grupos de pequenos túbulos cortados em vários ângulos: a porção secretora mais clara e o ducto mais corado, com duas camadas de células.',
        p: 'No cuidado de enfermagem, isso significa que a sudorese participa da <strong>termorregulação</strong>; pele quente e sudoreica, ou seca, são achados que se relacionam à temperatura e à hidratação do paciente.' },
      { x: 72, y: 70, t: 'Folículo piloso',
        o: 'Invaginação da epiderme que mergulha na derme (às vezes até a hipoderme) e produz o pelo. Sua bainha epitelial guarda células capazes de repovoar a superfície.',
        l: 'Estrutura epitelial em forma de tubo, com o pelo no centro e, na base, o bulbo envolvendo uma papila de conjuntivo.',
        p: 'No cuidado de enfermagem, isso significa que, em feridas e queimaduras de espessura parcial, os folículos remanescentes funcionam como "ilhas" de onde o epitélio volta a crescer. Também são porta de entrada para infecções (foliculite).' },
      { x: 81.3, y: 44.4, t: 'Glândula sebácea',
        o: 'Glândula exócrina <strong>holócrina</strong>: a célula inteira se desfaz para formar o sebo, que lubrifica o pelo e a pele. Abre-se no folículo piloso.',
        l: 'Grupos de células grandes, de citoplasma claro e "espumoso", ao lado do folículo.',
        p: 'No cuidado de enfermagem, isso significa que o sebo contribui para a proteção da superfície da pele; a limpeza excessiva o remove e favorece o ressecamento.' },
      { x: 55, y: 81.5, t: 'Hipoderme (tecido subcutâneo)',
        o: 'Não faz parte da pele propriamente dita. É formada por tecido adiposo e conjuntivo frouxo: reserva de energia, isolamento térmico e amortecimento. (Detalhes na Parte 2 — tecido conjuntivo.)',
        l: 'Grandes células "vazias" (a gordura se dissolve no preparo), separadas por finos septos de conjuntivo, com o núcleo empurrado para a borda.',
        p: 'No cuidado de enfermagem, isso significa que é o alvo da <strong>via subcutânea</strong>. Por ser menos vascularizada que o músculo, a absorção por essa via tende a ser mais lenta que a intramuscular. É também o tecido exposto na lesão por pressão de estágio 3.' },
      { x: 86.7, y: 94.8, t: 'Fáscia e músculo esquelético',
        o: 'Abaixo da hipoderme fica a <strong>fáscia</strong> (lâmina de conjuntivo denso) e, depois, o músculo esquelético — que não é epitélio nem conjuntivo, mas é o destino de uma via de administração.',
        l: 'Fibras longas e rosadas, com estriações transversais e núcleos na periferia.',
        p: 'No cuidado de enfermagem, isso significa que a <strong>via intramuscular</strong> atravessa pele e subcutâneo até o músculo, que é bem vascularizado e absorve mais rápido. A exposição de músculo numa lesão por pressão caracteriza o estágio 4.' }
    ],

    juncoes: [
      { x: 88.3, y: 16.4, t: 'Zônula de oclusão (junção oclusiva)',
        o: 'A junção mais apical. Proteínas como <strong>claudinas</strong> e <strong>ocludina</strong> "costuram" as membranas vizinhas como um cinto contínuo, vedando o espaço entre as células.',
        l: 'Não é visível ao microscópio óptico. Ao microscópio eletrônico, aparecem os pontos de fusão entre as membranas.',
        p: 'No cuidado de enfermagem, isso significa entender barreiras como a intestinal e a <strong>barreira hematoencefálica</strong> (junções oclusivas do endotélio dos capilares cerebrais), que impede muitos fármacos de chegar ao sistema nervoso central.' },
      { x: 11.7, y: 27.3, t: 'Zônula de adesão',
        o: 'Cinturão logo abaixo da oclusiva. Proteínas de adesão chamadas <strong>caderinas</strong> ligam as células vizinhas e se prendem, por dentro, aos <strong>filamentos de actina</strong> do citoesqueleto (o "esqueleto" interno da célula).',
        l: 'Junto com a oclusiva e o desmossomo forma o complexo juncional, que ao óptico pode aparecer como a barra terminal.',
        p: 'No cuidado de enfermagem, isso significa compreender que a perda da adesão entre células epiteliais é uma das alterações associadas à capacidade de células tumorais se desprenderem e invadirem outros tecidos.' },
      { x: 88.3, y: 44.3, t: 'Desmossomo (mácula de adesão)',
        o: 'Um "botão de pressão" entre células. Caderinas especiais (<strong>desmogleínas</strong> e desmocolinas) unem duas placas densas, ligadas a <strong>filamentos intermediários</strong> (no epitélio, de queratina). Abundante em tecidos sob tensão, como a epiderme e o miocárdio.',
        l: 'As "pontes" entre as células do estrato espinhoso da pele correspondem a desmossomos.',
        p: 'No cuidado de enfermagem, isso significa que, no <strong>pênfigo</strong>, autoanticorpos contra desmogleínas desfazem essas ligações: surgem bolhas flácidas dentro da epiderme, que se rompem facilmente e deixam áreas erosadas — uma pele que exige manipulação muito delicada.' },
      { x: 11.7, y: 62, t: 'Junção comunicante (gap)',
        o: 'Canais formados por proteínas chamadas <strong>conexinas</strong> (cada meio-canal é um conéxon) ligam o citoplasma de duas células e deixam passar íons e pequenas moléculas.',
        l: 'Não é visível ao microscópio óptico.',
        p: 'No cuidado de enfermagem, isso significa entender por que o coração se contrai de forma coordenada: no músculo cardíaco, essas junções deixam o estímulo elétrico passar rapidamente de uma célula para outra.' },
      { x: 11.7, y: 82.3, t: 'Hemidesmossomo',
        o: '"Metade" de um desmossomo: prende a célula basal à <strong>membrana basal</strong> por meio de proteínas chamadas <strong>integrinas</strong>, ligadas a filamentos intermediários.',
        l: 'Não é visível ao microscópio óptico; é responsável pela firme adesão da epiderme à derme.',
        p: 'No cuidado de enfermagem, isso significa que, no <strong>penfigoide bolhoso</strong> (mais comum em idosos), anticorpos atingem componentes dos hemidesmossomos: a epiderme inteira se descola e formam-se bolhas tensas abaixo dela.' },
      { x: 88.3, y: 84.5, t: 'Membrana basal',
        o: 'Lâmina de matriz extracelular sobre a qual o epitélio se apoia. É por ela que passam, por difusão, os nutrientes vindos dos capilares do conjuntivo.',
        l: 'Linha fina sob o epitélio, destacada pelo PAS.',
        p: 'No cuidado de enfermagem, isso significa que ela é o "chão" da regeneração: quando preservada, orienta as células epiteliais que recobrem uma ferida.' }
    ]
  };

  function initHotspots() {
    $all('[data-hotspots]').forEach(function (wrap, wIndex) {
      var data = HOTSPOTS[wrap.getAttribute('data-hotspots')];
      var stage = $('.hs-stage', wrap);
      var list = $('.hs-list', wrap);
      var panel = $('.hs-panel', wrap);
      if (!data || !stage || !panel) return;

      var panelId = 'hs-panel-' + wIndex;
      panel.id = panelId;
      var pins = [], chips = [];

      data.forEach(function (h, i) {
        var n = i + 1;
        var pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'hotspot';
        pin.style.left = h.x + '%';
        pin.style.top = h.y + '%';
        pin.textContent = n;
        pin.setAttribute('aria-label', n + '. ' + h.t);
        pin.setAttribute('aria-pressed', 'false');
        pin.setAttribute('aria-controls', panelId);
        pin.addEventListener('click', function () { select(i, pin); });
        stage.appendChild(pin);
        pins.push(pin);

        if (list) {
          var li = document.createElement('li');
          var chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'chip';
          chip.setAttribute('aria-pressed', 'false');
          chip.setAttribute('aria-controls', panelId);
          chip.innerHTML = '<span class="n" aria-hidden="true">' + n + '</span>' + h.t;
          chip.addEventListener('click', function () { select(i, chip); });
          li.appendChild(chip);
          list.appendChild(li);
          chips.push(chip);
        }
      });

      function select(i, trigger) {
        var h = data[i];
        pins.concat(chips).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        pins[i].setAttribute('aria-pressed', 'true');
        if (chips[i]) chips[i].setAttribute('aria-pressed', 'true');

        panel.innerHTML =
          '<h3><span class="hs-num" aria-hidden="true">' + (i + 1) + '</span>' + h.t + '</h3>' +
          '<div class="hs-part hs-part--oque"><span class="lbl">O que é</span><p>' + h.o + '</p></div>' +
          '<div class="hs-part hs-part--lamina"><span class="lbl">Como reconhecer na lâmina</span><p>' + h.l + '</p></div>' +
          '<div class="hs-part hs-part--pratica"><span class="lbl">NA PRÁTICA</span><p>' + h.p + '</p></div>';

        if (!reduceMotion) {
          panel.classList.remove('is-updated');
          void panel.offsetWidth; // reinicia a animação
          panel.classList.add('is-updated');
        }

        // Em telas estreitas o painel fica abaixo da figura: traz para a vista
        if (window.innerWidth <= 900 && trigger) {
          var r = panel.getBoundingClientRect();
          if (r.top > window.innerHeight - 80 || r.bottom < 0) {
            panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
          }
        }
      }

      // Setas do teclado navegam entre os marcadores da mesma figura
      stage.addEventListener('keydown', function (e) {
        var idx = pins.indexOf(document.activeElement);
        if (idx < 0) return;
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % pins.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + pins.length) % pins.length;
        if (next !== null) { e.preventDefault(); pins[next].focus(); }
      });
    });
  }

  /* ---------------------------------------------------------
     8. Galeria: filtro e alternância lâmina/esquema
     --------------------------------------------------------- */
  function initGallery() {
    var gallery = $('#galeria-epitelial');
    var status = $('#gallery-status');
    var filters = $all('[data-filter]');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var shown = 0;
        $all('.tissue-card', gallery).forEach(function (card) {
          var show = f === 'todos' || card.getAttribute('data-group') === f;
          card.hidden = !show;
          if (show) { shown++; card.classList.add('is-visible'); }
        });
        if (status) status.textContent = 'Mostrando ' + shown + (shown === 1 ? ' tipo de epitélio.' : ' tipos de epitélio.');
      });
    });

    $all('.view-switch').forEach(function (group) {
      var card = group.closest('.tissue-card');
      var buttons = $all('button[data-show]', group);
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var view = btn.getAttribute('data-show');
          buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
          $all('[data-view]', card).forEach(function (v) { v.hidden = v.getAttribute('data-view') !== view; });
        });
      });
    });
  }

  /* ---------------------------------------------------------
     9. Lightbox (ampliar lâmina)
     --------------------------------------------------------- */
  function initLightbox() {
    var dlg = $('#lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var title = $('#lightbox-title', dlg);
    var body = $('#lightbox-body', dlg);
    var closeBtn = $('[data-close]', dlg);
    var lastTrigger = null;

    $all('[data-lightbox]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.tissue-card');
        var img = $('img', btn);
        var cap = btn.closest('figure') ? $('figcaption', btn.closest('figure')) : null;
        var h = card ? $('h3', card) : null;
        title.textContent = h ? h.textContent : 'Imagem';
        body.innerHTML = '';

        if (btn.classList.contains('has-image') && img) {
          var big = document.createElement('img');
          big.src = img.currentSrc || img.src;
          big.alt = img.alt;
          body.appendChild(big);
          if (cap) { var p = document.createElement('p'); p.textContent = cap.textContent.trim(); body.appendChild(p); }
        } else {
          var code = $('code', btn);
          var msg = document.createElement('p');
          msg.innerHTML = '<strong>Esta lâmina ainda não foi adicionada.</strong> Baixe a imagem indicada em <code>IMAGENS.md</code> e salve como <code>' +
            (code ? code.textContent : 'assets/img/…') + '</code>. Enquanto isso, veja o esquema:';
          body.appendChild(msg);
          var sch = card ? $('.schematic', card) : null;
          if (sch) {
            var clone = sch.cloneNode(true);
            clone.style.marginTop = '0.75rem';
            body.appendChild(clone);
          }
        }
        lastTrigger = btn;
        dlg.showModal();
        closeBtn.focus();
      });
    });

    closeBtn.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (lastTrigger) lastTrigger.focus(); });
  }

  /* ---------------------------------------------------------
     10. Hero: campo de células (decorativo)
     --------------------------------------------------------- */
  function initHero() {
    var g = $('#hero-field');
    if (!g) return;
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var r = 26, hw = Math.sqrt(3) * r, out = '', count = 0;
    for (var j = -1; j < 12; j++) {
      var cy = j * r * 1.5;
      var off = (j % 2 === 0) ? 0 : hw / 2;
      for (var i = -1; i < 11; i++) {
        var cx = i * hw + off;
        var pts = [];
        for (var k = 0; k < 6; k++) {
          var a = (Math.PI / 180) * (60 * k - 90);
          var rr = r - 1.5 + rnd() * 1.2;
          pts.push(r1(cx + rr * Math.cos(a)) + ',' + r1(cy + rr * Math.sin(a)));
        }
        out += '<polygon class="sv-hex" points="' + pts.join(' ') + '"/>';
        var cls = (count++ % 3 === 0) ? 'sv-nuc pulse' : 'sv-nuc';
        out += '<ellipse class="' + cls + '" cx="' + r1(cx + (rnd() - 0.5) * 6) + '" cy="' + r1(cy + (rnd() - 0.5) * 6) +
          '" rx="' + r1(7 + rnd() * 2.5) + '" ry="' + r1(6 + rnd() * 2) + '"/>';
      }
    }
    g.innerHTML = out;
  }

  /* ---------------------------------------------------------
     Inicialização
     --------------------------------------------------------- */
  function init() {
    initTheme();
    initMenu();
    initHero();
    initSchematics();
    initHotspots();
    initGallery();
    initImages();
    initLightbox();
    initReveal();
    initScrollUI();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
