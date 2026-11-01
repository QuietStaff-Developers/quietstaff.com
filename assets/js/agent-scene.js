// Homepage agent desk: loops an illustrative enquiry → draft → approval scene per module.
(() => {
  // The start track draws its line once, the first time it is seen.
  const track = document.querySelector('.v-track');
  if (track && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    track.classList.add('v-track-pending');
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { track.classList.add('v-track-drawn'); obs.disconnect(); }
    }, {threshold: 0.4}).observe(track);
  }

  const desk = document.getElementById('agent-desk');
  if (!desk) return;
  const scenes = [
    {src: 'New email', input: 'Do you cover Leeds? We need a quote for weekly office cleaning.', label: 'Agent prepares a reply', draft: 'Yes, we cover Leeds. Could you share the floor area and the days that suit you? I’ll send a quote today.', done: 'Reply sent. Enquiry logged.'},
    {src: 'Your brief', input: 'We launch our spring menu on Friday.', label: 'Agent prepares content', draft: 'Three social posts, a newsletter and a 20-second video script, all in your voice.', done: 'Scheduled for Friday, 9am.'},
    {src: 'Your offer', input: 'A free 15-minute consultation for new clients.', label: 'Agent prepares a page', draft: 'A landing page with your offer, an enquiry form and a confirmation email.', done: 'Page live. Form connected.'},
    {src: 'Team question', input: 'What is our refund policy for annual plans?', label: 'Agent finds the answer', draft: 'Pro-rata refund within 30 days of renewal. Source: Refund policy, section 2.', done: 'Answer shared with its source.'},
    {src: 'New booking', input: 'Site visit, Tuesday at 10am, 14 Mill Lane.', label: 'Agent prepares the next steps', draft: 'Add to the calendar, update the customer record and notify the ops channel.', done: 'Calendar and records updated.'}
  ];
  const $ = (s) => desk.querySelector(s);
  const parts = {
    inCard: $('.v-in'), draftCard: $('.v-draft'), approve: $('.v-approve'),
    src: $('.v-src-label'), input: $('.v-in-text'), label: $('.v-draft-label'),
    type: $('.v-type'), done: $('.v-done-text'), pause: $('.v-pause')
  };
  const chips = [...desk.querySelectorAll('.v-chip')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timers = [], paused = false, visible = true, running = false;

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const setChips = () => chips.forEach((c, i) => c.setAttribute('aria-pressed', String(i === index)));
  const fill = (s) => {
    parts.src.textContent = s.src; parts.input.textContent = s.input;
    parts.label.textContent = s.label; parts.done.textContent = s.done;
  };
  const showStatic = () => {
    clear(); running = false; setChips();
    const s = scenes[index]; fill(s); parts.type.textContent = s.draft;
    desk.classList.remove('is-typing', 'is-pressing');
    [parts.inCard, parts.draftCard, parts.approve].forEach((el) => el.classList.add('is-on'));
    desk.classList.add('is-done');
  };
  const play = () => {
    clear(); running = true; setChips();
    const s = scenes[index]; fill(s); parts.type.textContent = '';
    desk.classList.remove('is-done', 'is-pressing', 'is-typing');
    [parts.inCard, parts.draftCard, parts.approve].forEach((el) => el.classList.remove('is-on'));
    later(() => parts.inCard.classList.add('is-on'), 150);
    later(() => { parts.draftCard.classList.add('is-on'); desk.classList.add('is-typing'); }, 1100);
    let t = 1500;
    for (let i = 1; i <= s.draft.length; i++) { later(() => { parts.type.textContent = s.draft.slice(0, i); }, t); t += 24; }
    later(() => { desk.classList.remove('is-typing'); parts.approve.classList.add('is-on'); }, t + 300);
    later(() => desk.classList.add('is-pressing'), t + 1300);
    later(() => { desk.classList.remove('is-pressing'); desk.classList.add('is-done'); }, t + 1650);
    later(() => { index = (index + 1) % scenes.length; tick(); }, t + 4200);
  };
  const tick = () => (reduce.matches || paused || !visible || document.hidden) ? showStatic() : play();
  const setPaused = (value) => {
    paused = value;
    const label = paused ? 'Play the example' : 'Pause the example';
    parts.pause.setAttribute('aria-label', label); parts.pause.title = label;
    parts.pause.innerHTML = `<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">${paused ? '<path d="M3 1.5 10 6l-7 4.5Z"/>' : '<path d="M2 1h3v10H2zM7 1h3v10H7z"/>'}</svg>`;
  };

  chips.forEach((chip, i) => chip.addEventListener('click', () => { index = i; tick(); }));
  parts.pause.addEventListener('click', () => { setPaused(!paused); tick(); });
  parts.pause.hidden = reduce.matches;
  reduce.addEventListener('change', () => { parts.pause.hidden = reduce.matches; tick(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !running) tick(); });
  new IntersectionObserver(([entry]) => {
    const was = visible; visible = entry.isIntersecting;
    if (visible && !was && !running) tick();
    if (!visible && running) showStatic();
  }, {threshold: 0.2}).observe(desk);

  // Reserve the tallest scene's height so the page below never jumps as drafts wrap.
  const body = $('.v-desk-body');
  const reserve = () => {
    const probe = body.cloneNode(true);
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:${body.offsetWidth}px;min-height:0`;
    probe.querySelectorAll('.v-card, .v-approve').forEach((el) => el.classList.add('is-on'));
    desk.appendChild(probe);
    const q = (s) => probe.querySelector(s);
    // Measure every scene in every desk state; nothing paints until this synchronous loop ends.
    const was = desk.className;
    let max = 0;
    scenes.forEach((s) => {
      q('.v-src-label').textContent = s.src; q('.v-in-text').textContent = s.input;
      q('.v-draft-label').textContent = s.label; q('.v-type').textContent = s.draft; q('.v-done-text').textContent = s.done;
      ['is-typing', 'is-pressing', 'is-done'].forEach((state) => {
        desk.classList.remove('is-typing', 'is-pressing', 'is-done'); desk.classList.add(state);
        max = Math.max(max, probe.offsetHeight);
      });
    });
    desk.className = was;
    probe.remove();
    body.style.minHeight = `${max}px`;
  };
  let lastWidth = 0;
  new ResizeObserver(() => { if (body.offsetWidth !== lastWidth) { lastWidth = body.offsetWidth; reserve(); } }).observe(body);
  document.fonts?.ready.then(reserve);

  desk.classList.add('v-live');
  tick();
})();
