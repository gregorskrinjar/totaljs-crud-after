'use strict';
const { services } = require('../definitions/dependencies');
const { execute, parseId } = require('../middleware/errorBoundary');

NEWACTION('Vehicles/list', { action: $ => execute($, () => services.vehicles.list(), 200, true) });
NEWACTION('Vehicles/get', { action: $ => execute($, () => services.vehicles.get(parseId($.params.id, 'Vehicle'))) });
NEWACTION('Vehicles/create', { action: ($, body) => execute($, () => services.vehicles.create(body), 201) });
NEWACTION('Vehicles/update', { action: ($, body) => execute($, () => services.vehicles.update(parseId($.params.id, 'Vehicle'), body)) });
NEWACTION('Vehicles/remove', { action: $ => execute($, () => services.vehicles.delete(parseId($.params.id, 'Vehicle'))) });
