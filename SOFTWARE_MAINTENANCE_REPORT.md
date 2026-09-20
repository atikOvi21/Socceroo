# Software Maintenance Activities Report

## Socceroo Football Field Booking API

- **Course:** Software Maintenance
- **Student:** [Your name]
- **Student ID:** [Your student ID]
- **Submission date:** [Submission date]
- **Repository:** [GitHub repository URL]

---

## Executive summary

This report presents a simulated overall software maintenance exercise on the
Socceroo football-field booking API. The assignment required maintenance work
from four categories: corrective, adaptive, preventive, and perfective
maintenance. Within every category, the work was examined through program
comprehension, change management, impact analysis, reverse engineering, and
refactoring.

The maintenance work corrected startup, field-price, authentication-route,
image-route, and database-configuration defects; adapted OAuth, CORS, and cookie
configuration for different deployment hosts; prevented invalid and duplicate
bookings through centralized validation and a database index; and improved the
accuracy and usability of monthly JSON and PDF reports.

Verification included ESLint, Node syntax validation, Git diff inspection,
SonarQube, Clinic.js Doctor and Flame, Autocannon, VS Code debugging, MongoDB
index inspection, focused regression scripts, and HTTP API checks. The final
SonarQube Quality Gate passed, all 19 maintained JavaScript files passed syntax
validation, and ESLint reported zero errors in the final maintained source.

> **Screenshot guidance:** Do not manufacture missing screenshots. When a
> screenshot is unavailable, retain the command, result table, commit hash, or
> code excerpt supplied in this report as evidence.

---

## 1. Project overview

Socceroo is a Node.js and Express API that uses MongoDB through Mongoose. Its
main responsibilities include user authentication, football-field management,
image uploads, time-slot creation, field booking, and management-report
generation. Important project areas are:

| Area | Files |
| --- | --- |
| Application startup and middleware | `app.js`, `package.json` |
| Authentication | `routes/authRoutes.js`, `config/passport.js`, `middleware/auth.middleware.js` |
| Field management | `routes/fieldRoutes.js`, `controllers/fieldController.js`, `models/Field.js` |
| Booking management | `routes/bookingRoutes.js`, `controllers/bookingController.js`, `models/Booking.js` |
| Reporting | `routes/reportRoutes.js`, `controllers/reportServiceController.js` |
| Database configuration | `config/db.js` |

The work was performed on the `maintenance-cases` Git branch. Focused commits
were created for each maintenance category so that changes could be reviewed and
traced independently.

### Maintenance methodology

The following cycle was applied throughout the exercise:

1. Inspect the existing source and runtime behavior.
2. Reconstruct the relevant request and data flow.
3. Identify the defect, environmental assumption, future risk, or quality gap.
4. Estimate which routes, controllers, models, clients, and data could be
   affected.
5. Implement a focused change.
6. Verify the result using static analysis, dynamic analysis, or API checks.
7. Preserve the change in a focused Git commit.

> **Figure 1 - Project structure or module graph (recommended):** Insert a
> screenshot of the important folders or `module-graph.svg` here. If unavailable,
> the project-area table above is sufficient.

---

## 2. Corrective maintenance

### 2.1 Objective

Corrective maintenance was performed to repair existing defects that caused
incorrect startup behavior, discarded field prices, ambiguous authentication
routing, broken image lookup, and obsolete MongoDB warnings.

### 2.2 Program comprehension

The startup flow was traced from the `start` script in `package.json` to
`app.js`. The field-management flow was traced from
`routes/fieldRoutes.js` to `controllers/fieldController.js` and finally to
`models/Field.js`. This comparison revealed that the controller received
`pricePerHour`, but the schema stored `slotPrice`. Because Mongoose only retains
schema-defined properties, the submitted price could be discarded.

Authentication routes were inspected in `routes/authRoutes.js`, where duplicate
Facebook callback behavior had previously existed. Image behavior was traced
between `routes/fieldRoutes.js` and `controllers/fieldController.js`, revealing
that the controller required `fieldId` but the old image-read route did not
provide it. Inspection of `config/db.js` also found deprecated Mongoose options.

### 2.3 Change management

The corrective work was isolated in focused Git history. The major corrective
commit was:

```text
95148ac fix: correct startup auth image and field defects
```

The maintained behavior includes:

