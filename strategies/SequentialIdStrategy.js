'use strict';

const IdGenerationStrategy = require('./IdGenerationStrategy');

class SequentialIdStrategy extends IdGenerationStrategy {
	next(items) {
		return Math.max(...items.map(item => item.id), 0) + 1;
	}
}

module.exports = SequentialIdStrategy;
