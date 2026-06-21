(function initHeader(global) {
  const rootId = 'site-header';

  function createLogo() {
    const logo = document.createElement('img');
    logo.className = 'site-header__logo';
    logo.src = './assets/icons/Logo.svg';
    logo.alt = '';
    logo.setAttribute('aria-hidden', 'true');

    return logo;
  }

  function mountHeader(target = document.body) {
    if (document.getElementById(rootId)) {
      return;
    }

    const header = document.createElement('header');
    header.id = rootId;
    header.className = 'site-header';

    header.append(createLogo());
    target.prepend(header);
  }

  global.Header = {
    mountHeader,
  };
})(window);
