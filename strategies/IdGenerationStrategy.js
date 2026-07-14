'use strict';

class IdGenerationStrategy {
	next() {
		throw new Error('IdGenerationStrategy.next() must be implemented.');
	}
}

module.exports = IdGenerationStrategy;
