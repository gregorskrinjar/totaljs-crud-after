'use strict';
const { validate } = require('./common');
const fields = { firstName: { type: 'string', required: true }, lastName: { type: 'string', required: true }, email: { type: 'string', required: true, email: true }, phone: { type: 'string', required: true } };
exports.create = body => validate(body, fields);
exports.update = body => validate(body, fields);
