'use strict';
const { EventEmitter } = require('events');

module.exports = class EventBus extends EventEmitter {
	emitSafe(event, entity) {
		for (const listener of this.listeners(event)) Promise.resolve().then(() => listener(entity)).catch(err => console.error(`Audit listener failed for ${event}:`, err.message));
	}
};
