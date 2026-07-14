'use strict';
const NotFoundError = require('../errors/NotFoundError');

module.exports = class BaseService {
	constructor(entity, repository, eventBus) { this.entity = entity; this.repository = repository; this.eventBus = eventBus; }
	async list() { return this.repository.findAll(); }
	async get(id) { const item = await this.repository.findById(id); if (!item) throw new NotFoundError(this.entity); return item; }
	async _update(id, data) { const item = await this.repository.update(id, data); if (!item) throw new NotFoundError(this.entity); this.eventBus.emitSafe(`${this.entity.toLowerCase()}.updated`, item); return item; }
	async _delete(id) { const item = await this.repository.delete(id); if (!item) throw new NotFoundError(this.entity); this.eventBus.emitSafe(`${this.entity.toLowerCase()}.deleted`, item); return { deleted: true, id }; }
};
