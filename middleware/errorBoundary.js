'use strict';
const AppError = require('../errors/AppError');
const ValidationError = require('../errors/ValidationError');

NEWMIDDLEWARE('errorBoundary', function(ctrl, next) { next(); });

function send($, status, body) {
	$.controller.response.status = status;
	$.controller.response.headers['x-request-id'] = $.controller.requestId;
	$.callback(body);
}

async function execute($, operation, status = 200, collection = false) {
	try {
		const data = await operation();
		const response = { success: true, data };
		if (collection) response.count = data.length;
		response.requestId = $.controller.requestId;
		send($, status, response);
	} catch (err) {
		const error = err instanceof AppError ? err : new AppError('An unexpected error occurred.');
		if (!(err instanceof AppError)) console.error(err);
		const output = { code: error.code, message: error.message };
		if (error.details) output.details = error.details;
		send($, error.status, { success: false, error: output, requestId: $.controller.requestId });
	}
}

function parseId(value, entity) {
	const id = Number(value);
	if (!Number.isInteger(id) || id < 1) throw new ValidationError(`Invalid ${entity.toLowerCase()} ID.`);
	return id;
}

module.exports = { execute, parseId };
