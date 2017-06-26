const logger = require('./logger/Logger').get();
const EngineHealthFetcher = require('./EngineHealthFetcher');
const JSONUtils = require('./utils/JSONUtils');

/**
 * Helper for periodical health checking.
 */
async function checkHealth(entry, healthFetcher, ms) {
  /* eslint-disable no-param-reassign */
  try {
    const health = await healthFetcher.fetch(entry.ipAddress, entry.port, '/healthcheck');
    JSONUtils.flatten(health, entry.properties);
    entry.properties.healthy = true;
  } catch (err) {
    logger.error(`Engine health check failed on ${entry.ipAddress}:${entry.port}`, err);
    entry.properties.healthy = false;
  }
  entry.fetcherTimeOutId = setTimeout(checkHealth, ms, entry, healthFetcher, ms);
  /* eslint-enable no-param-reassign */
}

/**
 * Engine entry class definition.
 * @prop {object} properties - Properties of the engine instance.
 * @prop {string} ipAddress - The IP address of the engine.
 * @prop {number} port - The port of the engine.
 * @prop {number} refreshRate - The health check refresh rate in milliseconds.
 * @prop {EngineHealthFetcher} healthFetcher - The health fetcher to use. Optional and mainly used for testing;
 *                                             if not supplied, a default implementation will be used.
 */
class EngineEntry {
  /**
   * Creates new {@link EngineEntry} object.
   * @param {object} properties - Properties of the engine instance.
   * @param {string} ipAddress - The IP address of the engine.
   * @param {number} port - The port of the engine.
   * @param {number} refreshRate - The health check refresh rate in milliseconds.
   * @param {EngineHealthFetcher} healthFetcher - The helth fetcher to use. Optional and mainly used for testing;
   *                                              if not supplied, a default implementation will be used.
   */
  constructor(properties, ipAddress, port, refreshRate, healthFetcher) {
    this.properties = properties;
    this.ipAddress = ipAddress;
    this.port = port;
    this.refreshRate = refreshRate;
    this.healthFetcher = healthFetcher || new EngineHealthFetcher();
  }

  /**
   * Starts periodical health checking.
   */
  startHealthChecks() {
    this.stopHealthChecks();
    checkHealth(this, this.healthFetcher, this.refreshRate);
  }

  /**
   * Stops periodical health checking.
   */
  stopHealthChecks() {
    clearTimeout(this.fetcherTimeOutId);
  }

  /**
   * Checks if the properties of the engine {@link EngineEntry#properties} satisfies the property
   * constraints given by the parameter.
   * @param {object} constraints - Property constraints checked.
   * @returns {boolean} True, if the constraints are satisfied.
   */
  satisfies(constraints) {
    // eslint-disable-next-line no-restricted-syntax
    for (const key in constraints) {
      const actual = constraints[key];
      const expected = this.properties[key];

      if (Array.isArray(actual)) {
        if (actual.indexOf(expected) === -1) {
          return false;
        }
      } else if (typeof actual === 'boolean' || typeof expected === 'boolean') {
        return actual.toString().toLowerCase() === expected.toString().toLowerCase();
      } else if (expected.indexOf('>') === 0 && !isNaN(expected.substring(1))) {
        const expectedNumber = expected.substring(1);
        if (actual <= expectedNumber) {
          return false;
        }
      } else if (expected.indexOf('<') === 0 && !isNaN(expected.substring(1))) {
        const expectedNumber = expected.substring(1);
        if (actual >= expectedNumber) {
          return false;
        }
        // eslint-disable-next-line eqeqeq
      } else if (expected != actual) {
        return false;
      }
    }
    return true;
  }
}

module.exports = EngineEntry;
