'use strict';
const BaseService = require('./BaseService');
const ConflictError = require('../errors/ConflictError');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');

function validation(message, code) {
	return new ValidationError(message, undefined, 400, code);
}

function groupByCustomer(items) {
	const grouped = new Map();
	for (const item of items) {
		const group = grouped.get(item.customerId);
		if (group) group.push(item);
		else grouped.set(item.customerId, [item]);
	}
	return grouped;
}

module.exports = class CustomerService extends BaseService {
	constructor(repository, vehicleRepository, noteRepository, eventBus, schema) { super('Customer', repository, eventBus); this.vehicleRepository = vehicleRepository; this.noteRepository = noteRepository; this.schema = schema; }
	async getAllWithDetails() {
		const [customers, vehicles, notes] = await Promise.all([this.repository.findAll(), this.vehicleRepository.findAll(), this.noteRepository.findAll()]);
		const vehiclesByCustomer = groupByCustomer(vehicles);
		const notesByCustomer = groupByCustomer(notes);
		return customers.map(customer => ({ ...customer, vehicles: vehiclesByCustomer.get(customer.id) || [], notes: notesByCustomer.get(customer.id) || [] }));
	}
	async getByIdWithDetails(id) {
		const [customer, vehicles, notes] = await Promise.all([this.repository.findById(id), this.vehicleRepository.findAll(), this.noteRepository.findAll()]);
		if (!customer) throw new NotFoundError('Customer');
		return { ...customer, vehicles: vehicles.filter(item => item.customerId === id), notes: notes.filter(item => item.customerId === id) };
	}
	async sortByLatestNoteDate(order = 'desc') {
		order = String(order || 'desc');
		if (order !== 'asc' && order !== 'desc') throw validation('Sort order must be asc or desc.', 'INVALID_SORT_ORDER');
		const [customers, notes] = await Promise.all([this.repository.findAll(), this.noteRepository.findAll()]);
		const latest = new Map();
		for (const note of notes) {
			const timestamp = Date.parse(note.createdAt);
			if (!Number.isNaN(timestamp) && timestamp > (latest.get(note.customerId) || -Infinity)) latest.set(note.customerId, timestamp);
		}
		return customers.map(customer => ({ ...customer, latestNoteDate: latest.has(customer.id) ? new Date(latest.get(customer.id)).toISOString() : null })).sort((a, b) => {
			if (a.latestNoteDate === null) return b.latestNoteDate === null ? a.id - b.id : 1;
			if (b.latestNoteDate === null) return -1;
			const difference = Date.parse(a.latestNoteDate) - Date.parse(b.latestNoteDate);
			return (order === 'asc' ? difference : -difference) || a.id - b.id;
		});
	}
	async filterByNoteMonth(month, year) {
		month = Number(month);
		if (!Number.isInteger(month) || month < 1 || month > 12) throw validation('Month must be an integer from 1 to 12.', 'INVALID_MONTH');
		if (year !== undefined && year !== null && year !== '') {
			if (!/^\d{4}$/.test(String(year))) throw validation('Year must be a four-digit integer.', 'INVALID_YEAR');
			year = Number(year);
		} else year = null;
		const [customers, notes] = await Promise.all([this.repository.findAll(), this.noteRepository.findAll()]);
		const matchingByCustomer = groupByCustomer(notes.filter(note => {
			const date = new Date(note.createdAt);
			return !Number.isNaN(date.getTime()) && date.getUTCMonth() + 1 === month && (year === null || date.getUTCFullYear() === year);
		}));
		return customers.filter(customer => matchingByCustomer.has(customer.id)).map(customer => ({ ...customer, matchingNotes: matchingByCustomer.get(customer.id) }));
	}
	async search(query) {
		const normalized = String(query || '').trim().toLowerCase();
		if (!normalized) throw validation('Search query is required.', 'SEARCH_QUERY_REQUIRED');
		return (await this.repository.findAll()).filter(customer => [customer.firstName, customer.lastName, customer.email, customer.phone].some(value => String(value).toLowerCase().includes(normalized)));
	}
	async create(body) { const item = await this.repository.create(this.schema.create(body)); this.eventBus.emitSafe('customer.created', item); return item; }
	update(id, body) { return this._update(id, this.schema.update(body)); }
	async delete(id) {
		const [vehicles, notes] = await Promise.all([this.vehicleRepository.findAll(), this.noteRepository.findAll()]);
		if (vehicles.some(item => item.customerId === id) || notes.some(item => item.customerId === id)) throw new ConflictError('Customer has related vehicles or notes.', 'CUSTOMER_HAS_RELATIONS');
		return this._delete(id);
	}
};
