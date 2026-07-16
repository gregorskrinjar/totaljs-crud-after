# Total.js CRUD AFTER

Arhitekturno izboljšana različica projekta `totaljs-crud-before`. Aplikacija ohranja celoten REST CRUD za customers, vehicles in notes, isti port, modele, relacije ter determinističnih 100 + 100 + 100 začetnih zapisov. Dodatni read-only pogledi omogočajo združevanje, sortiranje, filtriranje in iskanje brez spreminjanja podatkovnih modelov ali seed podatkov.

## Zahteve in zagon

- Node.js 20 ali novejši
- Total.js v5 (`total5` 0.0.18)

```bash
npm install
npm start
```

Aplikacija je na `http://localhost:8000`. Razvojni zagon je `npm run dev`. Vsi testi: `npm test`; samo enotni: `npm run test:unit`; samo integracijski: `npm run test:integration`. Port je mogoče spremeniti z `PORT`; testa uporabljata ločena `DATA_DIR` in `AUDIT_LOG`.

## API

Vsi odgovori so JSON. Vsaka od treh osnov `/api/customers`, `/api/vehicles` in `/api/notes` podpira:

| Operacija | Pot | Uspeh |
|---|---|---|
| seznam | `GET /api/{entity}` | 200 |
| zapis | `GET /api/{entity}/{id}` | 200 |
| ustvarjanje | `POST /api/{entity}` | 201 |
| posodobitev | `PUT /api/{entity}/{id}` | 200 |
| brisanje | `DELETE /api/{entity}/{id}` | 200 |

Primer ustvarjanja customerja:

```http
POST /api/customers
Content-Type: application/json

{"firstName":"Ana","lastName":"Kranjc","email":"ana@example.com","phone":"+38640123456"}
```

```json
{"success":true,"data":{"id":101,"firstName":"Ana","lastName":"Kranjc","email":"ana@example.com","phone":"+38640123456"},"requestId":"..."}
```

Seznam vsebuje še `count`. Brisanje vrne `data: { "deleted": true, "id": 101 }`. Napake imajo enotno obliko:

```json
{"success":false,"error":{"code":"CUSTOMER_NOT_FOUND","message":"Customer not found."},"requestId":"..."}
```

Statusi so 400 za neveljavne podatke ali ID, 404 za manjkajoč zapis, 409 za kršitev relacije, 415 za napačen Content-Type ter 500 za nepričakovano ali podatkovno napako. Produkcijski odgovor ne vsebuje stack tracea.

## Modeli in relacije

- Customer: `id`, `firstName`, `lastName`, `email`, `phone`.
- Vehicle: `id`, `customerId`, `brand`, `model`, `year`, `licensePlate`.
- Note: `id`, `customerId`, `vehicleId`, `content`, `createdAt`.

Vehicle mora kazati na obstoječega customerja. Note mora kazati na obstoječa customerja in vehicle, vehicle pa mora pripadati temu customerju. Customerja z vozili ali opombami ter vozila z opombami ni mogoče izbrisati; kaskadnega brisanja ni.

`seed/seedData.js` reproducira generator BEFORE: 100 customerjev, 100 vehicles in 100 notes z ID-ji 1–100 ter povezavo `customer N → vehicle N → note N`. Seed uporablja Repository Factory in podatke zapiše samo, kadar je posamezna JSON zbirka prazna, zato ponovni zagon ne podvaja zapisov. Shramba so izključno `data/customers.json`, `data/vehicles.json` in `data/notes.json`.

## Dodatni read-only endpointi

| Endpoint | Query parametri | Namen |
|---|---|---|
| `GET /api/customers-with-details` | brez | Vseh 100 customerjev z nizoma `vehicles` in `notes`. |
| `GET /api/customers/{id}/details` | pozitivni `{id}` | Posamezen customer z vozili in opombami; manjkajoč zapis vrne 404. |
| `GET /api/customers/sort/by-date` | `order=asc\|desc`, privzeto `desc` | Sortira po `latestNoteDate`; customerji brez opomb so na koncu. |
| `GET /api/customers/filter/by-month` | obvezni `month=1..12`, neobvezni štirimestni `year` | Vrne customerje in njihove `matchingNotes`, primerjane v UTC. |
| `GET /api/customers/search` | obvezni neprazni `q` | Delno, neobčutljivo iskanje po imenu, priimku, e-pošti in telefonu. |
| `GET /api/vehicles/search` | obvezni neprazni `q` | Delno iskanje po znamki, modelu in registraciji; celo število išče tudi `customerId` in `year`. |

Neveljavni parametri vrnejo status 400 in kode `INVALID_SORT_ORDER`, `INVALID_MONTH`, `INVALID_YEAR` ali `SEARCH_QUERY_REQUIRED`. Iskanje brez zadetkov vrne status 200, `data: []` in `count: 0`.

