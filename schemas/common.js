'use strict';

const ValidationError = require('../errors/ValidationError');

function validate(body, fields) {
	if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Request body must be a JSON object.');
	const unknown = Object.keys(body).filter(key => !Object.hasOwn(fields, key));
	if (unknown.length) throw new ValidationError('Request contains unknown fields.', { fields: unknown });
	const output = {};
	const errors = [];
	for (const [name, rule] of Object.entries(fields)) {
		let value = body[name];
		if (value === undefined || value === null || value === '') {
			if (rule.required) errors.push(`${name} is required.`);
			continue;
		}
		if (rule.date && value instanceof Date) value = value.toISOString();
		if (rule.type === 'string') {
			if (typeof value !== 'string' || !value.trim()) errors.push(`${name} must be a non-empty string.`);
			else value = value.trim();
		} else if (rule.type === 'integer') {
			value = Number(value);
			if (!Number.isInteger(value) || value < (rule.min || 1) || (rule.max && value > rule.max)) errors.push(`${name} must be a valid integer.`);
		}
		if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`${name} must be a valid email address.`);
		if (rule.date && (typeof value !== 'string' || Number.isNaN(Date.parse(value)))) errors.push(`${name} must be a valid ISO date.`);
		output[name] = value;
	}
	if (errors.length) throw new ValidationError('Validation failed.', { fields: errors });
	return output;
}

module.exports = { validate };
