'use strict';
const CustomerService = require('../services/CustomerService');
const VehicleService = require('../services/VehicleService');
const NoteService = require('../services/NoteService');

module.exports = class ServiceFactory {
	constructor(repositories, eventBus, schemas) { this.r = repositories; this.eventBus = eventBus; this.schemas = schemas; }
	createAll() {
		return {
			customers: new CustomerService(this.r.customers, this.r.vehicles, this.r.notes, this.eventBus, this.schemas.customer),
			vehicles: new VehicleService(this.r.vehicles, this.r.customers, this.r.notes, this.eventBus, this.schemas.vehicle),
			notes: new NoteService(this.r.notes, this.r.customers, this.r.vehicles, this.eventBus, this.schemas.note)
		};
	}
};
