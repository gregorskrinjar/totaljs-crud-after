'use strict';
const path = require('path');
const SequentialIdStrategy = require('../strategies/SequentialIdStrategy');
const RepositoryFactory = require('../repositories/RepositoryFactory');
const ServiceFactory = require('../factories/ServiceFactory');
const EventBus = require('../events/eventBus');
const registerAuditListeners = require('../events/auditListeners');

const repositoryFactory = new RepositoryFactory(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), new SequentialIdStrategy());
const repositories = { customers: repositoryFactory.create('customers'), vehicles: repositoryFactory.create('vehicles'), notes: repositoryFactory.create('notes') };
const eventBus = new EventBus();
registerAuditListeners(eventBus, process.env.AUDIT_LOG || path.join(__dirname, '..', 'logs', 'audit.log'));
const services = new ServiceFactory(repositories, eventBus, { customer: require('../schemas/customer'), vehicle: require('../schemas/vehicle'), note: require('../schemas/note') }).createAll();

module.exports = { repositoryFactory, repositories, eventBus, services };
