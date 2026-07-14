'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const EventBus = require('../../events/eventBus');
const CustomerService = require('../../services/CustomerService');
const VehicleService = require('../../services/VehicleService');
const NoteService = require('../../services/NoteService');
const customerSchema = require('../../schemas/customer');
const vehicleSchema = require('../../schemas/vehicle');
const noteSchema = require('../../schemas/note');
const InMemoryRepository = require('../helpers/InMemoryRepository');

function fixture() {
	const customers = new InMemoryRepository([{ id: 1, firstName: 'A', lastName: 'B', email: 'a@b.si', phone: '1' }]);
	const vehicles = new InMemoryRepository([{ id: 1, customerId: 1, brand: 'VW', model: 'Golf', year: 2020, licensePlate: 'A' }]);
	const notes = new InMemoryRepository([{ id: 1, customerId: 1, vehicleId: 1, content: 'C', createdAt: '2026-01-01T00:00:00.000Z' }]);
	const bus = new EventBus();
	return { customers, vehicles, notes, customer: new CustomerService(customers, vehicles, notes, bus, customerSchema), vehicle: new VehicleService(vehicles, customers, notes, bus, vehicleSchema), note: new NoteService(notes, customers, vehicles, bus, noteSchema) };
}

test('CustomerService creates records and prevents relation-breaking delete', async () => {
	const f = fixture();
	assert.equal((await f.customer.create({ firstName: 'C', lastName: 'D', email: 'c@d.si', phone: '2' })).id, 2);
	await assert.rejects(() => f.customer.delete(1), err => err.code === 'CUSTOMER_HAS_RELATIONS');
});
test('VehicleService validates customers and prevents delete with notes', async () => {
	const f = fixture();
	await assert.rejects(() => f.vehicle.create({ customerId: 99, brand: 'V', model: 'M', year: 2020, licensePlate: 'X' }), err => err.code === 'INVALID_RELATION');
	await assert.rejects(() => f.vehicle.delete(1), err => err.code === 'VEHICLE_HAS_NOTES');
});
test('NoteService validates ownership and supplies createdAt', async () => {
	const f = fixture();
	const item = await f.note.create({ customerId: 1, vehicleId: 1, content: 'new' });
	assert.ok(item.createdAt);
	await assert.rejects(() => f.note.create({ customerId: 99, vehicleId: 1, content: 'bad' }), err => err.code === 'INVALID_RELATION');
});
test('schemas reject unknown fields and malformed email', () => {
	assert.throws(() => customerSchema.create({ firstName: 'A', lastName: 'B', email: 'bad', phone: '1', admin: true }), err => err.code === 'VALIDATION_ERROR');
});
