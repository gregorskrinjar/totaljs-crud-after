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
test('CustomerService joins customer details without changing source records', async () => {
	const f = fixture();
	const details = await f.customer.getAllWithDetails();
	assert.equal(details.length, 1);
	assert.equal(details[0].vehicles[0].model, 'Golf');
	assert.equal(details[0].notes[0].content, 'C');
	assert.equal((await f.customer.getByIdWithDetails(1)).vehicles.length, 1);
	await assert.rejects(() => f.customer.getByIdWithDetails(99), err => err.code === 'CUSTOMER_NOT_FOUND');
});
test('CustomerService sorts by latest note date and validates order', async () => {
	const f = fixture();
	f.customers.items.push({ id: 2, firstName: 'No', lastName: 'Notes', email: 'none@example.com', phone: '2' });
	const sorted = await f.customer.sortByLatestNoteDate('desc');
	assert.equal(sorted[0].id, 1);
	assert.equal(sorted[1].latestNoteDate, null);
	await assert.rejects(() => f.customer.sortByLatestNoteDate('sideways'), err => err.code === 'INVALID_SORT_ORDER');
});
test('CustomerService filters notes by UTC month and searches customer fields', async () => {
	const f = fixture();
	assert.equal((await f.customer.filterByNoteMonth(1, 2026))[0].matchingNotes.length, 1);
	assert.equal((await f.customer.filterByNoteMonth(2, 2026)).length, 0);
	assert.equal((await f.customer.search(' A@B ')).length, 1);
	await assert.rejects(() => f.customer.filterByNoteMonth(13), err => err.code === 'INVALID_MONTH');
	await assert.rejects(() => f.customer.filterByNoteMonth(1, '26'), err => err.code === 'INVALID_YEAR');
	await assert.rejects(() => f.customer.search('  '), err => err.code === 'SEARCH_QUERY_REQUIRED');
});
test('VehicleService validates customers and prevents delete with notes', async () => {
	const f = fixture();
	await assert.rejects(() => f.vehicle.create({ customerId: 99, brand: 'V', model: 'M', year: 2020, licensePlate: 'X' }), err => err.code === 'INVALID_RELATION');
	await assert.rejects(() => f.vehicle.delete(1), err => err.code === 'VEHICLE_HAS_NOTES');
});
test('VehicleService searches text and numeric fields', async () => {
	const f = fixture();
	assert.equal((await f.vehicle.search('gOlF')).length, 1);
	assert.equal((await f.vehicle.search('2020')).length, 1);
	assert.equal((await f.vehicle.search('1')).length, 1);
	assert.equal((await f.vehicle.search('missing')).length, 0);
	await assert.rejects(() => f.vehicle.search(''), err => err.code === 'SEARCH_QUERY_REQUIRED');
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
