'use strict';
const fs = require('fs/promises');
const path = require('path');

module.exports = function registerAuditListeners(eventBus, logfile) {
	for (const entity of ['customer', 'vehicle', 'note']) for (const operation of ['created', 'updated', 'deleted']) {
		const event = `${entity}.${operation}`;
		eventBus.on(event, async item => {
			await fs.mkdir(path.dirname(logfile), { recursive: true });
			await fs.appendFile(logfile, JSON.stringify({ event, entity, entityId: item.id, timestamp: new Date().toISOString() }) + '\n');
		});
	}
};
