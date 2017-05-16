const Koa = require('koa');
const Router = require('koa-router');
const logger = require('winston');
const koaLoggerWinston = require('koa-logger-winston');
const commandLineArgs = require('command-line-args');
const Config = require('./Config');
const EngineDiscovery = require('./EngineDiscovery');
const getDockerClient = require('./docker/getDockerClient');
const EngineHealthFetcher = require('./EngineHealthFetcher');
const swagger = require('swagger2');
const swagger2koa = require('swagger2-koa');
const path = require('path');

const apiVersion = 'v1';
const healthEndpoint = 'health';
const listEndpoint = 'list';
const queryEndpoint = 'query';

const options = commandLineArgs([{ name: 'mode', type: String }], { partial: true });
Config.init(options);

const app = new Koa();
const router = new Router({ prefix: `/${apiVersion}` });
const DockerClient = getDockerClient(Config.mode);
const engineDiscovery = new EngineDiscovery(DockerClient, EngineHealthFetcher);
const document = swagger.loadDocumentSync(path.join(__dirname, './../doc/api-doc.yml'));

router.get(`/${healthEndpoint}`, async (ctx) => { ctx.body = 'OK'; });

router.get(`/${listEndpoint}`, async (ctx) => {
  const result = await engineDiscovery.list();
  ctx.body = result;
});

router.get(`/${queryEndpoint}`, async (ctx) => {
  const requirements = JSON.parse(ctx.query.properties);
  const matches = await engineDiscovery.query(requirements);
  ctx.body = matches;
});

app
  .use(swagger2koa.ui(document, '/openapi'))
  .use(koaLoggerWinston(logger))
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(Config.port);

process.on('SIGTERM', () => {
  app.close(() => {
    process.exit(0);
  });
});

function unhandledException(reason) {
  logger.error(reason);
  process.exit(1);
}
process.on('uncaughtException', unhandledException);
process.on('unhandledRejection', unhandledException);


logger.info(`Listening on port ${Config.port}`);
