export function normalizeWaitlistEmail(email) {
  return email.trim().toLowerCase();
}

export function isValidWaitlistEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function joinWaitlist({ email, source = 'waitlist-landing' }) {
  const normalizedEmail = normalizeWaitlistEmail(email || '');

  if (!isValidWaitlistEmail(normalizedEmail)) {
    return {
      status: 'invalid_email',
    };
  }

  const response = await fetch('/api/join-waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      source,
    }),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      status: result.status || 'failed',
      error: result.error || 'Could not join the waitlist right now.',
    };
  }

  return result;
}