- `npm start` launches `node app.js`.
- Field creation and update use `slotPrice` consistently.
- Only one Facebook callback route remains.
- Image operations use `POST /fields/:fieldId/upload-images` and
  `GET /fields/:fieldId/images`.
- MongoDB connects with `mongoose.connect(process.env.MONGO_URI)` without
  obsolete driver flags.

Secrets in `.env` were kept outside Git. Generated Clinic, coverage, upload,
report, and scanner files were also excluded.

### 2.4 Impact analysis

The field-price correction affects API clients because they must submit
`slotPrice` instead of `pricePerHour`. This change makes the API contract match
the database schema. The image-route correction affects clients using the old
`/fields/multiple-images` path; they must now provide a specific field ID.
Removing duplicate authentication routing reduces ambiguity without changing
the intended OAuth callback. Removing deprecated MongoDB options eliminates
warnings while retaining behavior supported by the installed Mongoose version.

### 2.5 Reverse engineering

The field flow was reconstructed as:

```text
HTTP request
  -> field route
  -> authentication/upload middleware
  -> field controller
  -> Field model
  -> MongoDB
```

The endpoint table printed during startup was used to confirm the final routes.
Comparing request properties with schema properties identified the price defect,
while comparing route parameters with controller parameters identified the image
lookup defect.

### 2.6 Refactoring

One domain name, `slotPrice`, now represents field price throughout the relevant
controller and model. The route and controller share the same `fieldId` image
parameter. Database connection code was simplified by removing unnecessary
configuration. These changes reduced inconsistency and made the corrected code
easier to understand.

### 2.7 Verification and evidence

- Node syntax checks passed.
- ESLint passed for the corrected files.
- The server launched through `npm start` and connected to MongoDB.
- The endpoint table contained one `/facebook/callback`.
- Field requests now accept and return `slotPrice`.

> **Figure 2 - Corrective before/after source (recommended):** Insert a split
> screenshot of `git show 95148ac`, highlighting `pricePerHour` changing to
> `slotPrice` and the MongoDB options being removed.

> **Figure 3 - Corrective runtime evidence (recommended):** Insert your Postman
> response showing `slotPrice: 50`. If this screenshot is unavailable, include
> the request body and state that syntax, model alignment, and source diff were
> used as evidence.

---

## 3. Adaptive maintenance

### 3.1 Objective

Adaptive maintenance was performed to allow the same application to operate on
localhost and on a deployed HTTPS host without editing source code. OAuth
callbacks, browser CORS access, and authentication-cookie behavior were made
environment-dependent.

### 3.2 Program comprehension

The OAuth request flow was followed from `routes/authRoutes.js` into the
Facebook and Google strategies in `config/passport.js`. CORS behavior was found
in `app.js`, and authentication-cookie creation was found in the Facebook
callback. These files contained assumptions about hostnames and security modes
that differ between local HTTP development and a deployed HTTPS environment.

### 3.3 Change management

The adaptive work was recorded in:

```text
ab1c834 feat: adapt authentication configuration for deployment
```

`.env.example` documents the required variables without storing secrets:

```text
APP_BASE_URL
CLIENT_ORIGIN
COOKIE_SECURE
MONGO_URI
JWT_SECRET
FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

The real `.env` remained ignored. Deployment now requires environment changes
rather than edits to `app.js`, `config/passport.js`, or authentication routes.

### 3.4 Impact analysis

`CLIENT_ORIGIN` restricts browser access to the configured frontend, while
`credentials: true` permits cookie-based authentication. When
`COOKIE_SECURE=true`, the authentication cookie uses `secure: true` and
`sameSite: "none"`; therefore, the deployed environment must use HTTPS. Local
HTTP development uses `COOKIE_SECURE=false` and `sameSite: "lax"`. OAuth provider
settings must register callback URLs matching `APP_BASE_URL` exactly.

### 3.5 Reverse engineering

The OAuth flow was reconstructed as:

```text
Browser
  -> /facebook or /google
  -> external OAuth provider
  -> configured callback URL
  -> Passport strategy
  -> JWT/authentication cookie
  -> dashboard
