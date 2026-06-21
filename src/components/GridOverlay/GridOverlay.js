(function initGridOverlay(global) {
  const rootId = 'grid-overlay-root';
  const grid = global.ProjectConfig.grid;

  function createColumn(index) {
    const column = document.createElement('div');
    column.className = 'grid-overlay__column';
    column.textContent = String(index + 1);

    return column;
  }

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'grid-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.setProperty('--grid-columns', String(grid.columns));
    overlay.style.setProperty('--grid-margin', `${grid.margin}px`);
    overlay.style.setProperty('--grid-gutter', `${grid.gutter}px`);
    overlay.style.setProperty('--grid-color', `rgb(255 0 0 / ${grid.opacity})`);

    for (let index = 0; index < grid.columns; index += 1) {
      overlay.append(createColumn(index));
    }

    return overlay;
  }

  function createToggle(overlay) {
    const toggle = document.createElement('button');
    toggle.className = 'grid-overlay-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle grid');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.innerHTML = '<span class="grid-overlay-toggle__icon" aria-hidden="true"></span>';

    toggle.addEventListener('click', () => {
      const isActive = overlay.classList.toggle('grid-overlay--active');
      toggle.setAttribute('aria-pressed', String(isActive));
    });

    return toggle;
  }

  function mountGridOverlay(target = document.body) {
    if (document.getElementById(rootId)) {
      return;
    }

    const root = document.createElement('div');
    root.id = rootId;

    const overlay = createOverlay();
    const toggle = createToggle(overlay);

    root.append(overlay, toggle);
    target.append(root);
  }

  global.GridOverlay = {
    mountGridOverlay,
  };
})(window);
