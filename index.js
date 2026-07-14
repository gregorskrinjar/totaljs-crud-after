'use strict';

const Total = require('total5');
const { seedData } = require('./seed/seedData');

seedData()
	.then(() => Total.http({ port: Number(process.env.PORT) || 8000 }))
	.catch(err => {
		console.error('Unable to initialize application:', err);
		process.exitCode = 1;
	});
