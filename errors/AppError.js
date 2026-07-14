'use strict';

class AppError extends Error {
	constructor(message, status = 500, code = 'INTERNAL_ERROR', details, cause) {
		super(message, cause ? { cause } : undefined);
		this.name = this.constructor.name;
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

module.exports = AppError;
