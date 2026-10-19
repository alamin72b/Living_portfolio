import pino from 'pino';
export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: ['authorization', 'token', 'password', 'req.headers.authorization', 'body', 'content'],
  base: undefined,
});