```

This reconstruction identified every environment-dependent value and allowed it
to be externalized without changing the authentication algorithm.

### 3.6 Refactoring

`config/passport.js` now derives both callback URLs from a single `baseUrl`.
`app.js` centralizes the permitted frontend origin in its CORS configuration.
`routes/authRoutes.js` derives both `secure` and `sameSite` from
`COOKIE_SECURE`. While verifying these files, unused imports and an undefined
graceful-shutdown `server` reference were also corrected.

### 3.7 Verification and evidence

Local configuration produced:

```text
http://localhost:5001/facebook/callback
http://localhost:5001/google/callback
```

Simulated production configuration produced:

```text
https://your-deployed-domain.example/facebook/callback
https://your-deployed-domain.example/google/callback
```

The final CORS preflight returned status 204 with:

```text
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

> **Figure 4 - Adaptive configuration evidence (recommended):** Insert one
> terminal screenshot containing the local and simulated-production callback
> output. This single image is enough; separate screenshots are unnecessary.

---

## 4. Preventive maintenance

### 4.1 Objective

Preventive maintenance was performed to reduce the likelihood of future booking
defects. The changes removed duplicate routes, centralized request validation,
reduced sequential database waiting, and protected the database against
concurrent duplicate bookings.

### 4.2 Program comprehension

Booking creation was traced from `routes/bookingRoutes.js` through
`controllers/bookingController.js` to `models/Booking.js`. The field and slot
dependencies were traced to `models/Field.js` and `models/Slot.js`. Two routes
performed the same creation action, input validation was not centralized, and a
controller-level `findOne()` check was the only duplicate protection.

The existing check was vulnerable to a race condition: two requests could both
find no booking before either inserted its record.

### 4.3 Change management

The preventive work was recorded in:

```text
ab9a9eb refactor: centralize booking validation and prevent duplicates
```

`POST /bookings` was retained as the canonical creation endpoint, while
`POST /bookings/book-field` was removed. A new middleware file,
`middleware/bookingValidation.middleware.js`, was added. Existing booking data
was inspected before applying the unique index; the configured database
contained zero bookings and no duplicate records requiring deletion.

### 4.4 Impact analysis

Clients must use `POST /bookings`, submit dates in `YYYY-MM-DD`, and submit times
in zero-padded `HH:mm` format. Invalid identifiers, impossible dates, and
reversed times return HTTP 400. Duplicate bookings return HTTP 409. The compound
unique index prevents simultaneous requests from creating the same field, slot,
and date combination.

Before creating the index, existing duplicate data must be inspected or cleaned;
otherwise, MongoDB cannot build the constraint. This migration risk was checked
before index creation.

### 4.5 Reverse engineering

The maintained booking flow was reconstructed as:

```text
Authentication
  -> centralized request validation
  -> parallel field and slot lookup
  -> friendly duplicate lookup
  -> booking insertion
  -> database unique-index enforcement
```

This reconstruction separated route, validation, business, and persistence
responsibilities and identified that field and slot queries were independent.

### 4.6 Refactoring

Required-field, ObjectId, date, and time checks were extracted into booking
validation middleware. Booking dates are normalized to UTC midnight.
`Field.findById()` and `Slot.findOne()` run through `Promise.all()`. Duplicate
MongoDB error `11000` is handled correctly in the controller `catch` block. The
unnecessary `Field` import was removed from `models/Booking.js`.

The database constraint is:

```text
field_1_slot_1_bookingDate_1
field + slot + bookingDate
unique: true
```

### 4.7 Verification and evidence

| Regression case | Result |
| --- | --- |
| Valid booking input | Accepted and normalized to UTC |
| Invalid field ID | 400 |
| Impossible date | 400 |
| Start time after end time | 400 |
| Duplicate database key | 409 |

> **Figure 5 - Preventive evidence (recommended):** Insert either a Postman 400
> validation response or the MongoDB unique-index output. If only one screenshot
> is available, prefer the duplicate 409 response because it demonstrates both
> application and database protection.

---

## 5. Perfective maintenance

### 5.1 Objective

Perfective maintenance was performed to improve the accuracy, usefulness, error
feedback, security, and PDF presentation of monthly booking reports.

### 5.2 Program comprehension

The report flow was traced from `routes/reportRoutes.js` into
`controllers/reportServiceController.js`, then through populated booking, field,
and slot data. The old weekly loop also updated monthly totals and booking
counts. As a result, one booking could be counted once for every weekly
iteration. The PDF expected `weeklyProfit`, while report generation returned
`weeklyProfits`, and the route could request download before the file stream had
finished.

### 5.3 Change management

The perfective work was recorded in:

```text
c14af8e feat: improve report accuracy validation and PDF output
```

