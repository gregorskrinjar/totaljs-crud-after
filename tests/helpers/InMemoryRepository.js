'use strict';
module.exports = class InMemoryRepository {
	constructor(items = []) { this.items = structuredClone(items); }
	async findAll() { return structuredClone(this.items); }
	async findById(id) { return structuredClone(this.items.find(item => item.id === id) || null); }
	async exists(id) { return this.items.some(item => item.id === id); }
	async create(data) { const item = { id: Math.max(...this.items.map(x => x.id), 0) + 1, ...data }; this.items.push(item); return structuredClone(item); }
	async update(id, data) { const index = this.items.findIndex(x => x.id === id); if (index < 0) return null; this.items[index] = { id, ...data }; return structuredClone(this.items[index]); }
	async delete(id) { const index = this.items.findIndex(x => x.id === id); return index < 0 ? null : structuredClone(this.items.splice(index, 1)[0]); }
};
