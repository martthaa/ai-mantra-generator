import { createWaitlistMiddleware } from '../src/server/waitlistApi.js';

const waitlistMiddleware = createWaitlistMiddleware(process.env);

export default async function joinWaitlist(request, response) {
  return waitlistMiddleware(request, response, () => {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ status: 'not_found' }));
  });
}
