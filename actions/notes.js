'use strict';
const { services } = require('../definitions/dependencies');
const { execute, parseId } = require('../middleware/errorBoundary');

NEWACTION('Notes/list', { action: $ => execute($, () => services.notes.list(), 200, true) });
NEWACTION('Notes/get', { action: $ => execute($, () => services.notes.get(parseId($.params.id, 'Note'))) });
NEWACTION('Notes/create', { action: ($, body) => execute($, () => services.notes.create(body), 201) });
NEWACTION('Notes/update', { action: ($, body) => execute($, () => services.notes.update(parseId($.params.id, 'Note'), body)) });
NEWACTION('Notes/remove', { action: $ => execute($, () => services.notes.delete(parseId($.params.id, 'Note'))) });
