// Swagger definition
module.exports = {
  info: {
    title: 'A Qlik Associative Engine discovery service',
    version: '0.1.2',
    description: 'REST API for discovering Qlik Associative Engines running in Docker containers.',
  },
  host: 'localhost:9100',
  schemes: ['http'],
  basePath: '/v1',
  'x-qlik-visibility': 'private',
  'x-qlik-stability': 'experimental',
};
