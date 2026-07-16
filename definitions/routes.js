'use strict';

const common = '#requestId #requestLogger #errorBoundary';
const json = `${common} #jsonBody`;

ROUTE(`GET /api/customers/ ${common} -Customers/list --> Customers/list`);
ROUTE(`GET /api/customers-with-details/ ${common} -Customers/listWithDetails --> Customers/listWithDetails`);
ROUTE(`GET /api/customers/search/ ${common} -Customers/search --> Customers/search`);
ROUTE(`GET /api/customers/sort/by-date/ ${common} -Customers/sortByDate --> Customers/sortByDate`);
ROUTE(`GET /api/customers/filter/by-month/ ${common} -Customers/filterByMonth --> Customers/filterByMonth`);
ROUTE(`GET /api/customers/{id}/details/ ${common} -Customers/getWithDetails --> Customers/getWithDetails`);
ROUTE(`GET /api/customers/{id}/ ${common} -Customers/get --> Customers/get`);
ROUTE(`POST /api/customers/ ${json} +Customers/create --> Customers/create`);
ROUTE(`PUT /api/customers/{id}/ ${json} +Customers/update --> Customers/update`);
ROUTE(`DELETE /api/customers/{id}/ ${common} -Customers/remove --> Customers/remove`);

ROUTE(`GET /api/vehicles/ ${common} -Vehicles/list --> Vehicles/list`);
ROUTE(`GET /api/vehicles/search/ ${common} -Vehicles/search --> Vehicles/search`);
ROUTE(`GET /api/vehicles/{id}/ ${common} -Vehicles/get --> Vehicles/get`);
ROUTE(`POST /api/vehicles/ ${json} +Vehicles/create --> Vehicles/create`);
ROUTE(`PUT /api/vehicles/{id}/ ${json} +Vehicles/update --> Vehicles/update`);
ROUTE(`DELETE /api/vehicles/{id}/ ${common} -Vehicles/remove --> Vehicles/remove`);

ROUTE(`GET /api/notes/ ${common} -Notes/list --> Notes/list`);
ROUTE(`GET /api/notes/{id}/ ${common} -Notes/get --> Notes/get`);
ROUTE(`POST /api/notes/ ${json} +Notes/create --> Notes/create`);
ROUTE(`PUT /api/notes/{id}/ ${json} +Notes/update --> Notes/update`);
ROUTE(`DELETE /api/notes/{id}/ ${common} -Notes/remove --> Notes/remove`);
