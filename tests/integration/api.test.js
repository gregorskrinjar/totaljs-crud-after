'use strict';
const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '../..');
const baseUrl = 'http://127.0.0.1:8200/api';
let server, temp, audit;
async function request(method, endpoint, body, headers = {}) {
	const response = await fetch(baseUrl + endpoint, { method, headers: body ? { 'content-type': 'application/json', ...headers } : headers, body: body ? JSON.stringify(body) : undefined });
	return { status: response.status, headers: response.headers, body: await response.json() };
}
before(async () => {
	temp = await fs.mkdtemp(path.join(os.tmpdir(), 'totaljs-api-'));
	audit = path.join(temp, 'audit.log');
	server = spawn(process.execPath, ['index.js'], { cwd: root, env: { ...process.env, PORT: '8200', DATA_DIR: path.join(temp, 'data'), AUDIT_LOG: audit }, stdio: 'ignore' });
	for (let attempt = 0; attempt < 80; attempt++) { try { if ((await fetch(baseUrl + '/customers')).ok) return; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
	throw new Error('Test server did not start.');
});
after(async () => { if (server) server.kill(); if (temp) await fs.rm(temp, { recursive: true, force: true }); });

test('customer detail views include all requested relations', async () => {
	let r = await request('GET', '/customers-with-details');
	assert.equal(r.status, 200); assert.equal(r.body.count, 100); assert.equal(r.body.data.length, 100);
	assert.ok(Array.isArray(r.body.data[0].vehicles)); assert.ok(Array.isArray(r.body.data[0].notes));
	r = await request('GET', '/customers/1/details');
	assert.equal(r.status, 200); assert.equal(r.body.data.id, 1); assert.equal(r.body.data.vehicles[0].customerId, 1); assert.equal(r.body.data.notes[0].customerId, 1);
	r = await request('GET', '/customers/999999/details');
	assert.equal(r.status, 404); assert.equal(r.body.error.code, 'CUSTOMER_NOT_FOUND');
});
test('customers sort by latest note date in both directions', async () => {
	let r = await request('GET', '/customers/sort/by-date?order=asc');
	assert.equal(r.status, 200); assert.equal(r.body.data[0].id, 1); assert.ok(r.body.data[0].latestNoteDate);
	r = await request('GET', '/customers/sort/by-date?order=desc');
	assert.equal(r.status, 200); assert.equal(r.body.data[0].id, 100);
	r = await request('GET', '/customers/sort/by-date?order=invalid');
	assert.equal(r.status, 400); assert.equal(r.body.error.code, 'INVALID_SORT_ORDER');
});
test('customers filter by UTC note month and validate parameters', async () => {
	let r = await request('GET', '/customers/filter/by-month?month=1');
	assert.equal(r.status, 200); assert.equal(r.body.count, 100); assert.ok(r.body.data[0].matchingNotes.length);
	r = await request('GET', '/customers/filter/by-month?month=1&year=2026');
	assert.equal(r.status, 200); assert.equal(r.body.count, 100);
	r = await request('GET', '/customers/filter/by-month?month=13');
	assert.equal(r.status, 400); assert.equal(r.body.error.code, 'INVALID_MONTH');
	r = await request('GET', '/customers/filter/by-month?month=1&year=26');
	assert.equal(r.status, 400); assert.equal(r.body.error.code, 'INVALID_YEAR');
});
test('customer search is partial, case-insensitive and validates q', async () => {
	let r = await request('GET', '/customers/search?q=customer1');
	assert.equal(r.status, 200); assert.ok(r.body.count > 0); assert.match(r.body.data[0].firstName, /Customer1/i);
	r = await request('GET', '/customers/search?q=EXAMPLE1');
	assert.equal(r.status, 200); assert.ok(r.body.count > 0);
	r = await request('GET', '/customers/search?q=not-present');
	assert.equal(r.status, 200); assert.equal(r.body.count, 0); assert.deepEqual(r.body.data, []);
	r = await request('GET', '/customers/search?q=');
	assert.equal(r.status, 400); assert.equal(r.body.error.code, 'SEARCH_QUERY_REQUIRED');
});
test('vehicle search covers brand, model, plate, year and empty results', async () => {
	for (const query of ['VOLKSWAGEN', 'golf', 'LJ-001', '2015', '1']) {
		const r = await request('GET', `/vehicles/search?q=${encodeURIComponent(query)}`);
		assert.equal(r.status, 200); assert.ok(r.body.count > 0, query);
	}
	let r = await request('GET', '/vehicles/search?q=not-present');
	assert.equal(r.status, 200); assert.equal(r.body.count, 0); assert.deepEqual(r.body.data, []);
	r = await request('GET', '/vehicles/search');
	assert.equal(r.status, 400); assert.equal(r.body.error.code, 'SEARCH_QUERY_REQUIRED');
});
test('customer CRUD, envelope, count, request id, validation and 404', async () => {
	let r = await request('GET', '/customers', undefined, { 'x-request-id': 'integration-id' });
	assert.equal(r.status, 200); assert.equal(r.body.count, 100); assert.equal(r.body.requestId, 'integration-id'); assert.equal(r.headers.get('x-request-id'), 'integration-id');
	r = await request('GET', '/customers/1'); assert.equal(r.body.data.id, 1);
	r = await request('POST', '/customers', { firstName: 'Ana', lastName: 'Kranjc', email: 'ana@example.com', phone: '+386401' }); assert.equal(r.status, 201); const id = r.body.data.id;
	r = await request('PUT', `/customers/${id}`, { firstName: 'Ana', lastName: 'Novak', email: 'ana@example.com', phone: '+386401' }); assert.equal(r.status, 200);
	r = await request('DELETE', `/customers/${id}`); assert.deepEqual(r.body.data, { deleted: true, id });
	r = await request('GET', '/customers/999999'); assert.equal(r.status, 404); assert.equal(r.body.error.code, 'CUSTOMER_NOT_FOUND');
	r = await request('POST', '/customers', { firstName: '' }); assert.equal(r.status, 400); assert.equal(r.body.error.code, 'VALIDATION_ERROR');
});
test('vehicle and note relation rules and audit events', async () => {
	let r = await request('POST', '/vehicles', { customerId: 1, brand: 'Volvo', model: 'V60', year: 2022, licensePlate: 'TEST' }); assert.equal(r.status, 201);
	r = await request('POST', '/vehicles', { customerId: 9999, brand: 'Volvo', model: 'V60', year: 2022, licensePlate: 'BAD' }); assert.equal(r.status, 409);
	r = await request('POST', '/notes', { customerId: 1, vehicleId: 1, content: 'Valid' }); assert.equal(r.status, 201); assert.ok(r.body.data.createdAt);
	r = await request('POST', '/notes', { customerId: 2, vehicleId: 1, content: 'Invalid' }); assert.equal(r.status, 409); assert.equal(r.body.error.code, 'INVALID_RELATION');
	await new Promise(resolve => setTimeout(resolve, 100));
	assert.match(await fs.readFile(audit, 'utf8'), /vehicle\.created/);
});
test('complete related customer, vehicle and note lifecycle', async () => {
	let r = await request('POST', '/customers', { firstName: 'Lifecycle', lastName: 'Test', email: 'life@example.com', phone: '+38640000' });
	const customerId = r.body.data.id;
	r = await request('POST', '/vehicles', { customerId, brand: 'Skoda', model: 'Enyaq', year: 2024, licensePlate: 'LIFE-1' });
	const vehicleId = r.body.data.id;
	r = await request('GET', `/vehicles/${vehicleId}`); assert.equal(r.status, 200);
	r = await request('PUT', `/vehicles/${vehicleId}`, { customerId, brand: 'Skoda', model: 'Enyaq 85', year: 2025, licensePlate: 'LIFE-1' }); assert.equal(r.status, 200);
	r = await request('GET', '/vehicles'); assert.equal(r.status, 200); assert.ok(r.body.count >= 101);
	r = await request('POST', '/notes', { customerId, vehicleId, content: 'Lifecycle note' });
	const noteId = r.body.data.id;
	r = await request('GET', `/notes/${noteId}`); assert.equal(r.status, 200);
	r = await request('PUT', `/notes/${noteId}`, { customerId, vehicleId, content: 'Updated lifecycle note', createdAt: '2026-03-01T10:00:00.000Z' }); assert.equal(r.status, 200);
	r = await request('GET', '/notes'); assert.equal(r.status, 200); assert.ok(r.body.count >= 101);
	r = await request('DELETE', `/notes/${noteId}`); assert.equal(r.status, 200);
	r = await request('DELETE', `/vehicles/${vehicleId}`); assert.equal(r.status, 200);
	r = await request('DELETE', `/customers/${customerId}`); assert.equal(r.status, 200);
});
test('content type and protected deletes return expected statuses', async () => {
	let response = await fetch(baseUrl + '/customers', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' });
	assert.equal(response.status, 415);
	response = await fetch(baseUrl + '/customers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
	assert.equal(response.status, 400);
	assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
	let r = await request('DELETE', '/customers/1'); assert.equal(r.status, 409); assert.equal(r.body.error.code, 'CUSTOMER_HAS_RELATIONS');
	r = await request('DELETE', '/vehicles/1'); assert.equal(r.status, 409); assert.equal(r.body.error.code, 'VEHICLE_HAS_NOTES');
});