Calculation and PDF changes were contained in
`controllers/reportServiceController.js` and `routes/reportRoutes.js`.
Generated PDFs were excluded from Git. Existing response concepts were retained
while useful fields were added.

### 5.4 Impact analysis

Each valid booking now contributes to monthly revenue exactly once. UTC and a
half-open monthly range prevent timezone/month-boundary errors. Invalid periods
return HTTP 400 instead of a misleading HTTP 500. The download route now
requires authentication, so clients must send their existing token or cookie.
Consumers also receive additional response fields and must tolerate the expanded
JSON object.

### 5.5 Reverse engineering

The reporting process was reconstructed as:

```text
Validate month/year
  -> query bookings for the UTC month
  -> remove invalid populated records
  -> calculate monthly aggregates once
  -> calculate each weekly aggregate
  -> build JSON response
  -> generate and finish PDF stream
  -> download completed file
```

The reconstruction also showed that populated bookings already contain the field
name, so a second `Field.findById()` query was unnecessary.

### 5.6 Refactoring

Period validation is centralized in `validateReportPeriod()`. Maps store field
and slot counts once. Weekly iteration calculates only weekly revenue. The
response now includes:

```text
month
bookingCount
monthlyProfit
averageRevenuePerBooking
weeklyProfits
topField
topSlotTime
```

`exportReportToPDF()` creates the reports directory, prints every weekly result,
and resolves after the output stream emits `finish`. Route error handling is
centralized in `sendReportError()`.

### 5.7 Verification and evidence

A deterministic three-booking regression case used prices 50, 50, and 75:

```text
bookingCount: 3
monthlyProfit: 175
weeklyTotal: 175
averageRevenuePerBooking: 58.33
topField: Alpha (2 bookings)
topSlotTime: 09:00-10:00
```

The equality of monthly and weekly totals proves that bookings are no longer
multiplied by weekly iterations. Month 15 produced HTTP 400 metadata. The PDF
stream produced a non-empty file containing monthly, weekly, and top-booking
information.

> **Figure 6 - Perfective JSON evidence (recommended):** Insert the Postman JSON
> report showing `monthlyProfit`, `weeklyProfits`, and `bookingCount`.

> **Figure 7 - Perfective PDF evidence (recommended):** Insert one screenshot of
> the PDF page. If a PDF screenshot is unavailable, retain the deterministic
> output above and mention that stream completion and file size were verified.

---

## 6. Verification and analysis

### 6.1 Final automated checks

| Verification | Final result |
| --- | --- |
| ESLint | 0 errors |
| Node syntax | 19/19 files passed |
| Git whitespace | Passed |
| Application startup | Passed on port 5001 |
| `GET /` | 200 |
| `GET /fields` | 200 |
| `GET /bookings/slots` | 200 |
| Protected route without token | 401 |
| CORS preflight | 204 with configured origin and credentials |
| MongoDB unique booking index | Active |

### 6.2 Static analysis

The following static-analysis methods were used:

- ESLint for JavaScript correctness and code-quality rules.
- SonarQube for maintainability, reliability, security, duplication, and
  cognitive-complexity analysis.
- JSCPD for duplication analysis.
- Madge for dependency/module visualization.

The final SonarQube result was:

| Metric | Result |
| --- | ---: |
| Quality Gate | Passed |
| Bugs | 0 |
| Vulnerabilities | 1 |
| Code smells | 9 |
| Security hotspots | 0 |
| Duplicated lines | 0.0% |
| Cognitive complexity | 89 |
| Source lines | 954 |

The reported vulnerability asks for review of whether the 20 MB image-upload
limit in `middleware/image.middleware.js` is safe. It should be documented as an
open finding unless the limit is changed and reanalyzed.

The 0.0% SonarQube coverage value was caused by the absence of an imported valid
LCOV report and was not treated as proof that every line is uncovered.

> **Figure 8 - SonarQube dashboard (strongly recommended):** Insert one
> screenshot showing the passed Quality Gate and issue totals. This is the most
> useful single static-analysis screenshot.

### 6.3 Dynamic analysis

The following dynamic methods were used:

- Clinic Doctor for runtime health and event-loop analysis.
- Clinic Flame for CPU call-path analysis.
- Autocannon for concurrent HTTP load.
- VS Code breakpoints for variables and execution flow.
- Postman for API reproduction and functional verification.

