'use strict';

NEWMIDDLEWARE('jsonBody', function(ctrl, next) {
	const contentType = (ctrl.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
	if (contentType !== 'application/json' && contentType !== 'text/json') {
		ctrl.response.status = 415;
		return ctrl.json({ success: false, error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Content-Type must be application/json.' }, requestId: ctrl.requestId });
	}
	if (!ctrl.body || typeof ctrl.body !== 'object' || Array.isArray(ctrl.body)) {
		ctrl.response.status = 400;
		return ctrl.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Request body must be a JSON object.' }, requestId: ctrl.requestId });
	}
	next();
});
