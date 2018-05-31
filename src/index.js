const Koa = require('koa');
const swagger = require('swagger2');
const swagger2koa = require('swagger2-koa');
const Rollbar = require('rollbar');
const path = require('path');
const logger = require('./logger/Logger').get();
const version = require('../version');
const Config = require('./Config');

Config.init();

const MetricsMiddleware = require('http-metrics-middleware');
const c2k = require('koa-connect');

const metrics = new MetricsMiddleware();
const router = require('./Routes');

metrics.initBuildInfo(version.name, version.version, version.revision, version.buildTime);
logger.info(`Mira build info: ${JSON.stringify(version)}`);
logger.info(`Mira configuration: ${JSON.stringify(Config.getConfiguration())}`);

const app = new Koa();
const document = swagger.loadDocumentSync(path.join(__dirname, './../doc/api-doc.yml'));

let killOnNextLog = false;

if (Config.rollbarToken) {
  const rollbar = new Rollbar({
    accessToken: Config.rollbarToken,
  });

  logger.on('logged', (level, message) => {
    if (Config.rollbarLevels.indexOf(level) > -1) {
      rollbar.error(message, () => {
        if (killOnNextLog) {
          process.exit(1);
        }
      });
    }
  });

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      rollbar.error(err, ctx.request);
    }
  });
} else {
  logger.on('logged', () => {
    if (killOnNextLog) {
      process.exit(1);
    }
  });
}

function onUnhandledError(err) {
  killOnNextLog = true;
  logger.error(`Process encountered an unhandled error: ${err.stack}`);
}

process.on('uncaughtException', onUnhandledError);
process.on('unhandledRejection', onUnhandledError);

app
  .use(c2k(metrics.initRoutes()))
  .use(swagger2koa.ui(document, '/openapi'))
  .use(router.routes())
  .use(router.allowedMethods());

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(Config.miraApiPort);

  process.on('SIGTERM', () => {
    server.close(() => {
      logger.info('Process exiting on SIGTERM');
      process.exit(0);
    });
  });

  logger.info(`Listening on port ${Config.miraApiPort}`);
}

module.exports = app;
