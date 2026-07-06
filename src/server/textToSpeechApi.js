const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech';
const ELEVENLABS_SPEECH_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });

    request.on('end', () => {
      resolve(body);
    });

    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function getVoiceGender(voice) {
  return voice?.toLowerCase() === 'male' ? 'male' : 'female';
}

function getProvider(env) {
  if (env.TTS_PROVIDER === 'elevenlabs' || env.TTS_PROVIDER === 'openai') {
    return env.TTS_PROVIDER;
  }

  if (env.ELEVENLABS_API_KEY) {
    return 'elevenlabs';
  }

  return 'openai';
}

async function createOpenAiSpeech({ env, text, voice }) {
  if (!env.OPENAI_API_KEY) {
    return {
      ok: false,
      status: 503,
      error: 'OPENAI_API_KEY is not configured.',
    };
  }

  const gender = getVoiceGender(voice);
  const speechVoice =
    gender === 'male'
      ? env.OPENAI_TTS_VOICE_MALE || 'onyx'
      : env.OPENAI_TTS_VOICE_FEMALE || 'coral';

  const response = await fetch(OPENAI_SPEECH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice: speechVoice,
      input: text,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    return {
      ok: false,
      status: response.status,
      error: error?.error?.message || 'OpenAI speech generation failed.',
    };
  }

  return {
    ok: true,
    audio: await response.arrayBuffer(),
  };
}

async function createElevenLabsSpeech({ env, text, voice }) {
  if (!env.ELEVENLABS_API_KEY) {
    return {
      ok: false,
      status: 503,
      error: 'ELEVENLABS_API_KEY is not configured.',
    };
  }

  const gender = getVoiceGender(voice);
  const voiceId =
    gender === 'male' ? env.ELEVENLABS_VOICE_MALE_ID : env.ELEVENLABS_VOICE_FEMALE_ID;

  if (!voiceId) {
    return {
      ok: false,
      status: 400,
      error: `ELEVENLABS_VOICE_${gender.toUpperCase()}_ID is not configured.`,
    };
  }

  const response = await fetch(
    `${ELEVENLABS_SPEECH_URL}/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    return {
      ok: false,
      status: response.status,
      error: error?.detail?.message || error?.message || 'ElevenLabs speech generation failed.',
    };
  }

  return {
    ok: true,
    audio: await response.arrayBuffer(),
  };
}

export function createTextToSpeechMiddleware(env = process.env) {
  return async function textToSpeechMiddleware(request, response, next) {
    if (request.url !== '/api/generate-speech' || request.method !== 'POST') {
      next();
      return;
    }

    try {
      const body = await readRequestBody(request);
      const payload = JSON.parse(body || '{}');
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';

      if (!text) {
        sendJson(response, 400, {
          error: 'text is required.',
        });
        return;
      }

      const result =
        getProvider(env) === 'elevenlabs'
          ? await createElevenLabsSpeech({ env, text, voice: payload.voice })
          : await createOpenAiSpeech({ env, text, voice: payload.voice });

      if (!result.ok) {
        sendJson(response, result.status, {
          error: result.error,
        });
        return;
      }

      response.statusCode = 200;
      response.setHeader('Content-Type', 'audio/mpeg');
      response.end(Buffer.from(result.audio));
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : 'Failed to generate speech.',
      });
    }
  };
}
