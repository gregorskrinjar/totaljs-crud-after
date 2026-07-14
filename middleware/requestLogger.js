'use strict';

NEWMIDDLEWARE('requestLogger', function(ctrl, next) {
	const started = Date.now();
	ctrl.res.once('finish', () => console.log(JSON.stringify({ requestId: ctrl.requestId, method: ctrl.method, path: ctrl.url, startedAt: new Date(started).toISOString(), status: ctrl.res.statusCode, durationMs: Date.now() - started })));
	next();
});
