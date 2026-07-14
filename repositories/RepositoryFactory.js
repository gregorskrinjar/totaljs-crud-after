'use strict';

const path = require('path');
const CustomerRepository = require('./CustomerRepository');
const VehicleRepository = require('./VehicleRepository');
const NoteRepository = require('./NoteRepository');

const TYPES = { customers: CustomerRepository, vehicles: VehicleRepository, notes: NoteRepository };

class RepositoryFactory {
	constructor(dataDirectory, idStrategy) { this.dataDirectory = dataDirectory; this.idStrategy = idStrategy; this.instances = new Map(); }
	create(name) {
		const Type = TYPES[name];
		if (!Type) throw new Error(`Unknown repository: ${name}`);
		if (!this.instances.has(name)) this.instances.set(name, new Type(path.join(this.dataDirectory, `${name}.json`), this.idStrategy));
		return this.instances.get(name);
	}
}

module.exports = RepositoryFactory;
