/* eslint-disable no-unused-expressions */
const EngineEntry = require('../../src/EngineEntry');
const EngineHealthFetcher = require('../../src/EngineHealthFetcher');
const sleep = require('../test-utils/sleep');

describe('EngineEntry', () => {
  let entry;
  let healthFetcher;
  let fetchStub;

  beforeEach(() => {
    entry = new EngineEntry({ a: 'foo', b: 'bar' }, '10.10.10.10', 9999);
    healthFetcher = new EngineHealthFetcher({ get: () => { } });
    fetchStub = sinon.stub(healthFetcher, 'fetch');
  });

  describe('#constructor()', () => {
    it('should construct with arguments', () => {
      expect(entry.properties).to.deep.equal({ a: 'foo', b: 'bar' });
      expect(entry.ipAddress).to.equal('10.10.10.10');
      expect(entry.port).to.equal(9999);
    });
  });

  describe('#startHealthChecks()', () => {
    it('should fetch health periodically', async () => {
      entry.startHealthChecks(healthFetcher, 10);
      await sleep(30);  // Should make room for at least two time-outs.
      expect(fetchStub.callCount >= 2).to.be.true;
      expect(fetchStub).to.be.calledWith('10.10.10.10', 9999, '/healthcheck');
      expect(entry.properties.healthy).to.be.true;
    });

    it('should be able to fetch at different intervals', async () => {
      const ms10 = 10;
      const ms100 = 100;

      // Start fetching with short interval and count.
      entry.startHealthChecks(healthFetcher, ms10);
      await sleep(5 * ms10);
      entry.stopHealthChecks();
      const callCount1 = fetchStub.callCount;
      fetchStub.reset();

      // Start fetching with longer interval and count.
      entry.startHealthChecks(healthFetcher, ms100);
      await sleep(5 * ms100);
      entry.stopHealthChecks();
      const callCount2 = fetchStub.callCount;

      // Verify that fetching roughly adheres to used intervals.
      expect(Math.abs(callCount1 - callCount2) <= 1).to.be.true;
    });

    it('should be possible to call twice', async () => {
      entry.startHealthChecks(healthFetcher, 10);
      await sleep(100);
      const callCount1 = fetchStub.callCount;
      entry.startHealthChecks(healthFetcher, 50);
      await sleep(100);
      entry.stopHealthChecks();
      const callCount2 = fetchStub.callCount;
      expect(callCount1 < callCount2).to.be.true;
    });
  });

  describe('#stopHealthChecks()', () => {
    it('should stop fetching health', async () => {
      entry.startHealthChecks(healthFetcher, 10);
      await sleep(100);
      entry.stopHealthChecks();
      const countAfterStop1 = fetchStub.callCount;
      await sleep(100);
      const countAfterStop2 = fetchStub.callCount;
      expect(countAfterStop1).to.equal(countAfterStop2);
    });

    it('should be possible to call twice', async () => {
      entry.startHealthChecks(healthFetcher, 10);
      await sleep(100);
      entry.stopHealthChecks();
      entry.stopHealthChecks();
    });
  });

  describe('#satisfies()', () => {
    it('???', async () => {
    });

    it('???', async () => {
    });
  });
});
