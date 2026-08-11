import { createHash, randomBytes } from 'node:crypto';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const EMAIL_LOGO_PATH = '/email/aystra-email-logo.png';
const EMAIL_HERO_PATH = '/email/aystra-launch-2026.png';

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

function sendHtml(response, statusCode, html) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(html);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createEmailHash(email) {
  return createHash('sha256').update(email).digest('hex');
}

function createToken() {
  return randomBytes(32).toString('base64url');
}

function createTokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function getRequestOrigin(request) {
  const protocol = request.headers['x-forwarded-proto'] || 'http';
  const host = request.headers['x-forwarded-host'] || request.headers.host;

  return host ? `${protocol}://${host}` : '';
}

function createPublicAssetUrl(env, publicBaseUrl, assetPath) {
  const vercelBaseUrl = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  const baseUrl =
    env.WAITLIST_PUBLIC_BASE_URL ||
    (vercelBaseUrl ? `https://${vercelBaseUrl}` : '') ||
    publicBaseUrl;

  return baseUrl ? new URL(assetPath, baseUrl).toString() : assetPath;
}

function createFirestoreFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      typeof value === 'boolean' ? { booleanValue: value } : { stringValue: String(value) },
    ]),
  );
}

function getFirestoreConfig(env) {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
  };
}

async function createWaitlistEntry(env, entry) {
  const { apiKey, projectId } = getFirestoreConfig(env);

  if (!apiKey || !projectId) {
    return {
      ok: false,
      status: 503,
      code: 'storage_not_configured',
      error: 'Firebase waitlist storage is not configured.',
    };
  }

  const firestoreUrl = new URL(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/waitlist`,
  );
  firestoreUrl.searchParams.set('documentId', entry.emailHash);
  firestoreUrl.searchParams.set('key', apiKey);

  const firestoreResponse = await fetch(firestoreUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: createFirestoreFields({
        email: entry.email,
        emailNormalized: entry.emailNormalized,
        emailHash: entry.emailHash,
        source: entry.source,
        status: 'joined',
        confirmationEmailStatus: 'pending_provider',
        inviteEmailStatus: 'not_sent',
        unsubscribeTokenHash: entry.unsubscribeTokenHash,
        createdAtIso: entry.createdAtIso,
      }),
    }),
  });

  if (firestoreResponse.status === 409) {
    return {
      ok: true,
      duplicate: true,
    };
  }

  if (!firestoreResponse.ok) {
    const error = await firestoreResponse.json().catch(() => ({}));

    return {
      ok: false,
      status: firestoreResponse.status,
      code: 'storage_failed',
      error: error?.error?.message || 'Failed to save waitlist entry.',
    };
  }

  return {
    ok: true,
    duplicate: false,
  };
}

async function unsubscribeWaitlistEntry(env, { emailHash, tokenHash, unsubscribedAtIso }) {
  const { apiKey, projectId } = getFirestoreConfig(env);

  if (!apiKey || !projectId) {
    return {
      ok: false,
      status: 503,
      code: 'storage_not_configured',
      error: 'Firebase waitlist storage is not configured.',
    };
  }

  const firestoreUrl = new URL(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/waitlist/${emailHash}`,
  );
  firestoreUrl.searchParams.set('key', apiKey);
  firestoreUrl.searchParams.append('updateMask.fieldPaths', 'status');
  firestoreUrl.searchParams.append('updateMask.fieldPaths', 'unsubscribedAtIso');
  firestoreUrl.searchParams.append('updateMask.fieldPaths', 'unsubscribeConfirmedWith');

  const firestoreResponse = await fetch(firestoreUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: createFirestoreFields({
        status: 'unsubscribed',
        unsubscribedAtIso,
        unsubscribeConfirmedWith: tokenHash,
      }),
    }),
  });

  if (!firestoreResponse.ok) {
    const error = await firestoreResponse.json().catch(() => ({}));

    return {
      ok: false,
      status: firestoreResponse.status,
      code: 'unsubscribe_failed',
      error: error?.error?.message || 'Failed to unsubscribe.',
    };
  }

  return {
    ok: true,
  };
}

