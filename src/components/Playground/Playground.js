import {
  createInitialAssistantMessage,
  createInitialMantra,
  createMantraTitle,
  getInitialMantraSettings,
  getInitialMantraContext,
  MANTRA_KEYWORD_GROUPS,
  MANTRA_LENGTH_OPTIONS,
  MANTRA_MUSIC_OPTIONS,
  MANTRA_VOICE_OPTIONS,
  requestMantraRefinement,
  saveInitialMantraSettings,
} from '../../services/mantraService.js';

(function initPlayground(global) {
  const rootId = 'playground';
  const suggestions = [
    'Make it shorter',
    'Add more confidence-focused affirmations',
    'Make it feel calmer',
  ];
  const flowerThumbnailSrc = './assets/images/flower-background.png';
  const flowerLoadingVideoSrc = './assets/images/flower-loading.mp4';
  const musicLoopSources = {
    Ambient: './assets/audio/music/tech-house-01.mp3',
    'Tech House': './assets/audio/music/ambient-01.mp3',
  };
  const playIconMarkup =
    '<img class="playground-settings__play-icon" src="./assets/icons/line-md_play-filled.svg" alt="">';
  const playingIconMarkup =
    '<img class="playground-settings__playing-icon" src="./assets/icons/audio-playing.svg" alt="">';
  const previewPlayback = {
    audio: null,
    trigger: null,
    timeoutId: null,
    objectUrl: '',
  };

  function getLengthInSeconds(length) {
    const minutes = Number.parseInt(length, 10);

    return Number.isFinite(minutes) ? minutes * 60 : 60;
  }

  function createMockAudioBlob(settings) {
    const duration = getLengthInSeconds(settings.length);
    const sampleRate = 16000;
    const sampleCount = sampleRate * duration;
    const bytesPerSample = 2;
    const dataSize = sampleCount * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const musicBase = {
      Ambient: 174,
      'Tech House': 220,
    }[settings.music] || 174;
    const voiceBase = settings.voice === 'Male' ? 110 : 220;

    function writeString(offset, value) {
      for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
      }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 8 * bytesPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    for (let index = 0; index < sampleCount; index += 1) {
      const time = index / sampleRate;
      const fadeIn = Math.min(time / 2, 1);
      const fadeOut = Math.min((duration - time) / 2, 1);
      const envelope = Math.max(0, Math.min(fadeIn, fadeOut));
      const music =
        Math.sin(2 * Math.PI * musicBase * time) * 0.12 +
        Math.sin(2 * Math.PI * musicBase * 1.5 * time) * 0.06;
      const voicePulse = Math.sin(2 * Math.PI * voiceBase * time) * 0.04;
      const breath = Math.sin(2 * Math.PI * 0.08 * time) * 0.03;
      const sample = Math.max(-1, Math.min(1, (music + voicePulse + breath) * envelope));

      view.setInt16(44 + index * bytesPerSample, sample * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  function encodeWav(samples, sampleRate) {
    const bytesPerSample = 2;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function writeString(offset, value) {
      for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
      }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 8 * bytesPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    samples.forEach((sample, index) => {
      const clipped = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + index * bytesPerSample, clipped * 0x7fff, true);
    });

    return new Blob([buffer], { type: 'audio/wav' });
  }

  function createBackgroundSample(music, time) {
    if (music === 'Tech House') {
      const pulse = Math.sin(2 * Math.PI * 0.5 * time) > 0 ? 0.035 : 0;

      return (
        Math.sin(2 * Math.PI * 110 * time) * 0.05 +
        Math.sin(2 * Math.PI * 220 * time) * 0.035 +
        pulse
      );
    }

    return (
      Math.sin(2 * Math.PI * 174 * time) * 0.055 +
      Math.sin(2 * Math.PI * 261.63 * time) * 0.035 +
      Math.sin(2 * Math.PI * 0.07 * time) * 0.03
    );
  }

  async function loadMusicLoop(music) {
    const source = musicLoopSources[music];

    if (!source) {
      return null;
    }

    try {
      const response = await fetch(source);

      if (!response.ok) {
        return null;
      }

      return await decodeAudioBlob(await response.blob());
    } catch {
      return null;
    }
  }

  async function decodeAudioBlob(blob) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextConstructor) {
      throw new Error('Audio decoding is not supported in this browser.');
    }

    const audioContext = new AudioContextConstructor();

    try {
      const audioData = await blob.arrayBuffer();

      if (audioData.byteLength === 0) {
        throw new Error('Audio file is empty.');
      }

      return await audioContext.decodeAudioData(audioData.slice(0));
    } finally {
      audioContext.close();
    }
  }

  function readVoiceSample(audioBuffer, time, totalDuration) {
    const voiceStartSeconds = 3;
    const gapSeconds = 2.2;

    if (time < voiceStartSeconds) {
      return 0;
    }

    const cycleSeconds = audioBuffer.duration + gapSeconds;
    const voiceTime = time - voiceStartSeconds;
    const repeatIndex = Math.floor(voiceTime / cycleSeconds);
    const cycleStart = voiceStartSeconds + repeatIndex * cycleSeconds;
    const cycleTime = voiceTime - repeatIndex * cycleSeconds;

    if (repeatIndex > 0 && cycleStart + audioBuffer.duration > totalDuration) {
      return 0;
    }

    if (cycleTime >= audioBuffer.duration) {
      return 0;
    }

    const sourceIndex = Math.floor(cycleTime * audioBuffer.sampleRate);
    const channelCount = audioBuffer.numberOfChannels;
    let sample = 0;

    for (let channel = 0; channel < channelCount; channel += 1) {
      sample += audioBuffer.getChannelData(channel)[sourceIndex] || 0;
    }

    const voiceFade = Math.min(cycleTime / 0.25, (audioBuffer.duration - cycleTime) / 0.25, 1);

    return (sample / channelCount) * Math.max(0, voiceFade);
  }

  function readLoopedAudioSample(audioBuffer, time) {
    if (!audioBuffer) {
      return 0;
    }

    const loopTime = time % audioBuffer.duration;
    const sourceIndex = Math.floor(loopTime * audioBuffer.sampleRate);
    const channelCount = audioBuffer.numberOfChannels;
    let sample = 0;

    for (let channel = 0; channel < channelCount; channel += 1) {
      sample += audioBuffer.getChannelData(channel)[sourceIndex] || 0;
    }

    return sample / channelCount;
  }

  async function createMixedMantraAudioBlob(mantraText, settings) {
    const response = await fetch('/api/generate-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: mantraText,
        voice: settings.voice,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Speech generation failed.');
    }

    const speechBlob = await response.blob();
    let voiceBuffer;

    try {
      voiceBuffer = await decodeAudioBlob(speechBlob);
    } catch {
      return {
        blob: speechBlob,
        extension: 'mp3',
      };
    }

    const [, musicLoopBuffer] = await Promise.all([
      Promise.resolve(voiceBuffer),
      loadMusicLoop(settings.music),
    ]);
    const sampleRate = 44100;
    const duration = getLengthInSeconds(settings.length);
    const samples = new Float32Array(duration * sampleRate);

    for (let index = 0; index < samples.length; index += 1) {
      const time = index / sampleRate;
      const fadeIn = Math.min(time / 3, 1);
      const fadeOut = Math.min((duration - time) / 3, 1);
      const envelope = Math.max(0, Math.min(fadeIn, fadeOut));
      const background = musicLoopBuffer
        ? readLoopedAudioSample(musicLoopBuffer, time) * 0.24
        : createBackgroundSample(settings.music, time) * 0.55;
      const voice = readVoiceSample(voiceBuffer, time, duration) * 0.9;

      samples[index] = (background + voice) * envelope;
    }

    return {
      blob: encodeWav(samples, sampleRate),
      extension: 'wav',
    };
  }

  function stopPreviewPlayback() {
    if (previewPlayback.audio) {
      previewPlayback.audio.pause();
      previewPlayback.audio.removeAttribute('src');
      previewPlayback.audio.load();
    }

    if (previewPlayback.trigger) {
      previewPlayback.trigger.innerHTML = playIconMarkup;
      previewPlayback.trigger.disabled = false;
    }

    if (previewPlayback.timeoutId) {
      window.clearTimeout(previewPlayback.timeoutId);
    }

    if (previewPlayback.objectUrl) {
      URL.revokeObjectURL(previewPlayback.objectUrl);
    }

    previewPlayback.audio = null;
    previewPlayback.trigger = null;
    previewPlayback.timeoutId = null;
    previewPlayback.objectUrl = '';
  }

  async function playVoicePreview(voice, trigger) {
    const voiceLabel = voice?.toLowerCase() === 'male' ? 'male' : 'female';

    if (previewPlayback.trigger === trigger && previewPlayback.audio) {
      stopPreviewPlayback();
      return;
    }

    stopPreviewPlayback();
    trigger.innerHTML = playingIconMarkup;

    try {
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `This is how your mantra will sound with the ${voiceLabel} voice.`,
          voice,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Voice preview failed.');
      }

      const objectUrl = URL.createObjectURL(await response.blob());
      const audio = new Audio(objectUrl);

      previewPlayback.audio = audio;
      previewPlayback.trigger = trigger;
      previewPlayback.objectUrl = objectUrl;

      audio.addEventListener('ended', () => {
        stopPreviewPlayback();
      });
      await audio.play();
    } catch (error) {
      stopPreviewPlayback();

      throw error;
    }
  }

  async function playMusicPreview(music, trigger) {
    const source = musicLoopSources[music];

    if (!source) {
      return;
    }

    if (previewPlayback.trigger === trigger && previewPlayback.audio) {
      stopPreviewPlayback();
      return;
    }

    stopPreviewPlayback();
    trigger.innerHTML = playingIconMarkup;

    const audio = new Audio(source);
    audio.currentTime = 0;

    previewPlayback.audio = audio;
    previewPlayback.trigger = trigger;
    previewPlayback.timeoutId = window.setTimeout(stopPreviewPlayback, 12000);

    audio.addEventListener('ended', stopPreviewPlayback, { once: true });

    try {
      await audio.play();
    } catch (error) {
      stopPreviewPlayback();
      throw error;
    }
  }

  function createDownloadName(title, extension = 'wav') {
    return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mantra'}.${extension}`;
  }

  function createHeader(title) {
    const header = document.createElement('header');
    header.className = 'playground-chat__header';

    const homeLink = document.createElement('a');
    homeLink.className = 'playground-chat__home';
    homeLink.href = './index.html';
    homeLink.setAttribute('aria-label', 'Return to main menu');

    const logo = document.createElement('img');
    logo.className = 'playground-chat__logo';
    logo.src = './assets/icons/Logo.svg';
    logo.alt = '';
    logo.setAttribute('aria-hidden', 'true');

    const titleElement = document.createElement('h1');
    titleElement.className = 'playground-chat__title';
    titleElement.textContent = title;

    const newLink = document.createElement('a');
    newLink.className = 'playground-chat__new';
    newLink.href = './index.html';
    newLink.textContent = 'New';

    homeLink.append(logo);
    header.append(homeLink, titleElement, newLink);

    return header;
  }

  function createMessage(text, tone = 'assistant') {
    const message = document.createElement('div');
    message.className = `playground-chat__message playground-chat__message--${tone}`;
    message.textContent = text;

    return message;
  }

  function createMessages(prompt) {
    const messages = document.createElement('div');
    messages.className = 'playground-chat__messages';
    messages.setAttribute('aria-live', 'polite');

    messages.append(createMessage(createInitialAssistantMessage(prompt)));

    return messages;
  }

  function createSuggestions(onSend) {
    const list = document.createElement('div');
    list.className = 'playground-chat__suggestions';

    suggestions.forEach((suggestion) => {
      const button = document.createElement('button');
      button.className = 'playground-chat__suggestion';
      button.type = 'button';
      button.textContent = suggestion;

      button.addEventListener('click', () => {
        onSend(suggestion);
      });

      list.append(button);
    });

    return list;
  }

  function copyText(value) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value);
    }
  }

  function createComposer(onSend) {
    const form = document.createElement('form');
    form.className = 'playground-chat__composer';

    const input = document.createElement('textarea');
    input.className = 'playground-chat__input';
    input.name = 'message';
    input.placeholder = 'Message AI…';
    input.rows = 2;

    const button = document.createElement('button');
    button.className = 'playground-chat__send';
    button.type = 'submit';
    button.setAttribute('aria-label', 'Send message');
    button.disabled = true;
    button.innerHTML =
      '<img class="playground-chat__send-icon" src="./assets/icons/basil_arrow-up-outline.svg" alt="" aria-hidden="true">';

    input.addEventListener('input', () => {
      button.disabled = input.value.trim().length === 0;
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const value = input.value.trim();

      if (!value) {
        return;
      }

      onSend(value);
      input.value = '';
      button.disabled = true;
    });

    form.append(input, button);

    return form;
  }

  function createChatSidebar(prompt, onRefineMantra, getSettings) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'playground-chat';
    sidebar.setAttribute('aria-label', 'AI chat');

    const messages = createMessages(prompt);

    async function sendMessage(text) {
      messages.append(createMessage(text, 'user'));
      messages.scrollTop = messages.scrollHeight;

      const pendingMessage = createMessage('Thinking…');
      messages.append(pendingMessage);
      messages.scrollTop = messages.scrollHeight;

      try {
        const refinement = await onRefineMantra(text, getSettings());

        pendingMessage.textContent = refinement.reply;
        messages.scrollTop = messages.scrollHeight;
      } catch {
        pendingMessage.textContent = 'I could not refine the mantra right now. Please try again.';
        messages.scrollTop = messages.scrollHeight;
      }
    }

    const chatBody = document.createElement('div');
    chatBody.className = 'playground-chat__body';
    chatBody.append(messages, createSuggestions(sendMessage), createComposer(sendMessage));

    sidebar.append(createHeader(createMantraTitle(prompt)), chatBody);

    return sidebar;
  }

  function createWorkspace(initialText) {
    let savedText = initialText;
    let isEditing = false;

    const workspace = document.createElement('section');
    workspace.className = 'mantra-workspace';
    workspace.setAttribute('aria-label', 'Mantra editor');

    const toolbar = document.createElement('div');
    toolbar.className = 'mantra-workspace__toolbar';

    const modeToggle = document.createElement('div');
    modeToggle.className = 'mantra-workspace__mode-toggle';

    const readButton = document.createElement('button');
    readButton.className =
      'mantra-workspace__mode mantra-workspace__mode--read mantra-workspace__mode--active';
    readButton.type = 'button';
    readButton.setAttribute('aria-label', 'Read mode');
    readButton.setAttribute('aria-pressed', 'true');
    readButton.innerHTML =
      '<img class="mantra-workspace__mode-icon" src="./assets/icons/readIcon.svg" alt="" aria-hidden="true">';

    const editButton = document.createElement('button');
    editButton.className = 'mantra-workspace__mode mantra-workspace__mode--edit';
    editButton.type = 'button';
    editButton.setAttribute('aria-label', 'Edit mode');
    editButton.setAttribute('aria-pressed', 'false');
    editButton.innerHTML =
      '<img class="mantra-workspace__mode-icon" src="./assets/icons/editIcon.svg" alt="" aria-hidden="true">';

    const copyButton = document.createElement('button');
    copyButton.className = 'mantra-workspace__copy';
    copyButton.type = 'button';
    copyButton.innerHTML =
      '<img class="mantra-workspace__copy-icon" src="./assets/icons/copyVector.svg" alt="" aria-hidden="true"><span class="mantra-workspace__copy-label">Copy</span>';

    const saveButton = document.createElement('button');
    saveButton.className = 'mantra-workspace__action mantra-workspace__action--save';
    saveButton.type = 'button';
    saveButton.textContent = 'Save changes';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'mantra-workspace__action mantra-workspace__action--cancel';
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';

    const editActions = document.createElement('div');
    editActions.className = 'mantra-workspace__edit-actions';

    const text = document.createElement('div');
    text.className = 'mantra-workspace__text';
    text.textContent = savedText;

    const editPanel = document.createElement('div');
    editPanel.className = 'mantra-workspace__edit-panel';
    editPanel.hidden = true;

    const editor = document.createElement('textarea');
    editor.className = 'mantra-workspace__editor';
    editor.value = savedText;

    function renderMode() {
      readButton.classList.toggle('mantra-workspace__mode--active', !isEditing);
      readButton.setAttribute('aria-pressed', String(!isEditing));
      editButton.classList.toggle('mantra-workspace__mode--active', isEditing);
      editButton.setAttribute('aria-pressed', String(isEditing));
      text.hidden = isEditing;
      editPanel.hidden = !isEditing;
      copyButton.hidden = isEditing;
    }

    function setText(nextText) {
      savedText = nextText;
      text.textContent = savedText;
      editor.value = savedText;
    }

    readButton.addEventListener('click', () => {
      isEditing = false;
      editor.value = savedText;
      renderMode();
    });

    editButton.addEventListener('click', () => {
      isEditing = true;
      editor.value = savedText;
      renderMode();
      editor.focus();
    });

    saveButton.addEventListener('click', () => {
      const nextText = editor.value.trim();

      if (nextText) {
        setText(nextText);
      }

      isEditing = false;
      renderMode();
    });

    cancelButton.addEventListener('click', () => {
      editor.value = savedText;
      isEditing = false;
      renderMode();
    });

    copyButton.addEventListener('click', () => {
      const label = copyButton.querySelector('.mantra-workspace__copy-label');
      const icon = copyButton.querySelector('.mantra-workspace__copy-icon');

      copyText(savedText);
      icon.src = './assets/icons/tabler_check-filled.svg';
      label.textContent = 'Copied';

      window.setTimeout(() => {
        icon.src = './assets/icons/copyVector.svg';
        label.textContent = 'Copy';
      }, 1200);
    });

    modeToggle.append(readButton, editButton);
    toolbar.append(modeToggle, copyButton);
    editActions.append(saveButton, cancelButton);
    editPanel.append(editor, editActions);
    workspace.append(toolbar, text, editPanel);

    return {
      element: workspace,
      getText() {
        return savedText;
      },
      setText,
      async refine(message, settings) {
        const refinement = await requestMantraRefinement(savedText, message, settings);

        if (refinement.mode === 'direct_edit' && refinement.mantra.trim()) {
          setText(refinement.mantra);
        }

        return refinement;
      },
    };
  }

  function updateKeywordsEmptyState(chips, emptyState) {
    emptyState.hidden = chips.children.length > 0;
  }

  function updateKeywordOptions(options, selectedKeywords) {
    options.querySelectorAll('.playground-settings__keyword-option').forEach((option) => {
      const isSelected = selectedKeywords.has(option.dataset.keyword);

      option.classList.toggle('playground-settings__keyword-option--selected', isSelected);
      option.setAttribute('aria-pressed', String(isSelected));
    });
  }

  function createKeywordChip(label, onRemove) {
    const chip = document.createElement('button');
    chip.className = 'playground-settings__chip';
    chip.type = 'button';
    chip.setAttribute('aria-label', `Remove ${label}`);
    chip.innerHTML = `<span>${label}</span><span class="playground-settings__chip-remove" aria-hidden="true">×</span>`;

    chip.addEventListener('click', () => {
      chip.remove();
      onRemove();
    });

    return chip;
  }

  function createKeywordOption(label, selectedKeywords, chips, emptyState, settings, keywordOptions) {
    const option = document.createElement('button');
    option.className = 'playground-settings__keyword-option';
    option.type = 'button';
    option.dataset.keyword = label;
    option.setAttribute('aria-pressed', 'false');
    option.textContent = label;

    option.addEventListener('click', () => {
      if (selectedKeywords.has(label)) {
        selectedKeywords.delete(label);
        chips.querySelector(`[data-chip="${CSS.escape(label)}"]`)?.remove();
      } else {
        selectedKeywords.add(label);
        chips.append(
          createSelectedKeywordChip(label, selectedKeywords, chips, emptyState, settings, keywordOptions),
        );
      }

      settings.keywords = Array.from(selectedKeywords);
      saveInitialMantraSettings(settings);
      updateKeywordsEmptyState(chips, emptyState);
      updateKeywordOptions(keywordOptions, selectedKeywords);
    });

    return option;
  }

  function createSettingOption(option, selectedValue, onSelect, canPreview = true, onPreview = null) {
    const optionElement = document.createElement('button');
    optionElement.className = 'playground-settings__setting-option';
    optionElement.type = 'button';
    optionElement.dataset.value = option.title;
    optionElement.setAttribute('aria-pressed', String(option.title === selectedValue));

    const label = document.createElement('span');
    label.className = 'playground-settings__setting-option-label';
    label.textContent = option.title;

    const controls = document.createElement('span');
    controls.className = 'playground-settings__setting-option-controls';

    if (canPreview) {
      const play = document.createElement('button');
      play.className = 'playground-settings__play';
      play.type = 'button';
      play.setAttribute('aria-label', `Preview ${option.title}`);
      play.innerHTML = playIconMarkup;
      play.addEventListener('click', async (event) => {
        event.stopPropagation();

        if (onPreview) {
          await onPreview(option.title, play);
        }
      });
      controls.append(play);
    }

    const check = document.createElement('span');
    check.className = 'playground-settings__setting-check';
    check.setAttribute('aria-hidden', 'true');
    check.innerHTML =
      '<img class="playground-settings__setting-check-icon" src="./assets/icons/tabler_check-filled.svg" alt="">';

    controls.append(check);
    optionElement.append(label, controls);

    if (option.title === selectedValue) {
      optionElement.classList.add('playground-settings__setting-option--selected');
    }

    optionElement.addEventListener('click', () => {
      onSelect(option.title);
    });

    return optionElement;
  }

  function updateSettingOptions(options, selectedValue) {
    options.querySelectorAll('.playground-settings__setting-option').forEach((option) => {
      const isSelected = option.dataset.value === selectedValue;

      option.classList.toggle('playground-settings__setting-option--selected', isSelected);
      option.setAttribute('aria-pressed', String(isSelected));
    });
  }

  function createSettingGroup(label, value, options, settings, settingKey, canPreview = true) {
    const group = document.createElement('div');
    group.className = 'playground-settings__group';
    let selectedValue = value;

    const header = document.createElement('div');
    header.className = 'playground-settings__group-header';

    const title = document.createElement('h2');
    title.className = 'playground-settings__label';
    title.textContent = label;

    const changeButton = document.createElement('button');
    changeButton.className = 'playground-settings__change';
    changeButton.type = 'button';
    changeButton.textContent = 'Change';

    const control = document.createElement('button');
    control.className = 'playground-settings__control';
    control.type = 'button';

    const controlValue = document.createElement('span');
    controlValue.className = 'playground-settings__control-value';
    controlValue.textContent = selectedValue;
    control.append(controlValue);

    if (canPreview) {
      const controlPlay = document.createElement('button');
      controlPlay.className = 'playground-settings__play';
      controlPlay.type = 'button';
      controlPlay.setAttribute('aria-label', `Preview ${selectedValue}`);
      controlPlay.innerHTML = playIconMarkup;
      controlPlay.addEventListener('click', async (event) => {
        event.stopPropagation();

        if (settingKey === 'voice') {
          await playVoicePreview(selectedValue, controlPlay);
        }

        if (settingKey === 'music') {
          await playMusicPreview(selectedValue, controlPlay);
        }
      });
      control.append(controlPlay);
    }

    const settingOptions = document.createElement('div');
    settingOptions.className = 'playground-settings__setting-options';
    settingOptions.hidden = true;

    function selectValue(nextValue) {
      selectedValue = nextValue;
      settings[settingKey] = nextValue;
      saveInitialMantraSettings(settings);
      control.querySelector('.playground-settings__control-value').textContent = nextValue;
      control.querySelector('.playground-settings__play')?.setAttribute('aria-label', `Preview ${nextValue}`);
      updateSettingOptions(settingOptions, nextValue);
    }

    options.forEach((option) => {
      settingOptions.append(
        createSettingOption(
          option,
          selectedValue,
          selectValue,
          canPreview,
          settingKey === 'voice'
            ? playVoicePreview
            : settingKey === 'music'
              ? playMusicPreview
              : null,
        ),
      );
    });

    changeButton.addEventListener('click', () => {
      const isEditing = settingOptions.hidden;

      settingOptions.hidden = !isEditing;
      control.hidden = isEditing;
      changeButton.textContent = isEditing ? 'Done' : 'Change';
      changeButton.classList.toggle('playground-settings__change--active', isEditing);
    });

    header.append(title, changeButton);
    group.append(header, control, settingOptions);

    return {
      element: group,
      getValue() {
        return selectedValue;
      },
      setValue(nextValue) {
        selectValue(getMatchingOptionTitle(options, nextValue));
      },
    };
  }

  function createSelectedKeywordChip(label, selectedKeywords, chips, emptyState, settings, keywordOptions) {
    const chip = createKeywordChip(label, () => {
      selectedKeywords.delete(label);
      settings.keywords = Array.from(selectedKeywords);
      saveInitialMantraSettings(settings);
      updateKeywordsEmptyState(chips, emptyState);
      updateKeywordOptions(keywordOptions, selectedKeywords);
    });

    chip.dataset.chip = label;

    return chip;
  }

  function getMatchingOptionTitle(options, value, fallbackIndex = 0) {
    const match = options.find((option) => option.title.toLowerCase() === value?.toLowerCase());

    return match?.title || options[fallbackIndex].title;
  }

  function normalizeKeywordLabels(keywords, keywordLabels) {
    return keywords
      .map((keyword) => keywordLabels.find((label) => label.toLowerCase() === keyword.toLowerCase()))
      .filter(Boolean);
  }

  function createAudioCard(entry) {
    const card = document.createElement('article');
    card.className = 'playground-audio';

    const header = document.createElement('div');
    header.className = 'playground-audio__header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'playground-audio__title-wrap';

    const thumbnail = document.createElement('img');
    thumbnail.className = 'playground-audio__thumbnail';
    thumbnail.src = flowerThumbnailSrc;
    thumbnail.alt = '';
    thumbnail.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h2');
    title.className = 'playground-audio__title';
    title.textContent = entry.title;

    const download = document.createElement('a');
    download.className = 'playground-audio__download';
    download.href = entry.audioUrl;
    download.download = createDownloadName(entry.title, entry.audioExtension || 'wav');
    download.setAttribute('aria-label', `Download ${entry.title}`);
    download.innerHTML = [
      '<svg class="playground-audio__download-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">',
      '<path d="M7 1.5V9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      '<path d="M3.5 6.2L7 9.7L10.5 6.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      '<path d="M2.5 12.5H11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      '</svg>',
    ].join('');

    titleWrap.append(thumbnail, title);
    header.append(titleWrap, download);

    const audio = document.createElement('audio');
    audio.className = 'playground-audio__player';
    audio.src = entry.audioUrl;
    audio.controls = true;
    audio.preload = 'metadata';
    audio.currentTime = entry.playback.currentTime;

    audio.addEventListener('timeupdate', () => {
      entry.playback.currentTime = audio.currentTime;
    });

    audio.addEventListener('play', () => {
      entry.playback.isPlaying = true;
    });

    audio.addEventListener('pause', () => {
      entry.playback.isPlaying = false;
    });

    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = Math.min(entry.playback.currentTime, audio.duration || entry.playback.currentTime);

      if (entry.playback.isPlaying) {
        audio.play().catch(() => {
          entry.playback.isPlaying = false;
        });
      }
    });

    card.append(header, audio);

    return card;
  }

  function createAudioLoadingCard() {
    const card = document.createElement('article');
    card.className = 'playground-audio playground-audio--loading';
    card.setAttribute('aria-live', 'polite');

    const header = document.createElement('div');
    header.className = 'playground-audio__header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'playground-audio__title-wrap';

    const thumbnail = document.createElement('video');
    thumbnail.className = 'playground-audio__thumbnail playground-audio__thumbnail--video';
    thumbnail.src = flowerLoadingVideoSrc;
    thumbnail.autoplay = true;
    thumbnail.loop = true;
    thumbnail.muted = true;
    thumbnail.playsInline = true;
    thumbnail.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h2');
    title.className = 'playground-audio__title';
    title.textContent = 'Creating your mantra';

    titleWrap.append(thumbnail, title);
    header.append(titleWrap);
    card.append(header);

    return card;
  }

  function createLibraryButton(entry, onSelect) {
    const button = document.createElement('button');
    button.className = 'playground-library__item';
    button.type = 'button';
    button.dataset.entryId = entry.id;
    button.setAttribute('aria-label', `Open ${entry.title}`);
    button.setAttribute('aria-pressed', 'false');

    const image = document.createElement('img');
    image.className = 'playground-library__thumbnail';
    image.src = flowerThumbnailSrc;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');

    button.append(image);
    button.addEventListener('click', () => {
      onSelect(entry.id);
    });

    return button;
  }

  function createSettingsSidebar(workspace, prompt) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'playground-settings';
    sidebar.setAttribute('aria-label', 'Generation settings');

    const settings = getInitialMantraSettings();
    const keywordLabels = MANTRA_KEYWORD_GROUPS.flatMap((group) => group.options);
    const selectedKeywords = new Set(normalizeKeywordLabels(settings.keywords, keywordLabels));
    settings.keywords = Array.from(selectedKeywords);
    settings.voice = getMatchingOptionTitle(MANTRA_VOICE_OPTIONS, settings.voice);
    settings.music = getMatchingOptionTitle(MANTRA_MUSIC_OPTIONS, settings.music);
    settings.length = getMatchingOptionTitle(MANTRA_LENGTH_OPTIONS, settings.length, 1);
    saveInitialMantraSettings(settings);

    const content = document.createElement('div');
    content.className = 'playground-settings__content';

    const main = document.createElement('div');
    main.className = 'playground-settings__main';

    const library = document.createElement('div');
    library.className = 'playground-library';
    library.setAttribute('aria-label', 'Mantra library');

    const audioSlot = document.createElement('div');
    audioSlot.className = 'playground-settings__audio-slot';

    const mantraEntries = [];
    let selectedEntryId = null;
    let generationCount = 0;

    const keywords = document.createElement('section');
    keywords.className = 'playground-settings__group';

    const keywordsHeader = document.createElement('div');
    keywordsHeader.className = 'playground-settings__group-header';

    const keywordsTitle = document.createElement('h2');
    keywordsTitle.className = 'playground-settings__label';
    keywordsTitle.textContent = 'Keywords';

    const keywordsChangeButton = document.createElement('button');
    keywordsChangeButton.className = 'playground-settings__change';
    keywordsChangeButton.type = 'button';
    keywordsChangeButton.textContent = 'Change';

    keywordsHeader.append(keywordsTitle, keywordsChangeButton);

    const chips = document.createElement('div');
    chips.className = 'playground-settings__chips';

    const keywordOptions = document.createElement('div');
    keywordOptions.className = 'playground-settings__keyword-options';
    keywordOptions.hidden = true;

    const emptyState = document.createElement('div');
    emptyState.className = 'playground-settings__empty';
    emptyState.hidden = true;

    const emptyText = document.createElement('p');
    emptyText.className = 'playground-settings__empty-text';
    emptyText.textContent = 'No keywords selected';

    emptyState.append(emptyText);

    selectedKeywords.forEach((label) => {
      chips.append(
        createSelectedKeywordChip(label, selectedKeywords, chips, emptyState, settings, keywordOptions),
      );
    });

    keywordLabels.forEach((label) => {
      keywordOptions.append(
        createKeywordOption(label, selectedKeywords, chips, emptyState, settings, keywordOptions),
      );
    });

    updateKeywordsEmptyState(chips, emptyState);
    updateKeywordOptions(keywordOptions, selectedKeywords);

    function renderKeywords(nextKeywords) {
      selectedKeywords.clear();
      chips.replaceChildren();

      normalizeKeywordLabels(nextKeywords, keywordLabels).forEach((label) => {
        selectedKeywords.add(label);
        chips.append(
          createSelectedKeywordChip(label, selectedKeywords, chips, emptyState, settings, keywordOptions),
        );
      });

      settings.keywords = Array.from(selectedKeywords);
      saveInitialMantraSettings(settings);
      updateKeywordsEmptyState(chips, emptyState);
      updateKeywordOptions(keywordOptions, selectedKeywords);
    }

    keywordsChangeButton.addEventListener('click', () => {
      const isEditing = keywordOptions.hidden;

      keywordOptions.hidden = !isEditing;
      keywordsChangeButton.textContent = isEditing ? 'Done' : 'Change';
      keywordsChangeButton.classList.toggle('playground-settings__change--active', isEditing);
    });

    keywords.append(keywordsHeader, emptyState, chips, keywordOptions);

    const voiceGroup = createSettingGroup(
      'Voice',
      settings.voice,
      MANTRA_VOICE_OPTIONS,
      settings,
      'voice',
    );
    const musicGroup = createSettingGroup(
      'Music',
      settings.music,
      MANTRA_MUSIC_OPTIONS,
      settings,
      'music',
    );
    const lengthGroup = createSettingGroup(
      'Length',
      settings.length,
      MANTRA_LENGTH_OPTIONS,
      settings,
      'length',
      false,
    );

    const generateButton = document.createElement('button');
    generateButton.className = 'playground-settings__generate';
    generateButton.type = 'button';
    generateButton.textContent = 'Generate';

    function renderLibrary() {
      library.replaceChildren();

      if (mantraEntries.length <= 1) {
        return;
      }

      library.append(...mantraEntries.map((entry) => createLibraryButton(entry, selectEntry)));

      library.querySelectorAll('.playground-library__item').forEach((item) => {
        item.setAttribute('aria-pressed', String(item.dataset.entryId === selectedEntryId));
      });
    }

    function renderAudio(entry) {
      audioSlot.replaceChildren();

      if (entry) {
        audioSlot.append(createAudioCard(entry));
      }
    }

    function selectEntry(entryId) {
      const entry = mantraEntries.find((item) => item.id === entryId);

      if (!entry) {
        return;
      }

      selectedEntryId = entry.id;
      workspace.setText(entry.mantraText);
      renderKeywords(entry.settings.keywords);
      voiceGroup.setValue(entry.settings.voice);
      musicGroup.setValue(entry.settings.music);
      lengthGroup.setValue(entry.settings.length);
      renderAudio(entry);
      renderLibrary();
      generateButton.textContent = 'Regenerate';
    }

    generateButton.addEventListener('click', async () => {
      const previousLabel = generationCount === 0 ? 'Generate' : 'Regenerate';
      const baseTitle = createMantraTitle(prompt);
      const title = generationCount === 0 ? baseTitle : `${baseTitle} #${generationCount}`;

      generateButton.textContent = 'Generating voice…';
      generateButton.disabled = true;
      audioSlot.replaceChildren(createAudioLoadingCard());

      try {
        const entrySettings = {
          keywords: Array.from(selectedKeywords),
          voice: voiceGroup.getValue(),
          music: musicGroup.getValue(),
          length: lengthGroup.getValue(),
        };
        const mantraText = workspace.getText();

        generateButton.textContent = 'Mixing music…';

        const audioResult = await createMixedMantraAudioBlob(mantraText, entrySettings);
        const audioUrl = URL.createObjectURL(audioResult.blob);
        const entry = {
          id: `mantra-${Date.now()}-${generationCount}`,
          title,
          mantraText,
          settings: entrySettings,
          audioUrl,
          audioExtension: audioResult.extension,
          playback: {
            currentTime: 0,
            isPlaying: false,
          },
        };

        mantraEntries.unshift(entry);
        generationCount += 1;
        selectedEntryId = entry.id;
        renderAudio(entry);
        renderLibrary();
        generateButton.textContent = 'Regenerate';
        generateButton.disabled = false;
      } catch (error) {
        renderAudio(mantraEntries.find((item) => item.id === selectedEntryId));
        generateButton.textContent = error instanceof Error ? error.message : 'Audio failed';

        window.setTimeout(() => {
          generateButton.textContent = previousLabel;
          generateButton.disabled = false;
        }, 2200);
      }
    });

    content.append(
      keywords,
      voiceGroup.element,
      musicGroup.element,
      lengthGroup.element,
      audioSlot,
    );
    main.append(content, generateButton);
    sidebar.append(main, library);

    return sidebar;
  }

  function mountPlayground(target = document.body) {
    if (document.getElementById(rootId)) {
      return;
    }

    const playground = document.createElement('section');
    playground.id = rootId;
    playground.className = 'playground';

    const prompt = getInitialMantraContext();
    const workspace = createWorkspace(createInitialMantra(prompt));

    playground.append(
      createChatSidebar(prompt, workspace.refine, getInitialMantraSettings),
      workspace.element,
      createSettingsSidebar(workspace, prompt),
    );
    target.append(playground);
  }

  global.Playground = {
    mountPlayground,
  };
})(window);
