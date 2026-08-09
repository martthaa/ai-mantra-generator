import { joinWaitlist } from '../../services/waitlistService.js';
import waitlistCheckUrl from '../../../assets/animations/waitlist-check.json?url';
import logoUrl from '../../../assets/icons/logo_Aystra.png?url';

(function initWaitlistLanding(global) {
  const rootId = 'waitlist-landing';

  function setStatus(message, tone, statusElement) {
    statusElement.textContent = message;
    statusElement.dataset.tone = tone;
  }

  function createLogo() {
    const logo = document.createElement('img');
    logo.className = 'waitlist-landing__logo';
    logo.src = logoUrl;
    logo.alt = 'Aystra';

    return logo;
  }

  function getShapePath(lottieData) {
    const shape = lottieData?.layers?.[0]?.shapes?.[0]?.it?.find((item) => item.ty === 'sh');
    const vertices = shape?.ks?.k?.v;

    if (!Array.isArray(vertices) || vertices.length === 0) {
      return '';
    }

    return vertices
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
      .join(' ');
  }

  async function renderAnimatedCheck(target) {
    try {
      const response = await fetch(waitlistCheckUrl);
      const lottieData = await response.json();
      const pathData = getShapePath(lottieData);

      if (!pathData) {
        return;
      }

      target.innerHTML = '';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `${-lottieData.w / 2} ${-lottieData.h / 2} ${lottieData.w} ${lottieData.h}`);
      svg.setAttribute('aria-hidden', 'true');
      svg.classList.add('waitlist-landing__success-svg');

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.id = 'waitlist-check-glass';
      gradient.setAttribute('x1', '-18');
      gradient.setAttribute('y1', '14');
      gradient.setAttribute('x2', '24');
      gradient.setAttribute('y2', '-16');
      gradient.setAttribute('gradientUnits', 'userSpaceOnUse');

      [
        ['0%', '0.12'],
        ['38%', '0.24'],
        ['64%', '0.16'],
        ['100%', '0.22'],
      ].forEach(([offset, opacity]) => {
        const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-color', '#ffffff');
        stop.setAttribute('stop-opacity', opacity);
        gradient.append(stop);
      });

      defs.append(gradient);

      const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      glowPath.setAttribute('d', pathData);
      glowPath.setAttribute('fill', 'none');
      glowPath.setAttribute('stroke', 'rgba(255, 255, 255, 0.16)');
      glowPath.setAttribute('stroke-width', '7');
      glowPath.setAttribute('stroke-linecap', 'round');
      glowPath.setAttribute('stroke-linejoin', 'round');
      glowPath.classList.add('waitlist-landing__success-path', 'waitlist-landing__success-path--glow');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'url(#waitlist-check-glass)');
      path.setAttribute('stroke-width', '5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.classList.add('waitlist-landing__success-path', 'waitlist-landing__success-path--glass');

      const highlightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      highlightPath.setAttribute('d', pathData);
      highlightPath.setAttribute('fill', 'none');
      highlightPath.setAttribute('stroke', 'rgba(255, 255, 255, 0.58)');
      highlightPath.setAttribute('stroke-width', '1.25');
      highlightPath.setAttribute('stroke-linecap', 'round');
      highlightPath.setAttribute('stroke-linejoin', 'round');
      highlightPath.classList.add('waitlist-landing__success-path', 'waitlist-landing__success-path--highlight');

      svg.append(defs, glowPath, path, highlightPath);
      target.append(svg);
    } catch (error) {
      target.hidden = true;
    }
  }

  function createForm(onSuccess) {
    const form = document.createElement('form');
    form.className = 'waitlist-form';
    form.noValidate = true;

    const emailLabel = document.createElement('label');
    emailLabel.className = 'waitlist-form__label';
    emailLabel.htmlFor = 'waitlist-email';
    emailLabel.textContent = 'Email';

    const inputShell = document.createElement('div');
    inputShell.className = 'waitlist-form__shell';

    const inputFrame = document.createElement('div');
    inputFrame.className = 'waitlist-form__input-frame';

    const emailInput = document.createElement('input');
    emailInput.id = 'waitlist-email';
    emailInput.className = 'waitlist-form__input';
    emailInput.type = 'email';
    emailInput.name = 'email';
    emailInput.autocomplete = 'email';
    emailInput.inputMode = 'email';
    emailInput.placeholder = 'Enter your email';
    emailInput.required = true;

    const submitButton = document.createElement('button');
    submitButton.className = 'waitlist-form__submit';
    submitButton.type = 'submit';
    submitButton.textContent = 'Join';

    const status = document.createElement('p');
    status.className = 'waitlist-form__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    inputFrame.append(emailInput);
    inputShell.append(inputFrame, submitButton);
    form.append(emailLabel, inputShell, status);

    emailInput.addEventListener('input', () => {
      form.classList.toggle('waitlist-form--valid', emailInput.validity.valid);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();

      if (!email) {
        setStatus('Enter your email to join the waitlist.', 'error', status);
        emailInput.focus();
        return;
      }

      submitButton.disabled = true;
      emailInput.disabled = true;
      setStatus('', 'loading', status);

      try {
        const result = await joinWaitlist({
          email,
          source: 'waitlist-landing',
        });

        if (result.status === 'joined') {
          onSuccess();
          form.reset();
          form.classList.remove('waitlist-form--valid');
          return;
        }

        if (result.status === 'already_joined') {
          onSuccess();
          return;
        }

        if (result.status === 'invalid_email') {
          setStatus('Use a valid email address.', 'error', status);
          emailInput.focus();
          return;
        }

        if (result.status === 'storage_not_configured') {
          setStatus('Waitlist storage is not configured yet. No email was saved.', 'error', status);
          return;
        }

        if (result.status === 'storage_failed') {
          setStatus('Waitlist storage permissions need to be updated before email can be saved.', 'error', status);
          return;
        }

        setStatus('Could not join the waitlist right now. Please try again.', 'error', status);
      } catch (error) {
        setStatus('Could not join the waitlist right now. Please try again.', 'error', status);
      } finally {
        submitButton.disabled = false;
        emailInput.disabled = false;
      }
    });

    return form;
  }

  function mountWaitlistLanding(target = document.body) {
    const existing = document.getElementById(rootId);

    if (existing) {
      existing.remove();
    }

    const page = document.createElement('section');
    page.id = rootId;
    page.className = 'waitlist-landing';

    const header = document.createElement('header');
    header.className = 'waitlist-landing__header';

    const homeLink = document.createElement('a');
    homeLink.className = 'waitlist-landing__home';
    homeLink.href = './index.html';
    homeLink.setAttribute('aria-label', 'Back to home');
    homeLink.append(createLogo());

    const status = document.createElement('span');
    status.className = 'waitlist-landing__badge';
    status.textContent = 'Private beta soon';

    header.append(homeLink, status);

    const content = document.createElement('div');
    content.className = 'waitlist-landing__content';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'waitlist-landing__eyebrow';
    eyebrow.textContent = 'Aystra waitlist';

    const title = document.createElement('h1');
    title.className = 'waitlist-landing__title';
    title.textContent = 'Join the waitlist';

    const copy = document.createElement('p');
    copy.className = 'waitlist-landing__copy';
    copy.textContent = 'Be the first to know when Aystra becomes available';

    const successIcon = document.createElement('div');
    successIcon.className = 'waitlist-landing__success-icon';
    successIcon.setAttribute('aria-hidden', 'true');

    const privacy = document.createElement('p');
    privacy.className = 'waitlist-landing__privacy';
    privacy.textContent = 'We only use your email for waitlist updates';

    function showSuccessState() {
      page.classList.add('waitlist-landing--success');
      title.textContent = "You're on the waitlist!";
      copy.textContent =
        "Thank you for showing interest in Aystra. We'll notify you when Aystra becomes available.";
      renderAnimatedCheck(successIcon);
    }

    content.append(title, copy, createForm(showSuccessState), successIcon);
    page.append(header, content, privacy);
    target.append(page);
  }

  global.WaitlistLanding = {
    mountWaitlistLanding,
  };
})(window);
