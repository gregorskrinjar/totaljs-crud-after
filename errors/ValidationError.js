'use strict';
const AppError = require('./AppError');
module.exports = class ValidationError extends AppError {
	constructor(message = 'Validation failed.', details, status = 400, code = 'VALIDATION_ERROR') { super(message, status, code, details); }
};
