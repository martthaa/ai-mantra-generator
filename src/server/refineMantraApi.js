const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

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

function createSystemPrompt() {
  return [
    'You are an expert mantra editor inside a wellness audio studio.',
    'Your job is to refine the current mantra text based on the user request.',
    'Preserve the existing voice, intent, and structure unless the user asks to change them.',
    'Make precise direct edits for small requests, such as changing the first sentence, last sentence, tone, length, or focus.',
    'For broad or ambiguous rewrites, return a suggestion instead of changing the current mantra immediately.',
    'Return only valid JSON with this shape:',
    '{"mode":"direct_edit|suggestion|no_change","reply":"short user-facing reply","mantra":"full updated mantra or current mantra","suggestedMantra":"full suggested mantra or empty string"}.',
    'Do not include markdown.',
  ].join('\n');
}

function normalizeRefinement(value, fallbackMantra) {
  const mode = ['direct_edit', 'suggestion', 'no_change'].includes(value?.mode)
    ? value.mode
    : 'no_change';
  const reply =
    typeof value?.reply === 'string' && value.reply.trim()
      ? value.reply.trim()
      : 'I can help refine this mantra. Tell me what you want to change.';
  const mantra =
    typeof value?.mantra === 'string' && value.mantra.trim() ? value.mantra.trim() : fallbackMantra;
  const suggestedMantra =
    typeof value?.suggestedMantra === 'string' && value.suggestedMantra.trim()
      ? value.suggestedMantra.trim()
      : '';

  return {
    mode,
    reply,
    mantra,
    suggestedMantra,
  };
}

export function createRefineMantraMiddleware(env = process.env) {
  return async function refineMantraMiddleware(request, response, next) {
    if (request.url !== '/api/refine-mantra' || request.method !== 'POST') {
      next();
      return;
    }

    const apiKey = env.OPENAI_API_KEY;

    if (!apiKey) {
      sendJson(response, 503, {
        error: 'OPENAI_API_KEY is not configured.',
      });
      return;
    }

    try {
      const body = await readRequestBody(request);
      const payload = JSON.parse(body || '{}');
      const currentMantra =
        typeof payload.currentMantra === 'string' ? payload.currentMantra.trim() : '';
      const message = typeof payload.message === 'string' ? payload.message.trim() : '';

      if (!currentMantra || !message) {
        sendJson(response, 400, {
          error: 'currentMantra and message are required.',
        });
        return;
      }

      const openaiResponse = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: createSystemPrompt(),
            },
            {
              role: 'user',
              content: JSON.stringify({
                currentMantra,
                userRequest: message,
                settings: payload.settings || {},
              }),
            },
          ],
          response_format: {
            type: 'json_object',
          },
        }),
      });

      const data = await openaiResponse.json();

      if (!openaiResponse.ok) {
        sendJson(response, openaiResponse.status, {
          error: data?.error?.message || 'OpenAI request failed.',
        });
        return;
      }

      const content = data?.choices?.[0]?.message?.content || '{}';
      const refinement = normalizeRefinement(JSON.parse(content), currentMantra);

      sendJson(response, 200, refinement);
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : 'Failed to refine mantra.',
      });
    }
  };
}
