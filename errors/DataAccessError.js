'use strict';
const AppError = require('./AppError');
module.exports = class DataAccessError extends AppError {
	constructor(message, cause) { super(message, 500, 'DATA_ACCESS_ERROR', undefined, cause); }
};