Primer odziva skupnega pogleda:

```json
{
  "success": true,
  "data": [{ "id": 1, "firstName": "Customer1", "lastName": "Example1", "email": "customer1@example.com", "phone": "+38640100001", "vehicles": [], "notes": [] }],
  "count": 100,
  "requestId": "..."
}
```

Primeri:

```bash
curl "http://localhost:8000/api/customers-with-details"
curl "http://localhost:8000/api/customers/1/details"
curl "http://localhost:8000/api/customers/sort/by-date?order=desc"
curl "http://localhost:8000/api/customers/filter/by-month?month=1&year=2026"
curl "http://localhost:8000/api/customers/search?q=customer1"
curl "http://localhost:8000/api/vehicles/search?q=golf"
```

Action sloj samo prebere path/query parametre in uporabi skupni response helper. Validacija query parametrov, trije enkratni Repository dostopi za skupni pogled, združevanje z `Map`, sortiranje, UTC filtriranje in iskanje so v Service sloju. Repository ostaja generičen in brez poslovne logike.

## Struktura in vzorci

- `actions/`: tanke Total.js `NEWACTION()` prilagoditve; sprejmejo vhod, pokličejo storitev in oblikujejo odziv.
- `definitions/routes.js`: vseh 21 CRUD in read-only `ROUTE()` definicij ter pripeti middleware; statične poti so pred dinamičnimi `{id}` potmi.
- `definitions/dependencies.js`: composition root; enkrat sestavi strategijo, factory, repozitorije, event bus, listenerje in storitve.
- `repositories/`: Repository pattern izolira ves `fs/promises`. `BaseJsonRepository` ponuja `findAll`, `findById`, `create`, `update`, `delete`, `exists`, zaporedno vrsto mutacij in atomaren zapis temp-datoteka → rename. Konkretni repozitoriji določijo tip. Cena je dodaten abstrakcijski sloj.
- `services/`: Service Layer hrani relacijska in brisalna poslovna pravila ter dogodke, zato so akcije kratke in storitve enostavno testiramo z in-memory repozitoriji. Cena je več modulov in ročno ožičenje.
- `repositories/RepositoryFactory.js` in `factories/ServiceFactory.js`: Factory izbira konkretni repozitorij, predpomni eno instanco na entiteto ter sestavi storitve. Odpravi ustvarjanje odvisnosti na vsako zahtevo, a uvaja centralni katalog tipov.
- `strategies/`: Strategy loči generiranje ID. `SequentialIdStrategy` izvaja `max(id) + 1` in je vbrizgan v repozitorije; druga strategija ne bi spremenila akcij ali storitev. Cena je majhen vmesni razred.
- `events/`: Observer/Event-driven pristop. Storitve po uspešnem zapisu oddajo devet zahtevanih dogodkov; audit subscriber jih asinhrono zapisuje v `logs/audit.log`. Napaka listenerja ne razveljavi CRUD operacije. Cena je eventualna in posredna izvedba audita.
- `middleware/`: Request ID prevzame `x-request-id` ali ustvari UUID ter ga doda v glavo in telo; logger zabeleži metodo, pot, začetek, status in trajanje; JSON middleware preveri Content-Type in objektno telo. `errorBoundary` centralno pretvori domenske napake. Cena je zahtevan vrstni red middleware.
- `schemas/`: ločena create/update validacija zavrača neznana polja, preveri tipe, email, leto in ISO datum. Strukturna validacija ostaja ločena od relacij v storitvah. Pri ustvarjanju note se `createdAt` privzeto ustvari.
- `errors/`: `AppError`, `ValidationError`, `NotFoundError`, `ConflictError` in `DataAccessError` nosijo HTTP status in stabilno kodo.
- `tests/`: unit testi uporabljajo in-memory ali začasne repozitorije; integracijski test zažene Total.js na ločenih datotekah in preveri CRUD, relacije, ovojnice, request ID, audit ter napake.

V BEFORE so akcije neposredno brale datoteke, ustvarjale ID-je, preverjale relacije in lokalno lovile napake. AFTER isto vedenje porazdeli po namenskih slojih. Rezultat je več datotek in nekaj sestavne kompleksnosti, v zameno pa manj podvajanja, zamenljive tehnične komponente, dosledni odzivi in izolirano testiranje.

## Postman in merjenje

`postman-requests.json` vsebuje vseh 15 CRUD zahtev, šest novih read-only endpointov ter zahtevane primere napak; `baseUrl` je `http://localhost:8000/api`. Za primerjalno merjenje je še vedno neposredno uporaben `GET /api/customers`; ni umetnih zakasnitev.
