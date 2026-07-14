'use strict';
const { services } = require('../definitions/dependencies');
const { execute, parseId } = require('../middleware/errorBoundary');

NEWACTION('Customers/list', { action: $ => execute($, () => services.customers.list(), 200, true) });
NEWACTION('Customers/get', { action: $ => execute($, () => services.customers.get(parseId($.params.id, 'Customer'))) });
NEWACTION('Customers/create', { action: ($, body) => execute($, () => services.customers.create(body), 201) });
NEWACTION('Customers/update', { action: ($, body) => execute($, () => services.customers.update(parseId($.params.id, 'Customer'), body)) });
NEWACTION('Customers/remove', { action: $ => execute($, () => services.customers.delete(parseId($.params.id, 'Customer'))) });
