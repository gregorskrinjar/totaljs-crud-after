'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const SequentialIdStrategy = require('../../strategies/SequentialIdStrategy');
const BaseJsonRepository = require('../../repositories/BaseJsonRepository');

test('SequentialIdStrategy generates max + 1', () => assert.equal(new SequentialIdStrategy().next([{ id: 2 }, { id: 7 }]), 8));
test('repository CRUD uses an isolated JSON file', async t => {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'totaljs-repo-'));
	t.after(() => fs.rm(dir, { recursive: true, force: true }));
	const repo = new BaseJsonRepository(path.join(dir, 'items.json'), new SequentialIdStrategy());
	const created = await repo.create({ name: 'one' });
	assert.equal(created.id, 1);
	assert.deepEqual(await repo.findById(1), created);
	assert.deepEqual(await repo.update(1, { name: 'updated' }), { id: 1, name: 'updated' });
	assert.equal((await repo.delete(1)).id, 1);
	assert.deepEqual(await repo.findAll(), []);
});
