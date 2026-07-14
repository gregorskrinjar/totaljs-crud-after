'use strict';
const { repositories } = require('../definitions/dependencies');

function customers() {
	return Array.from({ length: 100 }, (_, index) => { const id = index + 1; return { id, firstName: `Customer${id}`, lastName: `Example${id}`, email: `customer${id}@example.com`, phone: `+38640${String(100000 + id).slice(-6)}` }; });
}
function vehicles() {
	const brands = ['Volkswagen', 'Renault', 'Skoda', 'Toyota', 'Ford'];
	const models = ['Golf', 'Clio', 'Octavia', 'Corolla', 'Focus'];
	return Array.from({ length: 100 }, (_, index) => { const id = index + 1; return { id, customerId: id, brand: brands[index % brands.length], model: models[index % models.length], year: 2015 + (index % 10), licensePlate: `LJ-${String(id).padStart(3, '0')}-AA` }; });
}
function notes() {
	return Array.from({ length: 100 }, (_, index) => { const id = index + 1; return { id, customerId: id, vehicleId: id, content: `Service note ${id}.`, createdAt: new Date(Date.UTC(2026, 0, 1, 10, index)).toISOString() }; });
}
async function seedData() {
	await repositories.customers.replaceAllIfEmpty(customers());
	await repositories.vehicles.replaceAllIfEmpty(vehicles());
	await repositories.notes.replaceAllIfEmpty(notes());
}

module.exports = { seedData, customers, vehicles, notes };
