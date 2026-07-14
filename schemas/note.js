'use strict';
const { validate } = require('./common');
const base = { customerId: { type: 'integer', required: true }, vehicleId: { type: 'integer', required: true }, content: { type: 'string', required: true }, createdAt: { type: 'string', date: true } };
exports.create = body => { const result = validate(body, base); result.createdAt ||= new Date().toISOString(); return result; };
exports.update = body => validate(body, { ...base, createdAt: { type: 'string', date: true, required: true } });
