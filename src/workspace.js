const scenarios = [
  ['solarSystem', '01', 'The solar neighborhood', 'Find your bearings among familiar worlds. Add a moon and try to keep it in orbit.', 'solar-system', 'START HERE'],
  ['binaryStars', '02', 'A dance of two suns', 'Explore a shared center of gravity. How close can a planet safely orbit?', 'binary-stars', 'ORBITAL DYNAMICS'],
  ['blackHoleFeasting', '03', 'At the edge of darkness', 'Send a body past a black hole and watch gravity reshape its trajectory.', 'black-hole', 'EXTREME GRAVITY'],
  ['pulsarSystem', '04', 'The cosmic lighthouse', 'Explore a rotating pulsar and its sweeping beams in a stylized stellar system.', 'pulsar-system', 'STELLAR REMNANTS'],
];

export function initWorkspace(ui) {
  const gallery = document.getElementById('scenario-gallery');
  const cards = document.getElementById('scenario-cards');
  let previouslyPaused = false;
  document.getElementById('btn-explore').addEventListener('click', () => {
    previouslyPaused = ui.isPaused;
    ui.isPaused = true;
    ui.isDragging = false;
    gallery.showModal();
  });
  gallery.addEventListener('close', () => { ui.isPaused = previouslyPaused; });
  document.getElementById('btn-close-gallery').addEventListener('click', () => gallery.close());
  for (const [key, number, title, description, asset, category] of scenarios) {
    const button = document.createElement('button');
    button.className = 'scenario-card';
    button.dataset.scenario = key;
    button.innerHTML = `<div class="scenario-image"><img src="docs/assets/preview-${asset}.png" alt="" width="640" height="360"><span>${number} / ${category}</span></div><div class="scenario-copy"><h2>${title}</h2><p>${description}</p><span class="scenario-launch">Launch experiment <b>↗</b></span></div>`;
    button.addEventListener('click', () => {
      ui.presetSelect.value = key;
      ui.onPresetChange(key);
      ui.isPaused = false;
      previouslyPaused = false;
      ui.updatePlayButton?.();
      gallery.close();
      ui.showToast(`${title} — select a body to inspect it`);
    });
    cards.append(button);
  }
  document.getElementById('btn-empty-sandbox').addEventListener('click', () => {
    ui.missionManager.abortMission();
    ui.despawnSpacecraft();
    ui.engine.clear();
    ui.particles.clear();
    ui.selectBody(null);
    ui.renderer.camera.targetBody = null;
    gallery.close();
    ui.showToast('Empty sandbox ready. Use Free launch to create your first body.');
  });
  const tools = document.getElementById('creation-tools');
  const toolsButton = document.getElementById('btn-tools');
  toolsButton.addEventListener('click', () => {
    const collapsed = tools.classList.toggle('tools-collapsed');
    toolsButton.setAttribute('aria-expanded', String(!collapsed));
  });
  document.getElementById('placement-mode').addEventListener('change', (event) => {
    document.getElementById('placement-hint').textContent = event.target.value === 'circular'
      ? 'Click or drag in empty space. Release to orbit the strongest attractor. Approximate in multi-body systems; requires an existing body.'
      : 'Drag on empty space to set launch velocity.';
  });
  document.getElementById('btn-close-inspector').addEventListener('click', () => ui.selectBody(null));
  const fields = ['name', 'mass', 'radius', 'vx', 'vy'].map((key) => document.getElementById(`edit-${key}`));
  document.addEventListener('bodyselection', ({ detail: body }) => {
    document.getElementById('edit-status').textContent = '';
    if (!body) return;
    [body.name, body.mass, body.radius, body.velocity.x, body.velocity.y].forEach((value, i) => { fields[i].value = value; });
  });
  document.getElementById('body-editor-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const body = ui.selectedBody && ui.engine.getBody(ui.selectedBody.id);
    if (!body || !event.target.reportValidity()) return;
    const [name, ...values] = fields.map((field) => field.value);
    const [mass, radius, vx, vy] = values.map(Number);
    if (![mass, radius, vx, vy].every(Number.isFinite) || !name.trim()) return;
    Object.assign(body, { name: name.trim(), mass, radius, trail: [] });
    body.velocity.x = vx;
    body.velocity.y = vy;
    document.getElementById('edit-status').textContent = 'Changes applied';
    ui.updateInspector();
  });
}
