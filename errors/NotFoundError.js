'use strict';
const AppError = require('./AppError');
module.exports = class NotFoundError extends AppError {
	constructor(entity) { super(`${entity} not found.`, 404, `${entity.toUpperCase()}_NOT_FOUND`); }
};
