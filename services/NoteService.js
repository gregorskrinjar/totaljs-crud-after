'use strict';
const BaseService = require('./BaseService');
const ConflictError = require('../errors/ConflictError');

module.exports = class NoteService extends BaseService {
	constructor(repository, customerRepository, vehicleRepository, eventBus, schema) { super('Note', repository, eventBus); this.customerRepository = customerRepository; this.vehicleRepository = vehicleRepository; this.schema = schema; }
	async validateRelation(data) { const [customer, vehicle] = await Promise.all([this.customerRepository.findById(data.customerId), this.vehicleRepository.findById(data.vehicleId)]); if (!customer || !vehicle || vehicle.customerId !== data.customerId) throw new ConflictError('Customer and vehicle relationship is invalid.', 'INVALID_RELATION'); }
	async create(body) { const data = this.schema.create(body); await this.validateRelation(data); const item = await this.repository.create(data); this.eventBus.emitSafe('note.created', item); return item; }
	async update(id, body) { const data = this.schema.update(body); await this.validateRelation(data); return this._update(id, data); }
	delete(id) { return this._delete(id); }
};
