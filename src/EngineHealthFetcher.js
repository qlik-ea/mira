const defaultHttp = require('http');
const logger = require('./logger/Logger').get();

/**
 * Class providing the ability to fetch health-check status from an engine.
 */
class EngineHealthFetcher {
  /**
   * Creates new {@link EngineHealthFetcher} object.
   * @param {object} http - HTTP client to use. Interface must comply with standard Node.js http module.
   */
  constructor(http) {
    this.http = http || defaultHttp;
  }

  /**
   * Fetches health-check status from engine.
   * @param {string} host - The host name of the engine.
   * @param {string} port - The port of the engine.
   * @param {string} path - The endpoint path to the engine health-check (e.g. '/healthcheck').
   * @returns {Promise<object>} Promise to engine health status as JSON. Rejected if failing to retrieve engine health.
   * @example
   * // Fetch engine health from 'http://localhost:9076/healthcheck'
   * await healthFetcher.fetch('localhost', 9076, '/healthcheck');
   */
  fetch(host, port, path) {
    return new Promise((resolve, reject) => {
      if (!host) { reject('No host defined'); }
      if (!port) { reject('No port defined'); }

      this.http.get({ host, port, path }, (response) => {
        let body = '';
        response.on('data', (d) => {
          body += d;
        });
        response.on('error', (d) => {
          response.resume();
          logger.debug(`Engine health check got HTTP error response: ${d}`);
          reject(d);
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', (d) => {
        logger.debug(`Engine health check got HTTP error response: ${d}`);
        reject(d);
      });
    });
  }
}

module.exports = EngineHealthFetcher;
