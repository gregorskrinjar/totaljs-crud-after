'use strict';
const { randomUUID } = require('crypto');

NEWMIDDLEWARE('requestId', function(ctrl, next) {
	ctrl.requestId = ctrl.headers['x-request-id'] || randomUUID();
	ctrl.response.headers['x-request-id'] = ctrl.requestId;
	next();
});
