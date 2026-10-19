import { createApplication } from './app.js';
import { logger } from './common/logger.js';
const { app, config } = await createApplication();
await app.listen(config.PORT, config.HOST);
logger.info({ event: 'server.listening', host: config.HOST, port: config.PORT });
