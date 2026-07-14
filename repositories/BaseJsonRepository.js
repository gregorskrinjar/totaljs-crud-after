'use strict';

const fs = require('fs/promises');
const path = require('path');
const DataAccessError = require('../errors/DataAccessError');

class BaseJsonRepository {
	constructor(filepath, idStrategy) {
		this.filepath = filepath;
		this.idStrategy = idStrategy;
		this.writeQueue = Promise.resolve();
	}

	async ensure() {
		await fs.mkdir(path.dirname(this.filepath), { recursive: true });
		try { await fs.access(this.filepath); }
		catch (err) { if (err.code === 'ENOENT') await fs.writeFile(this.filepath, '[]\n'); else throw err; }
	}

	async _read() {
		try {
			await this.ensure();
			const items = JSON.parse(await fs.readFile(this.filepath, 'utf8'));
			if (!Array.isArray(items)) throw new Error('The data file must contain a JSON array.');
			return items;
		} catch (err) { throw new DataAccessError(`Unable to read ${path.basename(this.filepath)}.`, err); }
	}

	async _write(items) {
		const temporary = `${this.filepath}.${process.pid}.${Date.now()}.tmp`;
		try {
			await fs.writeFile(temporary, JSON.stringify(items, null, 2) + '\n', 'utf8');
			await fs.rename(temporary, this.filepath);
		} catch (err) {
			await fs.rm(temporary, { force: true }).catch(() => {});
			throw new DataAccessError(`Unable to write ${path.basename(this.filepath)}.`, err);
		}
	}

	_mutate(operation) {
		const current = this.writeQueue.then(async () => {
			const items = await this._read();
			const result = await operation(items);
			if (result.write) await this._write(items);
			return result.value;
		});
		this.writeQueue = current.catch(() => {});
		return current;
	}

	findAll() { return this._read(); }
	async findById(id) { return (await this._read()).find(item => item.id === id) || null; }
	async exists(id) { return Boolean(await this.findById(id)); }
	create(data) { return this._mutate(items => { const item = { id: this.idStrategy.next(items), ...data }; items.push(item); return { write: true, value: item }; }); }
	update(id, data) { return this._mutate(items => { const index = items.findIndex(item => item.id === id); if (index < 0) return { write: false, value: null }; const item = { id, ...data }; items[index] = item; return { write: true, value: item }; }); }
	delete(id) { return this._mutate(items => { const index = items.findIndex(item => item.id === id); if (index < 0) return { write: false, value: null }; const [item] = items.splice(index, 1); return { write: true, value: item }; }); }
	replaceAllIfEmpty(seedItems) { return this._mutate(items => { if (items.length) return { write: false, value: false }; items.push(...seedItems); return { write: true, value: true }; }); }
}

module.exports = BaseJsonRepository;
