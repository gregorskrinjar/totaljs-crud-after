'use strict';
const AppError = require('./AppError');
module.exports = class ConflictError extends AppError {
	constructor(message, code) { super(message, 409, code); }
};