Doctor detected potential event-loop blocking and recommended Flame analysis.
During a `/fields` load test, the application processed approximately 16,000
requests in 10 seconds with average latency around 5.94 ms. Bubbleprof was also
attempted, but its deprecated async-hook mechanism did not produce a complete
trace on Node.js 22; this limitation was documented rather than hidden.

> **Figure 9 - Clinic analysis (optional):** Insert either the Doctor
> recommendation or Flame graph. One Clinic screenshot is enough if space is
> limited.

> **Figure 10 - VS Code/Postman (optional):** Insert one breakpoint screenshot or
> one representative request. Do not include multiple nearly identical images.

---

## 7. Screenshot plan when evidence is limited

Screenshots support the report but are not required for every paragraph. A
compact submission can use the following six images:

1. Corrective `git show 95148ac` or the `slotPrice` Postman response.
2. Local and deployed OAuth callback terminal output.
3. Booking duplicate/validation response or MongoDB unique index.
4. Improved JSON report or generated PDF.
5. SonarQube Quality Gate dashboard.
6. Clinic Doctor or Flame result.

If fewer screenshots are available, prioritize them in this order:

1. SonarQube dashboard.
2. Successful `slotPrice` Postman response.
3. Booking validation or duplicate response.
4. Improved report response/PDF.
5. Clinic result.

For missing screenshots, use one of these alternatives:

- A `git show <commit>` excerpt proving the before/after source change.
- A command and its recorded result table.
- The exact endpoint, request body, expected status, and observed status.
- The relevant commit hash and file list.
- A short limitation statement explaining why visual evidence is unavailable.

Each screenshot should have a numbered caption, for example:

```text
Figure 3: POST /fields/create response after corrective maintenance, showing
slotPrice persisted as 50.
```

Do not include secrets, JWTs, OAuth tokens, MongoDB credentials, or the contents
of `.env` in screenshots.

---

## 8. Limitations and remaining work

- The repository did not contain a repeatable automated unit/integration test
  suite; focused executable regression checks and API checks were used instead.
- SonarQube did not receive valid LCOV coverage data.
- Bubbleprof was incompatible with the current Node.js 22 environment.
- The image upload-size warning remains open for deployment-specific review.
- Full OAuth login depends on valid external provider configuration and cannot be
  proven by callback derivation alone.
- The generated PDF should be opened locally to confirm final visual appearance
  because automated PDF rendering was unavailable in the verification
  environment.

---

## 9. Conclusion

The exercise covered all four required software maintenance categories and all
five required tasks within each category. Corrective work repaired observed
defects. Adaptive work removed deployment-host assumptions. Preventive work
reduced future booking defects and protected database integrity. Perfective work
improved report accuracy, validation, security, and presentation.

Program comprehension and reverse engineering established how routes,
middleware, controllers, models, MongoDB, OAuth, and PDF generation interact.
Impact analysis identified client, data, security, and deployment consequences.
Change management preserved focused work through Git commits. Refactoring
reduced inconsistency and clarified responsibilities. Static and dynamic
verification provided evidence that the maintained system behaves as intended.

---

## Appendix A: Maintenance commit evidence

| Category | Commit |
| --- | --- |
| Corrective | `95148ac fix: correct startup auth image and field defects` |
| Adaptive | `ab1c834 feat: adapt authentication configuration for deployment` |
| Preventive | `ab9a9eb refactor: centralize booking validation and prevent duplicates` |
| Perfective | `c14af8e feat: improve report accuracy validation and PDF output` |
| SonarQube setup | `1710989 chore: configure SonarQube static analysis` |
| Step 9 documentation | `6202c40 docs: document maintenance task categories` |
| Final verification | `bd97d0c docs: record final maintenance verification` |

Useful evidence commands:

```powershell
git show 95148ac
git show ab1c834
git show ab9a9eb
git show c14af8e
git log --oneline
```

## Appendix B: Important verification commands

```powershell
# Start application
npm.cmd start

# Lint maintained JavaScript
.\node_modules\.bin\eslint.cmd app.js config controllers middleware models routes scripts

# Run SonarQube analysis after setting a fresh token
$env:SONAR_HOST_URL="http://localhost:9000"
$env:SONAR_TOKEN="<token>"
npx.cmd --yes @sonar/scan
```

Sensitive tokens must be supplied through environment variables and must never
be committed or displayed in report screenshots.
