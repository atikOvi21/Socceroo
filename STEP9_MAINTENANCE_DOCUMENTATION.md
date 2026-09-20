# Step 9: Maintenance Task Documentation

This document records the four maintenance cases completed for the Socceroo
Node.js API. Each case is described using the five required maintenance tasks:
program comprehension, change management, impact analysis, reverse
engineering, and refactoring.

## 1. Corrective maintenance

**Objective:** Correct defects in application startup, authentication routing,
field pricing, image lookup, and MongoDB initialization.

### Program comprehension

The startup flow was traced from the `start` script in `package.json` to
`app.js`. Field requests were followed from `routes/fieldRoutes.js` through
`controllers/fieldController.js` to `models/Field.js`. This revealed that the
controller accepted `pricePerHour`, while the schema stored `slotPrice`, so the
submitted price could be discarded. Inspection of `routes/authRoutes.js`
identified duplicate Facebook callback handling, and inspection of
`config/db.js` found Mongoose options that are obsolete with the installed
driver.

### Change management

The work was isolated on the `maintenance-cases` branch and preserved through
the checkpoint commit `97a744b` and corrective commit `95148ac`. The canonical
startup command is now `node app.js`; field create/update operations use
`slotPrice`; obsolete MongoDB options were removed; and the image routes were
made explicit as `POST /fields/:fieldId/upload-images` and
`GET /fields/:fieldId/images`. The `.env` file remained untracked.

### Impact analysis

Changing the price property affects clients that previously sent
`pricePerHour`; they must now send `slotPrice`, matching `models/Field.js`.
Changing the image lookup route affects callers of the old
`/fields/multiple-images` endpoint. Removing duplicate OAuth routing avoids
ambiguous callback execution. Removing `useNewUrlParser` and
`useUnifiedTopology` removes warnings without changing connection behavior in
the current Mongoose version.

### Reverse engineering

The observed API architecture was reconstructed as
`request -> Express route -> authentication/upload middleware -> controller ->
Mongoose model -> MongoDB`. Comparing request properties with schema properties
exposed the field-price mismatch. The endpoint table produced by `app.js` was
used to verify one Facebook callback and the corrected image paths.

### Refactoring

Field pricing was standardized on one domain term, `slotPrice`, across create,
update, and schema operations. The image lookup uses the same `fieldId`
parameter name in route and controller. Redundant connection configuration was
removed, leaving `mongoose.connect(process.env.MONGO_URI)` as the single
connection operation.

**Verification evidence:** successful syntax and ESLint checks, successful
MongoDB startup, one `/facebook/callback` in the endpoint list, and commit
`95148ac` (`fix: correct startup auth image and field defects`).

## 2. Adaptive maintenance

**Objective:** Adapt authentication and browser communication so the same
application can run on localhost or a deployed HTTPS host through environment
configuration only.

### Program comprehension

The OAuth flow was traced from `routes/authRoutes.js` to the Facebook and Google
strategies in `config/passport.js`. Browser access was traced through the CORS
middleware in `app.js`, while JWT persistence was traced to the `auth_token`
cookie created by the Facebook callback. This showed three hardcoded environment
assumptions: relative OAuth callbacks, unrestricted/default CORS behavior, and a
cookie policy tied only to `NODE_ENV`.

### Change management

Deployment settings were externalized through `APP_BASE_URL`, `CLIENT_ORIGIN`,
and `COOKIE_SECURE`. Safe placeholders were added to `.env.example`, while the
real `.env` remained ignored and untracked. The changes were recorded in commit
`ab1c834`. Deployment now requires configuration changes rather than source-code
edits.

### Impact analysis

`CLIENT_ORIGIN` restricts browser CORS access to the configured frontend and
`credentials: true` permits authentication cookies. When `COOKIE_SECURE=true`,
cookies use `secure: true` and `sameSite: "none"`, which requires HTTPS. Local
HTTP development therefore uses `COOKIE_SECURE=false` and `sameSite: "lax"`.
OAuth provider consoles must register callback URLs that exactly match the
configured `APP_BASE_URL`.

### Reverse engineering

The callback lifecycle was reconstructed as
`browser -> /facebook or /google -> provider -> configured callback -> Passport
strategy -> JWT/cookie -> /dashboard`. This made it possible to identify every
host-dependent value and move it to environment configuration without changing
the authentication algorithm.

### Refactoring

`config/passport.js` now derives both callback URLs from one `baseUrl` value.
`app.js` centralizes the allowed frontend origin in the CORS configuration, and
`routes/authRoutes.js` derives both cookie flags from `COOKIE_SECURE`. An
undefined `server` reference in graceful shutdown and unused imports found by
ESLint were also removed while working in these files.

**Verification evidence:** local callbacks resolved to
`http://localhost:5001/...`; simulated production callbacks resolved to
`https://your-deployed-domain.example/...`; production cookie simulation
returned `secure=true` and `sameSite=none`; syntax and ESLint passed; commit
`ab1c834` (`feat: adapt authentication configuration for deployment`).

