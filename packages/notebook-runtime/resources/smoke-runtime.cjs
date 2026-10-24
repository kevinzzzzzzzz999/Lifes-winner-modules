#!/usr/bin/env node
'use strict';
// Real IPython smoke check using only this package and explicit runtime inputs.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { notebooks: { NotebookService } } = require('..');

function option(name) { const at = process.argv.indexOf(name); return at < 0 ? null : process.argv[at + 1]; }
async function main() {
  const runtime = option('--runtime'), python = option('--python');
  if (!runtime || !python || !path.isAbsolute(runtime) || !path.isAbsolute(python)) {
    throw new Error('Use --runtime /absolute/runtime-directory --python /absolute/python3.14');
  }
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'inkspace-ipython-smoke-'));
  const cells = ['example_value = 40\nexample_value + 2', 'example_value + 3',
    'import matplotlib.pyplot as plt\nplt.plot([0, 1], [0, 1])\nplt.show()'];
  const data = Buffer.from(JSON.stringify({ nbformat: 4, nbformat_minor: 5, metadata: {},
    cells: cells.map(source => ({ cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source })) }));
  const filename = path.join(directory, 'Example.ipynb');
  await fs.writeFile(filename, data);
  const sha256 = crypto.createHash('sha256').update(data).digest('hex');
  const service = new NotebookService({
    vaultService: { snapshot: async request => {
      assert.equal(request.path, 'Example.ipynb');
      return { data, sha256, full: filename };
    } }, runtimePath: python, packagesPath: path.join(runtime, 'packages'),
    helperPath: path.join(__dirname, 'kernel.py'), dataDirectory: path.join(directory, 'state'),
    startTimeoutMs: 60000, timeoutMs: 30000
  });
  const events = [];
  service.on('event', event => events.push(event));
  async function run(indices) {
    const request = { vaultId: 'synthetic', path: 'Example.ipynb', expectedSHA256: sha256,
      runId: crypto.randomUUID(), cellIndices: indices };
    let listener, timer;
    const ended = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('IPython run did not finish')), 90000);
      listener = event => {
        if (event.runId === request.runId && event.kind === 'run-end') resolve(event);
      };
      service.on('event', listener);
    });
    try {
      const started = await service.run(request), end = await ended;
      assert.equal(end.reason, 'completed');
      assert.equal(end.status, 'ok');
      return started;
    } finally { clearTimeout(timer); service.off('event', listener); }
  }
  try {
    const info = await service.info();
    assert.equal(info.available, true, 'Runtime not available; check platform, packages and PROVENANCE.json.');
    const first = await run([0]), again = await run([1, 2]);
    assert.equal(first.kernelId, again.kernelId);
    const outputs = events.filter(event => event.kind === 'output').map(event => event.output);
    assert(outputs.some(output => output.data?.['text/plain'] === '42'));
    assert(outputs.some(output => output.data?.['text/plain'] === '43'));
    assert(outputs.some(output => typeof output.data?.['image/png'] === 'string' && output.data['image/png'].length > 100));
    assert(!outputs.some(output => output.output_type === 'error'));
    assert.deepEqual(await service.close({ vaultId: 'synthetic', path: 'Example.ipynb' }), { closed: true });
    assert.equal(service.kernels.size, 0);
    console.log(JSON.stringify({ realIPython: true, syntheticCells: 3, sharedKernelState: true,
      inlinePNG: true, cleanClose: true, pythonVersion: info.pythonVersion }));
  } finally { await service.dispose(); await fs.rm(directory, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error.code || error.name, error.message); process.exitCode = 1; });
