'use strict';
const BaseService = require('./BaseService');
const ConflictError = require('../errors/ConflictError');

module.exports = class CustomerService extends BaseService {
	constructor(repository, vehicleRepository, noteRepository, eventBus, schema) { super('Customer', repository, eventBus); this.vehicleRepository = vehicleRepository; this.noteRepository = noteRepository; this.schema = schema; }
	async create(body) { const item = await this.repository.create(this.schema.create(body)); this.eventBus.emitSafe('customer.created', item); return item; }
	update(id, body) { return this._update(id, this.schema.update(body)); }
	async delete(id) {
		const [vehicles, notes] = await Promise.all([this.vehicleRepository.findAll(), this.noteRepository.findAll()]);
		if (vehicles.some(item => item.customerId === id) || notes.some(item => item.customerId === id)) throw new ConflictError('Customer has related vehicles or notes.', 'CUSTOMER_HAS_RELATIONS');
		return this._delete(id);
	}
};