## 3. Preventive maintenance

**Objective:** Reduce future booking defects by removing route duplication,
centralizing validation, reducing sequential database waiting, and enforcing
uniqueness at database level.

### Program comprehension

Booking creation was traced from `routes/bookingRoutes.js` through
`controllers/bookingController.js` to `models/Booking.js`, with field and slot
lookups in `models/Field.js` and `models/Slot.js`. Two routes invoked the same
controller, validation was mixed into persistence logic, and a `findOne()` check
was the only duplicate protection. That check is vulnerable to two concurrent
requests passing before either inserts a record.

### Change management

`POST /bookings` was retained as the canonical creation endpoint and
`POST /bookings/book-field` was removed. A new
`middleware/bookingValidation.middleware.js` was introduced, and the database
index change was recorded with its controller and route changes in commit
`ab9a9eb`. Existing booking data was inspected before index creation; the
configured database contained zero booking documents and therefore no duplicate
records required deletion.

### Impact analysis

Clients must use `POST /bookings` and supply `bookingDate` as `YYYY-MM-DD` plus
zero-padded `HH:mm` times. Invalid IDs, dates, and time ranges now return 400.
Duplicate bookings return 409. The unique compound index on
`field + slot + bookingDate` prevents race-condition duplicates, but it also
means any future migration must remove conflicting records before index
creation.

### Reverse engineering

The booking transaction was reconstructed as
`authentication -> request validation -> parallel field/slot lookup -> friendly
duplicate lookup -> booking insert -> unique-index enforcement`. This separated
validation responsibilities from controller responsibilities and identified
which queries were independent.

### Refactoring

Required-field, ObjectId, date, and time checks were extracted into
`middleware/bookingValidation.middleware.js`. The middleware normalizes dates to
UTC midnight. `Field.findById()` and `Slot.findOne()` now run with
`Promise.all()`. The controller handles MongoDB duplicate error `11000` in its
`catch` block, and the unnecessary `Field` import was removed from
`models/Booking.js`.

**Verification evidence:** middleware tests accepted a valid request and
rejected invalid dates/times; ESLint and syntax passed; MongoDB confirmed the
unique index `field_1_slot_1_bookingDate_1`; commit `ab9a9eb` (`refactor:
centralize booking validation and prevent duplicates`).

## 4. Perfective maintenance

**Objective:** Improve the accuracy, usefulness, validation, and PDF output of
monthly booking reports.

### Program comprehension

The report flow was traced from `routes/reportRoutes.js` to
`controllers/reportServiceController.js`, then to the populated `Booking`,
`Field`, and `Slot` data. The original weekly loop also updated monthly totals
and booking counts, causing each booking to be counted once per displayed week.
The PDF expected `weeklyProfit`, while report generation returned
`weeklyProfits`, and download could begin before the output stream finished.

### Change management

The calculation and PDF changes were kept within
`controllers/reportServiceController.js` and `routes/reportRoutes.js`, with
generated PDFs excluded through `.gitignore`. The focused implementation was
recorded in commit `c14af8e`. The JSON response retained existing report concepts
while adding booking count and average revenue, so consumers receive more useful
information without a separate endpoint.

### Impact analysis

Monthly revenue now counts every valid booking exactly once. Reports use UTC
month boundaries and a half-open range, preventing bookings near timezone/month
boundaries from entering the wrong report. Invalid month/year input returns 400
instead of a misleading 500. PDF download now requires authentication, so
clients must include their existing bearer token or authentication cookie.

### Reverse engineering

The calculation was reconstructed into independent stages:
`validate period -> query selected month -> discard invalid populated records ->
calculate monthly aggregates -> calculate weekly aggregates -> construct JSON ->
render PDF`. This revealed that field names were already available through
population, making the second `Field.findById()` query unnecessary.

### Refactoring

Period validation was centralized in `validateReportPeriod()`. Monthly field and
slot counts use maps built once, while the weekly loop calculates weekly revenue
only. The response now includes `bookingCount`, `monthlyProfit`,
`averageRevenuePerBooking`, `weeklyProfits`, `topField`, and `topSlotTime`.
`exportReportToPDF()` creates the reports directory, writes all weekly values,
and resolves only after the stream emits `finish`. Route error handling is
centralized in `sendReportError()`.

**Verification evidence:** a deterministic three-booking case produced booking
count 3, monthly revenue 175, weekly total 175, average revenue 58.33, top field
Alpha, and top slot `09:00-10:00`; invalid month 15 produced status metadata for
400; the PDF completed as a non-empty file; syntax and ESLint passed; commit
`c14af8e` (`feat: improve report accuracy validation and PDF output`).

## Summary

The four cases demonstrate different maintenance intentions on the same system:
corrective work repaired observed defects, adaptive work removed deployment-host
assumptions, preventive work reduced the probability and cost of future booking
defects, and perfective work improved report correctness and user-visible
quality. Git commits, ESLint, SonarQube, API checks, database index inspection,
and dynamic profiling provide traceable evidence for the documented changes.