function createWaitlistConfirmationText() {
  return [
    'You are on the Aystra waitlist',
    '',
    'Thank you for being here from the very beginning.',
    '',
    "We'll let you know when Aystra is ready. Until then, here's something we often remind ourselves: the way you speak to yourself shapes the way you see the world.",
    '',
    "The photo above was taken on Kukul Polonyna in the Ukrainian Carpathians. Among thousands of purple crocuses, one white flower bloomed differently. We kept this photo because it reminds us that there's beauty in growing your own way. Take care of yourself.",
    '',
    'See you soon,',
    'Aystra',
  ].join('\n');
}

function createWaitlistConfirmationHtml(env, publicBaseUrl = '') {
  const heroUrl =
    env.WAITLIST_EMAIL_HERO_URL || createPublicAssetUrl(env, publicBaseUrl, EMAIL_HERO_PATH);
  const logoUrl =
    env.WAITLIST_EMAIL_LOGO_URL || createPublicAssetUrl(env, publicBaseUrl, EMAIL_LOGO_PATH);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>You are on the Aystra waitlist</title>
    <style>
      :root {
        color-scheme: dark;
        supported-color-schemes: dark;
      }

      .email-bg {
        background: #28235f !important;
        background-color: #28235f !important;
        background-image: linear-gradient(#28235f, #28235f) !important;
      }

      .email-copy {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        text-shadow: 0 0 0 #ffffff !important;
      }

      .email-copy a,
      .email-copy span,
      .email-copy p,
      .email-copy h1 {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        text-shadow: 0 0 0 #ffffff !important;
      }

      @media only screen and (max-width: 600px) {
        .email-page {
          padding: 0 !important;
        }

        .email-shell {
          width: 100% !important;
          max-width: 100% !important;
        }

        .email-logo-cell {
          padding: 32px 24px 20px !important;
        }

        .email-text-cell {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }

        .email-footer-cell {
          padding-bottom: 40px !important;
        }

        .email-hero-cell {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        .email-hero {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
        }
      }
    </style>
  </head>
  <body class="email-bg email-copy" bgcolor="#28235f" style="margin:0;padding:0;background:#28235f;background-color:#28235f;background-image:linear-gradient(#28235f,#28235f);color:#ffffff;-webkit-text-fill-color:#ffffff;text-shadow:0 0 0 #ffffff;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      You are on the Aystra waitlist. We'll notify you when Aystra becomes available.
    </div>
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
    <table class="email-bg" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#28235f" style="width:100%;border-collapse:collapse;background:#28235f;background-color:#28235f;background-image:linear-gradient(#28235f,#28235f);">
      <tr>
        <td class="email-page email-bg" align="center" bgcolor="#28235f" style="padding:40px 0;background:#28235f;background-color:#28235f;background-image:linear-gradient(#28235f,#28235f);">
          <table class="email-shell email-bg email-copy" role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" bgcolor="#28235f" style="width:680px;max-width:100%;border-collapse:collapse;background:#28235f;background-color:#28235f;background-image:linear-gradient(#28235f,#28235f);color:#ffffff;-webkit-text-fill-color:#ffffff;text-shadow:0 0 0 #ffffff;">
            <tr>
              <td class="email-logo-cell email-bg email-copy" align="left" bgcolor="#28235f" style="padding:8px 72px 24px;background:#28235f;background-color:#28235f;background-image:linear-gradient(#28235f,#28235f);color:#ffffff;-webkit-text-fill-color:#ffffff;text-shadow:0 0 0 #ffffff;">
                <img src="${logoUrl}" width="102" height="40" alt="Aystra" style="display:block;width:102px;height:auto;border:0;outline:none;text-decoration:none;">
              </td>
            </tr>

            <tr>
              <td class="email-text-cell email-bg email-copy" bgcolor="#28235f" style="padding:24px 72px 40px;background:#28235f;background-color:#28235f;background-image:linear-gradient(#28235f,#28235f);font-family:Helvetica Neue, Helvetica, Arial, sans-serif;color:#ffffff;-webkit-text-fill-color:#ffffff;text-shadow:0 0 0 #ffffff;mso-line-height-rule:exactly;">
                <h1 class="email-copy" style="margin:0 0 16px;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:26px;line-height:32.5px;font-weight:700;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;text-shadow:0 0 0 #ffffff !important;mso-line-height-rule:exactly;">
                  You are on the Aystra waitlist
                </h1>

                <p class="email-copy" style="margin:0 0 24px;font-size:16px;line-height:24px;font-weight:400;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;text-shadow:0 0 0 #ffffff !important;">
                  Thank you for being here from the very beginning.
                </p>

                <p class="email-copy" style="margin:0;font-size:16px;line-height:24px;font-weight:400;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;text-shadow:0 0 0 #ffffff !important;">
                  We'll let you know when Aystra is ready. Until then, here's something we often remind ourselves: <span class="email-copy" style="color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;text-shadow:0 0 0 #ffffff !important;text-decoration:underline;">the way you speak to yourself shapes the way you see the world.</span>
                </p>
              </td>
            </tr>

            <tr>
              <td class="email-hero-cell email-bg" bgcolor="#28235f" style="padding:0 72px;background:#28235f;background-color:#28235f;background-image:linear-gradient(#28235f,#28235f);">
                <img class="email-hero" src="${heroUrl}" width="536" height="268" alt="White crocus blooming among purple crocuses in the Ukrainian Carpathians." style="display:block;width:100%;max-width:536px;height:auto;margin:0;border:0;outline:none;text-decoration:none;">
              </td>
            </tr>

            <tr>
              <td class="email-text-cell email-footer-cell email-bg email-copy" bgcolor="#28235f" style="padding:40px 72px 0;background:#28235f;background-color:#28235f;background-image:linear-gradient(#28235f,#28235f);font-family:Helvetica Neue, Helvetica, Arial, sans-serif;color:#ffffff;-webkit-text-fill-color:#ffffff;text-shadow:0 0 0 #ffffff;mso-line-height-rule:exactly;">
                <p class="email-copy" style="margin:0 0 24px;font-size:16px;line-height:24px;font-weight:400;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;text-shadow:0 0 0 #ffffff !important;">
                  The photo above was taken on Kukul Polonyna in the Ukrainian Carpathians. Among thousands of purple crocuses, one white flower bloomed differently. We kept this photo because it reminds us that there's beauty in growing your own way. Take care of yourself.
                </p>

                <p class="email-copy" style="margin:0 0 0;font-size:16px;line-height:24px;font-weight:400;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;text-shadow:0 0 0 #ffffff !important;">
                  See you soon,<br>
                  Aystra
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function createConfirmationEmail(env, email, publicBaseUrl) {
  return {
    to: [email],
    subject: 'Welcome to the Aystra waitlist',
    text: createWaitlistConfirmationText(),
    html: createWaitlistConfirmationHtml(env, publicBaseUrl),
  };
}

async function sendConfirmationEmail(env, entry, publicBaseUrl) {
  if (!env.RESEND_API_KEY || !env.WAITLIST_FROM_EMAIL) {
    return {
      ok: false,
      status: 503,
      code: 'email_not_configured',
      error: 'Waitlist email provider is not configured.',
    };
  }

  const idempotencyKey = `waitlist-confirmation-${entry.emailHash}-${entry.createdAtIso}`;
  const confirmationEmail = createConfirmationEmail(env, entry.emailNormalized, publicBaseUrl);
  const resendResponse = await fetch(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'User-Agent': 'Aystra Waitlist/1.0',
    },
    body: JSON.stringify({
      from: env.WAITLIST_FROM_EMAIL,
      reply_to: env.WAITLIST_REPLY_TO || env.WAITLIST_FROM_EMAIL,
      headers: {
        'X-Entity-Ref-ID': idempotencyKey,
      },
      ...confirmationEmail,
    }),
  });

  if (!resendResponse.ok) {
    const error = await resendResponse.json().catch(() => ({}));

    return {
      ok: false,
      status: resendResponse.status,
      code: 'email_failed',
      error: error?.message || error?.error || 'Failed to send confirmation email.',
    };
  }

  return {
    ok: true,
  };
}

export function createWaitlistMiddleware(env = process.env) {
  return async function waitlistMiddleware(request, response, next) {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const publicBaseUrl = getRequestOrigin(request);

    if (requestUrl.pathname === '/api/waitlist-email-preview' && request.method === 'GET') {
      sendHtml(response, 200, createWaitlistConfirmationHtml(env, publicBaseUrl));
      return;
    }

    if (requestUrl.pathname === '/api/waitlist-unsubscribe' && request.method === 'GET') {
      const emailHash = requestUrl.searchParams.get('emailHash') || '';
      const token = requestUrl.searchParams.get('token') || '';

      if (!emailHash || !token) {
        sendHtml(
          response,
          400,
          '<!doctype html><html><body style="font-family:Arial,sans-serif;padding:40px;"><h1>Invalid unsubscribe link</h1><p>This unsubscribe link is missing required information.</p></body></html>',
        );
        return;
      }

      const unsubscribeResult = await unsubscribeWaitlistEntry(env, {
        emailHash,
        tokenHash: createTokenHash(token),
        unsubscribedAtIso: new Date().toISOString(),
      });

      if (!unsubscribeResult.ok) {
        sendHtml(
          response,
          unsubscribeResult.status,
          '<!doctype html><html><body style="font-family:Arial,sans-serif;padding:40px;"><h1>Could not unsubscribe</h1><p>Please try again later.</p></body></html>',
        );
        return;
      }

      sendHtml(
        response,
        200,
        '<!doctype html><html><body style="margin:0;background:#28235f;color:#fff;font-family:Helvetica Neue,Arial,sans-serif;"><main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px;text-align:center;"><div><h1 style="font-size:32px;line-height:40px;margin:0 0 12px;">You have been unsubscribed</h1><p style="font-size:16px;line-height:24px;margin:0;color:rgba(255,255,255,.8);">You will no longer receive Aystra waitlist emails.</p></div></main></body></html>',
      );
      return;
    }

    if (requestUrl.pathname !== '/api/join-waitlist' || request.method !== 'POST') {
      next();
      return;
    }

    try {
      const body = await readRequestBody(request);
      const payload = JSON.parse(body || '{}');
      const trap = typeof payload.trap === 'string' ? payload.trap.trim() : '';

      if (trap) {
        sendJson(response, 200, {
          status: 'accepted',
          confirmationEmailStatus: 'not_sent',
        });
        return;
      }

      const email = typeof payload.email === 'string' ? payload.email.trim() : '';
      const emailNormalized = normalizeEmail(email);

      if (!isValidEmail(emailNormalized)) {
        sendJson(response, 400, {
          status: 'invalid_email',
          error: 'Use a valid email address.',
        });
        return;
      }

      const entry = {
        email,
        emailNormalized,
        emailHash: createEmailHash(emailNormalized),
        createdAtIso: new Date().toISOString(),
        unsubscribeToken: createToken(),
        source:
          typeof payload.source === 'string' && payload.source.trim()
            ? payload.source.trim()
            : 'waitlist-landing',
      };
      entry.unsubscribeTokenHash = createTokenHash(entry.unsubscribeToken);
      const storageResult = await createWaitlistEntry(env, entry);

      if (!storageResult.ok) {
        sendJson(response, storageResult.status, {
          status: storageResult.code,
          error: storageResult.error,
        });
        return;
      }

      if (storageResult.duplicate) {
        sendJson(response, 200, {
          status: 'already_joined',
          confirmationEmailStatus: 'not_sent',
        });
        return;
      }

      const emailResult = await sendConfirmationEmail(env, entry, publicBaseUrl);

      sendJson(response, 200, {
        status: 'joined',
        confirmationEmailStatus: emailResult.ok ? 'sent' : emailResult.code,
      });
    } catch (error) {
      sendJson(response, 500, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to join waitlist.',
      });
    }
  };
}
