const EngineDiscovery = require('../../src/EngineDiscovery');
const sleep = require('../test-utils/sleep');

describe('EngineDiscovery', () => {
  let FakeDockerClient;

  beforeEach(() => {
    FakeDockerClient = { listEngines: () => { } };
  });

  describe('#constructor()', () => {
    it('should construct and start periodical discovery scans', async () => {
      const listEnginesStub = sinon.stub(FakeDockerClient, 'listEngines', () => []);
      const engineDiscovery = new EngineDiscovery(FakeDockerClient, 20, 5000);
      await sleep(50);
      expect(engineDiscovery).to.not.be.null;
      expect(engineDiscovery).to.not.be.undefined;
      expect(listEnginesStub.callCount >= 2).to.be.true;
    });
  });

  describe('#list()', () => {
    const port = 9076;
    const engine1 = { key: 'e1', engine: { ip: '10.0.0.1', port } };
    const engine2 = { key: 'e2', engine: { ip: '10.0.0.2', port } };
    const engine3 = { key: 'e3', engine: { ip: '10.0.0.3', port } };
    const engines1 = [engine1, engine2];
    const engines2 = [engine2, engine3];

    it('should list all discovered engines', async () => {
      let listEnginesStub = sinon.stub(FakeDockerClient, 'listEngines', () => engines1);
      const engineDiscovery = new EngineDiscovery(FakeDockerClient, 20, 100000);
      await sleep(50);
      let listedEngines = await engineDiscovery.list();

      expect(listedEngines.length).to.equal(2);
      let listedEngine1 = listedEngines[0];
      let listedEngine2 = listedEngines[1];
      expect(listedEngine1.engine).to.deep.equal(engine1.engine);
      expect(listedEngine2.engine).to.deep.equal(engine2.engine);

      listEnginesStub.restore();
      listEnginesStub = sinon.stub(FakeDockerClient, 'listEngines', () => engines2);
      await sleep(50);
      listedEngines = await engineDiscovery.list();

      expect(listedEngines.length).to.equal(2);
      listedEngine1 = listedEngines[0];
      listedEngine2 = listedEngines[1];
      expect(listedEngine1.engine).to.deep.equal(engine2.engine);
      expect(listedEngine2.engine).to.deep.equal(engine3.engine);
    });
  });
});
