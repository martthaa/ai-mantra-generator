(function initHeroContent(global) {
  const rootId = 'hero-content';
  const filterLabels = ['Keywords', 'Voice', 'Music', 'Length'];
  const selectedKeywords = new Set();
  let selectedVoice = '';
  let selectedMusic = '';
  let selectedLength = '';
  const voiceOptions = [
    {
      title: 'Female',
      description: 'Warm and nurturing female voice',
    },
    {
      title: 'Male',
      description: 'Deep and resonant male voice',
    },
  ];
  const musicOptions = [
    {
      title: 'Ambient',
      description: 'Atmospheric ambient soundscapes',
    },
    {
      title: 'Nature',
      description: 'Gentle nature sounds',
    },
    {
      title: 'Electronic',
      description: 'Relaxing modern electronic sound',
    },
  ];
  const lengthOptions = [
    {
      title: '1 min',
      description: 'Quick affirmation',
    },
    {
      title: '3 min',
      description: 'Standard meditation length',
    },
    {
      title: '5 main',
      description: 'Deep immersive experience',
    },
  ];
  const quickPrompts = [
    'Build confidence and self-trust',
    'Let go of anxiety and overthinking',
    'Stay focused on my goals',
    'Heal from a difficult relationship',
    'Feel calm during stressful periods',
    'Create a positive morning mindset',
  ];
  const selectedQuickPrompts = new Set();
  const keywordGroups = [
    {
      title: 'Emotional',
      options: ['Confidence', 'Inner Peace', 'Self-Love', 'Gratitude', 'Joy'],
    },
    {
      title: 'Mindset',
      options: ['Focus', 'Mental Clarity', 'Discipline', 'Courage', 'Mindfulness'],
    },
    {
      title: 'Growth',
      options: ['Success', 'Motivation', 'Abundance', 'Creativity'],
    },
    {
      title: 'Healing',
      options: ['Letting Go', 'Emotional Balance', 'Stress Relief', 'Deep Sleep'],
    },
  ];

  function createHeading() {
    const heading = document.createElement('h1');
    heading.className = 'hero-content__heading';
    heading.textContent = 'Create a mantra written only for you.';

    return heading;
  }

  function createDescription() {
    const description = document.createElement('p');
    description.className = 'hero-content__description';
    description.textContent =
      "Personalized AI-generated audio mantras designed to help you build confidence, stay focused, and navigate life's changes.";

    return description;
  }

  function updateKeywordsPill(pill) {
    const selectedCount = selectedKeywords.size;
    const label = pill.querySelector('.hero-content__filter-label');

    label.textContent = selectedCount > 0 ? `${selectedCount} Keywords` : 'Keywords';
    pill.classList.toggle('hero-content__filter-pill--configured', selectedCount > 0);
  }

  function createKeywordOption(label, keywordsPill) {
    const option = document.createElement('button');
    option.className = 'hero-content__dropdown-option';
    option.type = 'button';
    option.setAttribute('aria-pressed', 'false');
    option.textContent = label;

    option.addEventListener('click', () => {
      const isSelected = selectedKeywords.has(label);

      if (isSelected) {
        selectedKeywords.delete(label);
      } else {
        selectedKeywords.add(label);
      }

      option.classList.toggle('hero-content__dropdown-option--active', !isSelected);
      option.setAttribute('aria-pressed', String(!isSelected));
      updateKeywordsPill(keywordsPill);
    });

    return option;
  }

  function createKeywordGroup(group, keywordsPill) {
    const groupElement = document.createElement('div');
    groupElement.className = 'hero-content__dropdown-group';

    const title = document.createElement('p');
    title.className = 'hero-content__dropdown-title';
    title.textContent = group.title;

    const options = document.createElement('div');
    options.className = 'hero-content__dropdown-options';

    group.options.forEach((option) => {
      options.append(createKeywordOption(option, keywordsPill));
    });

    groupElement.append(title, options);

    return groupElement;
  }

  function createKeywordsDropdown(keywordsPill) {
    const dropdown = document.createElement('div');
    dropdown.className = 'hero-content__dropdown hero-content__dropdown--keywords';

    keywordGroups.forEach((group) => {
      dropdown.append(createKeywordGroup(group, keywordsPill));
    });

    return dropdown;
  }

  function updateVoicePill(pill) {
    const label = pill.querySelector('.hero-content__filter-label');

    label.textContent = selectedVoice || 'Voice';
    pill.classList.toggle('hero-content__filter-pill--configured', selectedVoice.length > 0);
  }

  function updateMusicPill(pill) {
    const label = pill.querySelector('.hero-content__filter-label');

    label.textContent = selectedMusic || 'Music';
    pill.classList.toggle('hero-content__filter-pill--configured', selectedMusic.length > 0);
  }

  function updateLengthPill(pill) {
    const label = pill.querySelector('.hero-content__filter-label');

    label.textContent = selectedLength || 'Length';
    pill.classList.toggle('hero-content__filter-pill--configured', selectedLength.length > 0);
  }

  function createMediaOption(option, settingsPill, state) {
    const optionElement = document.createElement('button');
    optionElement.className = 'hero-content__media-option';
    optionElement.type = 'button';
    optionElement.setAttribute('aria-pressed', 'false');

    const content = document.createElement('span');
    content.className = 'hero-content__media-content';

    const title = document.createElement('span');
    title.className = 'hero-content__media-title';
    title.textContent = option.title;

    const description = document.createElement('span');
    description.className = 'hero-content__media-description';
    description.textContent = option.description;

    const controls = document.createElement('span');
    controls.className = 'hero-content__media-controls';

    const play = document.createElement('span');
    play.className = 'hero-content__media-play';
    play.setAttribute('aria-hidden', 'true');
    play.innerHTML =
      '<img class="hero-content__media-play-icon" src="./assets/icons/line-md_play-filled.svg" alt="">';

    const check = document.createElement('span');
    check.className = 'hero-content__media-check';
    check.setAttribute('aria-hidden', 'true');
    check.innerHTML =
      '<img class="hero-content__media-check-icon" src="./assets/icons/tabler_check-filled.svg" alt="">';

    content.append(title, description);
    controls.append(play, check);
    optionElement.append(content, controls);

    optionElement.addEventListener('click', () => {
      if (state === 'voice') {
        selectedVoice = option.title;
      } else {
        selectedMusic = option.title;
      }

      optionElement.parentElement.querySelectorAll('.hero-content__media-option').forEach((item) => {
        const isActive = item === optionElement;

        item.classList.toggle('hero-content__media-option--active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });

      if (state === 'voice') {
        updateVoicePill(settingsPill);
      } else {
        updateMusicPill(settingsPill);
      }
    });

    return optionElement;
  }

  function createLengthOption(option, lengthPill) {
    const optionElement = document.createElement('button');
    optionElement.className = 'hero-content__length-option';
    optionElement.type = 'button';
    optionElement.setAttribute('aria-pressed', 'false');

    const content = document.createElement('span');
    content.className = 'hero-content__length-content';

    const title = document.createElement('span');
    title.className = 'hero-content__length-title';
    title.textContent = option.title;

    const description = document.createElement('span');
    description.className = 'hero-content__length-description';
    description.textContent = option.description;

    const check = document.createElement('span');
    check.className = 'hero-content__length-check';
    check.setAttribute('aria-hidden', 'true');
    check.innerHTML =
      '<img class="hero-content__length-check-icon" src="./assets/icons/tabler_check-filled.svg" alt="">';

    content.append(title, description);
    optionElement.append(content, check);

    optionElement.addEventListener('click', () => {
      selectedLength = option.title;

      optionElement.parentElement.querySelectorAll('.hero-content__length-option').forEach((item) => {
        const isActive = item === optionElement;

        item.classList.toggle('hero-content__length-option--active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });

      updateLengthPill(lengthPill);
    });

    return optionElement;
  }

  function createVoiceDropdown(voicePill) {
    const dropdown = document.createElement('div');
    dropdown.className = 'hero-content__dropdown hero-content__dropdown--media hero-content__dropdown--voice';

    voiceOptions.forEach((option) => {
      dropdown.append(createMediaOption(option, voicePill, 'voice'));
    });

    return dropdown;
  }

  function createMusicDropdown(musicPill) {
    const dropdown = document.createElement('div');
    dropdown.className = 'hero-content__dropdown hero-content__dropdown--media hero-content__dropdown--music';

    musicOptions.forEach((option) => {
      dropdown.append(createMediaOption(option, musicPill, 'music'));
    });

    return dropdown;
  }

  function createLengthDropdown(lengthPill) {
    const dropdown = document.createElement('div');
    dropdown.className = 'hero-content__dropdown hero-content__dropdown--length';

    lengthOptions.forEach((option) => {
      dropdown.append(createLengthOption(option, lengthPill));
    });

    return dropdown;
  }

  function createFilterPill(label) {
    const item = document.createElement('div');
    item.className = 'hero-content__filter-item';

    const pill = document.createElement('button');
    pill.className = 'hero-content__filter-pill';
    pill.type = 'button';

    const pillLabel = document.createElement('span');
    pillLabel.className = 'hero-content__filter-label';
    pillLabel.textContent = label;

    pill.append(pillLabel);

    item.append(pill);

    if (label === 'Keywords') {
      item.append(createKeywordsDropdown(pill));

      const clearIcon = document.createElement('span');
      clearIcon.className = 'hero-content__filter-clear';
      clearIcon.setAttribute('aria-hidden', 'true');
      clearIcon.textContent = '×';
      pill.append(clearIcon);

      pill.addEventListener('click', (event) => {
        if (!event.target.closest('.hero-content__filter-clear')) {
          return;
        }

        selectedKeywords.clear();

        item.querySelectorAll('.hero-content__dropdown-option').forEach((option) => {
          option.classList.remove('hero-content__dropdown-option--active');
          option.setAttribute('aria-pressed', 'false');
        });

        updateKeywordsPill(pill);
      });
    }

    if (label === 'Voice') {
      item.append(createVoiceDropdown(pill));

      const clearIcon = document.createElement('span');
      clearIcon.className = 'hero-content__filter-clear';
      clearIcon.setAttribute('aria-hidden', 'true');
      clearIcon.textContent = '×';
      pill.append(clearIcon);

      pill.addEventListener('click', (event) => {
        if (!event.target.closest('.hero-content__filter-clear')) {
          return;
        }

        selectedVoice = '';

        item.querySelectorAll('.hero-content__media-option').forEach((option) => {
          option.classList.remove('hero-content__media-option--active');
          option.setAttribute('aria-pressed', 'false');
        });

        updateVoicePill(pill);
      });
    }

    if (label === 'Music') {
      item.append(createMusicDropdown(pill));

      const clearIcon = document.createElement('span');
      clearIcon.className = 'hero-content__filter-clear';
      clearIcon.setAttribute('aria-hidden', 'true');
      clearIcon.textContent = '×';
      pill.append(clearIcon);

      pill.addEventListener('click', (event) => {
        if (!event.target.closest('.hero-content__filter-clear')) {
          return;
        }

        selectedMusic = '';

        item.querySelectorAll('.hero-content__media-option').forEach((option) => {
          option.classList.remove('hero-content__media-option--active');
          option.setAttribute('aria-pressed', 'false');
        });

        updateMusicPill(pill);
      });
    }

    if (label === 'Length') {
      item.append(createLengthDropdown(pill));

      const clearIcon = document.createElement('span');
      clearIcon.className = 'hero-content__filter-clear';
      clearIcon.setAttribute('aria-hidden', 'true');
      clearIcon.textContent = '×';
      pill.append(clearIcon);

      pill.addEventListener('click', (event) => {
        if (!event.target.closest('.hero-content__filter-clear')) {
          return;
        }

        selectedLength = '';

        item.querySelectorAll('.hero-content__length-option').forEach((option) => {
          option.classList.remove('hero-content__length-option--active');
          option.setAttribute('aria-pressed', 'false');
        });

        updateLengthPill(pill);
      });
    }

    return item;
  }

  function createPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'hero-content__prompt';

    const input = document.createElement('textarea');
    input.className = 'hero-content__input';
    input.placeholder = "Tell us what mantra you'd like we to create for you...";
    input.rows = 1;

    const submitButton = document.createElement('button');
    submitButton.className = 'hero-content__submit';
    submitButton.type = 'button';
    submitButton.setAttribute('aria-label', 'Process mantra');
    submitButton.hidden = true;
    submitButton.innerHTML =
      '<img class="hero-content__submit-icon" src="./assets/icons/basil_arrow-up-outline.svg" alt="" aria-hidden="true">';

    const filters = document.createElement('div');
    filters.className = 'hero-content__filters';

    filterLabels.forEach((label) => {
      filters.append(createFilterPill(label));
    });

    function updateSubmitVisibility() {
      submitButton.hidden = input.value.trim().length === 0;
    }

    input.addEventListener('input', updateSubmitVisibility);

    submitButton.addEventListener('click', () => {
      const value = input.value.trim();

      if (!value) {
        return;
      }

      sessionStorage.setItem('intakePrompt', value);
      window.location.href = './playground.html';
    });

    prompt.append(input, filters, submitButton);

    return {
      prompt,
      input,
      updateSubmitVisibility,
    };
  }

  function createQuickPrompt(label, input, updateSubmitVisibility) {
    const prompt = document.createElement('button');
    prompt.className = 'hero-content__quick-prompt';
    prompt.type = 'button';
    prompt.setAttribute('aria-pressed', 'false');
    prompt.textContent = label;

    prompt.addEventListener('click', () => {
      const isSelected = selectedQuickPrompts.has(label);

      if (isSelected) {
        selectedQuickPrompts.delete(label);
      } else {
        selectedQuickPrompts.add(label);
      }

      prompt.classList.toggle('hero-content__quick-prompt--active', !isSelected);
      prompt.setAttribute('aria-pressed', String(!isSelected));
      input.value = Array.from(selectedQuickPrompts).join('. ');
      updateSubmitVisibility();
      input.focus();
    });

    return prompt;
  }

  function createQuickPrompts(input, updateSubmitVisibility) {
    const prompts = document.createElement('div');
    prompts.className = 'hero-content__quick-prompts';

    quickPrompts.forEach((label) => {
      prompts.append(createQuickPrompt(label, input, updateSubmitVisibility));
    });

    return prompts;
  }

  function mountHeroContent(target = document.body) {
    if (document.getElementById(rootId)) {
      return;
    }

    const section = document.createElement('section');
    section.id = rootId;
    section.className = 'hero-content';
    const { prompt, input, updateSubmitVisibility } = createPrompt();

    section.append(
      createHeading(),
      createDescription(),
      prompt,
      createQuickPrompts(input, updateSubmitVisibility),
    );
    target.append(section);
  }

  global.HeroContent = {
    mountHeroContent,
  };
})(window);
