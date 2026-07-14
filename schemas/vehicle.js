'use strict';
const { validate } = require('./common');
const fields = { customerId: { type: 'integer', required: true }, brand: { type: 'string', required: true }, model: { type: 'string', required: true }, year: { type: 'integer', required: true, min: 1886, max: 2100 }, licensePlate: { type: 'string', required: true } };
exports.create = body => validate(body, fields);
exports.update = body => validate(body, fields);
