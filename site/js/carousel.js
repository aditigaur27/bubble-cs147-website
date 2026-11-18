// Deliverables carousel ("The paper trail").
// Glides to the next card on its own: each card holds in the centre for HOLD ms, then the track slides
// for SLIDE ms (keep SLIDE in step with the transition in css/styles.css). It pauses while the mouse is
// over it, while it has keyboard focus, and while it is off-screen; the arrows, dots, a click on a side
// card, or a swipe move it by hand. The cards are rendered three times over so it can loop seamlessly.
// To update a deliverable, edit its entry in `items`:
//   - links: [label, url]. A link with no url shows as a dashed "coming soon" pill.
//   - put files in deliverables/ or videos/ and use relative paths (the site gets moved at the end of term).
//   - bg: a token from css/tokens.css.
(function () {
  var items = [
    { code: 'A1', short: 'Needfinding', title: 'Needfinding',
      desc: 'Interviews with people who struggle to focus, and what we heard.',
      status: 'Done', bg: 'var(--white)',
      links: [['Slides (PDF)', 'deliverables/A1_Needfinding.pdf']] },
    { code: 'A2', short: 'POVs, HMWs & brainstorming', title: 'Additional needfinding, POVs, HMWs & experience prototypes',
      desc: 'From insights to How Might We questions, then quick experience prototypes to test our riskiest assumptions.',
      status: 'Done', bg: 'var(--butter)',
      links: [['Slides (PDF)', 'deliverables/A2_Ideate_Presentation.pdf']] },
    { code: 'A4', short: 'Concept video', title: 'Concept video',
      desc: 'The Bubble idea, told as a short film.',
      status: 'Done', bg: 'var(--tile-mint)',
      links: [
        ['Slides (PDF)', 'deliverables/A4_Concept_Video_Slides.pdf'],
        ['Watch here', '#videos'],
        ['YouTube', 'https://youtu.be/Z2lwZSsvX3U'],
        ['Download (MP4)', 'videos/A4_Concept_Video.mp4']
      ] },
    { code: 'A5', short: 'Sketching & lo-fi testing', title: 'Sketching, low-fi prototyping & usability testing',
      desc: 'Three sketched directions, a paper prototype of the duck app, and in-person tests with four people at a study desk.',
      status: 'Done', bg: 'var(--duck)',
      stat: '4 of 4 testers preferred a physical duck over a virtual pet.',
      links: [['Slides (PDF)', 'deliverables/A5_Presentation.pdf'], ['Report (PDF)', 'deliverables/A5_Report.pdf']] },
    { code: 'A6', short: 'Medium-fi prototype', title: 'Interactive medium-fi prototype',
      desc: 'The first clickable version of the Bubble app, built in Figma around three tasks: block distractions, choose who can reach you, and check whether your focus is improving.',
      status: 'Done', bg: 'var(--tile-blue)',
      links: [
        ['Slides (PDF)', 'deliverables/A6_Presentation.pdf'],
        ['Figma prototype', 'https://www.figma.com/proto/cRgTpD1Zb3AHV8ClkvMqcw/Medium-Fidelity-Prototype---Bubble?node-id=58-3112&starting-point-node-id=58%3A3112'],
        ['README (PDF)', 'deliverables/A6_README.pdf']
      ] },
    { code: 'A8', short: 'High-fi prototype', title: 'Interactive high-fi prototype',
      desc: 'Bubble, close to the real thing.',
      status: 'Coming soon', bg: 'var(--foam)',
      links: [['Slides'], ['Prototype'], ['README']] },
    { code: 'A9', short: 'Heuristic evaluation', title: 'Heuristic evaluation synthesis',
      desc: 'What other teams found when they stress-tested our prototype.',
      status: 'Coming soon', bg: 'var(--foam)',
      links: [['Synthesis (PDF)'], ['Spreadsheet (XLSX)']] },
    { code: 'A10', short: 'Poster, pitch & demo', title: 'Poster, pitch & demo video',
      desc: 'Our pitch, poster and a demo of Bubble in action.',
      status: 'Coming soon', bg: 'var(--foam)',
      links: [['Pitch slide'], ['Script'], ['Poster (PDF)'], ['Poster source file'], ['Demo video']] },
    { code: 'A11', short: 'Final report', title: 'Final report',
      desc: 'The whole story, written up.',
      status: 'Coming soon', bg: 'var(--foam)',
      links: [['Report (PDF)']] }
  ];

  var HOLD = 3500, SLIDE = 1200;
  var n = items.length;
  var pos = n; // start on A1, in the middle copy
  var carousel = document.getElementById('carousel');
  var track = document.getElementById('car-track');
  var dots = document.getElementById('car-dots');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var arrow = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"></path></svg>';

  function link(l) {
    var label = l[0], href = l[1];
    if (!href) return '<span class="pill pill--lg pill--soon">' + label + ' · coming soon</span>';
    var download = /\.mp4$/i.test(href) ? ' download' : '';
    return '<a class="glass pill pill--lg" href="' + href.replace(/&/g, '&amp;') + '"' + download + '>' + label + ' ' + arrow + '</a>';
  }

  function card(it) {
    return '<article class="card wavy" style="background: ' + it.bg + '" aria-roledescription="slide" aria-label="' + it.code + '">' +
      '<div class="card__meta"><span class="card__code">' + it.code + '</span><span class="card__status">' + it.status + '</span></div>' +
      '<h3 class="card__title">' + it.title + '</h3>' +
      '<p class="card__desc">' + it.desc + '</p>' +
      (it.stat ? '<p class="card__stat">“' + it.stat + '”</p>' : '') +
      '<div class="card__links">' + it.links.map(link).join('') + '</div>' +
      '</article>';
  }

  var set = items.map(card).join('');
  track.innerHTML = set + set + set;
  var slides = track.children;

  // Centre slide `pos`; with animate false it jumps there (used to loop back to the middle copy).
  function place(animate) {
    track.classList.toggle('is-still', !animate);
    var s = slides[pos];
    track.style.transform = 'translateX(' + (carousel.clientWidth / 2 - s.offsetLeft - s.offsetWidth / 2) + 'px)';
    for (var k = 0; k < slides.length; k++) {
      var on = k === pos;
      slides[k].classList.toggle('is-on', on);
      slides[k].setAttribute('aria-hidden', on ? 'false' : 'true');
      var as = slides[k].querySelectorAll('a');
      for (var j = 0; j < as.length; j++) as[j].tabIndex = on ? 0 : -1;
    }
    var i = pos % n;
    dots.innerHTML = items.map(function (d, k) {
      var on = k === i;
      return '<button type="button" class="car-dot ' + (on ? 'glass-ink' : 'glass') + '" data-k="' + k + '" aria-label="' + d.code + '"' +
        (on ? ' aria-current="true"' : '') + '>' + d.code + '</button>';
    }).join('');
    if (!animate) { void track.offsetWidth; track.classList.remove('is-still'); }
  }

  // Once a slide has finished, hop back to the same card in the middle copy if we've drifted out of it.
  function settle() {
    if (pos < n || pos >= 2 * n) { pos = n + ((pos % n) + n) % n; place(false); }
  }
  track.addEventListener('transitionend', function (e) {
    if (e.target === track && e.propertyName === 'transform') settle();
  });

  function go(p) {
    pos = p;
    place(!reduce);
    if (reduce) settle();
  }

  // Autoplay
  var hovered = false, focused = false, visible = true, timer;
  function tick() {
    if (hovered || focused || !visible || document.hidden) return;
    track.setAttribute('aria-live', 'off');
    go(pos + 1);
  }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(tick, HOLD + SLIDE); }
  function byHand(p) { track.setAttribute('aria-live', 'polite'); go(p); restart(); }

  carousel.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovered = true; });
  carousel.addEventListener('pointerleave', function () { hovered = false; });
  carousel.addEventListener('focusin', function (e) { focused = e.target.matches(':focus-visible'); });
  carousel.addEventListener('focusout', function () { focused = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.4 }).observe(carousel);
  }

  document.getElementById('car-prev').onclick = function () { byHand(pos - 1); };
  document.getElementById('car-next').onclick = function () { byHand(pos + 1); };
  // A click on a side card brings it to the centre (rather than following its links).
  track.onclick = function (e) {
    var s = e.target.closest('.card');
    if (!s || s.classList.contains('is-on')) return;
    e.preventDefault();
    byHand(Array.prototype.indexOf.call(slides, s));
  };
  dots.onclick = function (e) {
    var b = e.target.closest('button');
    if (b) byHand(n + +b.dataset.k);
  };
  var x0 = null;
  track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) byHand(pos + (dx < 0 ? 1 : -1));
  });
  window.addEventListener('resize', function () { place(false); });

  place(false);
  restart();
})();
