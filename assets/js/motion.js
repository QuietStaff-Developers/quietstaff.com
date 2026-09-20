// One controller per explanatory diagram. The hero's existing controller is separate.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const diagrams = [];
  const addTrack = (element, delay) => {
    element.style.setProperty('--diagram-delay', `${delay}s`);
    const track = document.createElement('span');
    track.className = 'diagram-track';
    track.setAttribute('aria-hidden', 'true');
    element.append(track);
  };
  const isExposed = (element) => !element.closest('[hidden], [aria-hidden="true"]') && element.getClientRects().length > 0;
  const update = (state) => {
    const allowed = !preference.matches;
    state.element.classList.toggle('diagram-motion-enabled', allowed);
    state.element.classList.toggle('diagram-is-running', allowed && !state.paused && state.visible && !document.hidden && isExposed(state.element));
    if (state.controls.hidden !== !allowed) state.controls.hidden = !allowed;
    state.button.setAttribute('aria-pressed', String(state.paused));
    state.button.setAttribute('aria-label', `${state.paused ? 'Resume' : 'Pause'} ${state.label} motion`);
    state.button.title = state.button.getAttribute('aria-label');
    state.button.innerHTML = `<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">${state.paused ? '<path d="M3 1.5 10 6l-7 4.5Z"/>' : '<path d="M2 1h3v10H2zM7 1h3v10H7z"/>'}</svg>`;
  };
  document.querySelectorAll('.module-flow, .workflow, .research-illustration').forEach((element, index) => {
    const research = element.classList.contains('research-illustration');
    const moduleName = element.closest('.module-visual')?.querySelector('.module-visual-heading > span:last-child')?.firstChild?.textContent?.replace(' in motion', '').trim();
    const label = research ? 'Quiet Staff Core diagram' : moduleName ? `${moduleName} workflow` : 'approach workflow';
    if (!element.id) element.id = `explanatory-motion-${index + 1}`;
    element.classList.add('diagram-motion');
    if (research) {
      element.querySelectorAll('.research-bridge').forEach((bridge, i) => bridge.style.setProperty('--diagram-delay', `${i ? 2.8 : .3}s`));
      element.querySelectorAll('.evaluation-row > span').forEach((item, i) => addTrack(item, 3.8 + i * .3));
    } else {
      [...element.children].forEach((item, i, items) => {
        addTrack(item, i * 1.25);
        if (element.classList.contains('module-flow') && i < items.length - 1) {
          const connector = document.createElement('span');
          connector.className = 'diagram-connector';
          connector.setAttribute('aria-hidden', 'true');
          connector.style.setProperty('--diagram-delay', `${i * 1.25 + .85}s`);
          item.append(connector);
        }
      });
    }
    const controls = document.createElement('div');
    controls.className = 'diagram-motion-controls';
    const button = document.createElement('button');
    button.className = 'diagram-motion-toggle';
    button.type = 'button';
    button.setAttribute('aria-controls', element.id);
    controls.append(button);
    if (research) element.querySelector('.research-art-note').before(controls);
    else element.after(controls);
    const state = { element, controls, button, label, paused: false, visible: false };
    button.addEventListener('click', () => { state.paused = !state.paused; update(state); });
    diagrams.push(state);
    update(state);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const state = diagrams.find((item) => item.element === entry.target);
        state.visible = entry.isIntersecting && entry.intersectionRatio >= .08;
        update(state);
      });
    }, { threshold: [0, .08] });
    diagrams.forEach((state) => observer.observe(state.element));
  } else {
    const checkVisibility = () => diagrams.forEach((state) => {
      const rect = state.element.getBoundingClientRect();
      state.visible = rect.bottom > 0 && rect.top < innerHeight;
      update(state);
    });
    addEventListener('scroll', checkVisibility, { passive: true });
    addEventListener('resize', checkVisibility);
    checkVisibility();
  }
  // The module tab controller changes hidden attributes; suspend those diagrams immediately.
  document.querySelectorAll('.module-panels').forEach((panels) => {
    new MutationObserver(() => diagrams.forEach(update)).observe(panels, { subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden'] });
  });
  preference.addEventListener('change', () => diagrams.forEach(update));
  document.addEventListener('visibilitychange', () => diagrams.forEach(update));
})();
