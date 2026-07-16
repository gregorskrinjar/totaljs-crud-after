'use strict';
const BaseService = require('./BaseService');
const ConflictError = require('../errors/ConflictError');
const ValidationError = require('../errors/ValidationError');

module.exports = class VehicleService extends BaseService {
	constructor(repository, customerRepository, noteRepository, eventBus, schema) { super('Vehicle', repository, eventBus); this.customerRepository = customerRepository; this.noteRepository = noteRepository; this.schema = schema; }
	async search(query) {
		const normalized = String(query || '').trim().toLowerCase();
		if (!normalized) throw new ValidationError('Search query is required.', undefined, 400, 'SEARCH_QUERY_REQUIRED');
		const numeric = /^\d+$/.test(normalized) ? Number(normalized) : null;
		return (await this.repository.findAll()).filter(vehicle =>
			[vehicle.brand, vehicle.model, vehicle.licensePlate].some(value => String(value).toLowerCase().includes(normalized)) ||
			(numeric !== null && (vehicle.customerId === numeric || vehicle.year === numeric))
		);
	}
	async validateRelation(data) { if (!(await this.customerRepository.exists(data.customerId))) throw new ConflictError('Customer not found.', 'INVALID_RELATION'); }
	async create(body) { const data = this.schema.create(body); await this.validateRelation(data); const item = await this.repository.create(data); this.eventBus.emitSafe('vehicle.created', item); return item; }
	async update(id, body) { const data = this.schema.update(body); await this.validateRelation(data); return this._update(id, data); }
	async delete(id) { if ((await this.noteRepository.findAll()).some(item => item.vehicleId === id)) throw new ConflictError('Vehicle has related notes.', 'VEHICLE_HAS_NOTES'); return this._delete(id); }
};
