'use strict';
const BaseService = require('./BaseService');
const ConflictError = require('../errors/ConflictError');

module.exports = class VehicleService extends BaseService {
	constructor(repository, customerRepository, noteRepository, eventBus, schema) { super('Vehicle', repository, eventBus); this.customerRepository = customerRepository; this.noteRepository = noteRepository; this.schema = schema; }
	async validateRelation(data) { if (!(await this.customerRepository.exists(data.customerId))) throw new ConflictError('Customer not found.', 'INVALID_RELATION'); }
	async create(body) { const data = this.schema.create(body); await this.validateRelation(data); const item = await this.repository.create(data); this.eventBus.emitSafe('vehicle.created', item); return item; }
	async update(id, body) { const data = this.schema.update(body); await this.validateRelation(data); return this._update(id, data); }
	async delete(id) { if ((await this.noteRepository.findAll()).some(item => item.vehicleId === id)) throw new ConflictError('Vehicle has related notes.', 'VEHICLE_HAS_NOTES'); return this._delete(id); }
};
