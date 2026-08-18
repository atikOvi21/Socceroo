# Step 10: Final Verification

Verification was completed on 2026-08-18 on the `maintenance-cases` branch.
The repository does not contain an automated test suite, so verification uses
linting, syntax checks, focused executable regression checks, safe HTTP API
checks, database inspection, and static/dynamic analysis evidence.

## 1. Automated verification summary

| Check | Scope | Result |
| --- | --- | --- |
| ESLint | `app.js`, `config`, `controllers`, `middleware`, `models`, `routes`, `scripts` | Passed with 0 errors |
| Node syntax | All 19 maintained JavaScript files | 19 passed, 0 failed |
| Git whitespace | `git diff --check` | Passed |
| Application startup | `node app.js` through the configured start path | Listening on port 5001 |
| Root API | `GET /` | 200, `Hello World` |
| Field API | `GET /fields` | 200, response contains an array |
| Slot API | `GET /bookings/slots` | 200, response contains an array |
| Authentication | `GET /protected` without a token | 401 |
| CORS preflight | Origin `http://localhost:3000` | 204, correct origin, credentials allowed |
| Booking index | MongoDB `bookings` indexes | Unique compound index active |
| SonarQube | 19 files and 954 source lines | Quality Gate passed |

The verified MongoDB index is:

```text
field_1_slot_1_bookingDate_1
key: field + slot + bookingDate
unique: true
```

The configured database contained zero booking records during final
verification, so no production-like data was altered.

## 2. Focused regression checks

### Corrective maintenance

- `package.json` resolves `npm start` to `node app.js`.
- The application started and connected to MongoDB without deprecated connection
  options.
- `controllers/fieldController.js` uses `slotPrice`, matching
  `models/Field.js`.
- The endpoint list contains one `/facebook/callback` route.
- Image operations use `POST /fields/:fieldId/upload-images` and
  `GET /fields/:fieldId/images`.

### Adaptive maintenance

Local callback verification produced:

```text
http://localhost:5001/facebook/callback
http://localhost:5001/google/callback
```

With a simulated deployed `APP_BASE_URL`, the same source produced:

```text
https://your-deployed-domain.example/facebook/callback
https://your-deployed-domain.example/google/callback
```

The local CORS preflight returned:

```text
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

### Preventive maintenance

The centralized booking middleware produced these results:

| Case | Result |
| --- | --- |
| Valid ObjectId, date, and time range | Accepted; date normalized to `2026-08-18T00:00:00.000Z` |
| Invalid ObjectId | 400, `fieldId is invalid` |
| Impossible date `2026-02-31` | 400, `bookingDate is invalid` |
| Start time after end time | 400, `startTime must be earlier than endTime` |

The duplicate `/bookings/book-field` route is absent. The controller retains a
friendly duplicate lookup, handles MongoDB error `11000` as 409, and the unique
database index provides final concurrency protection.

### Perfective maintenance

A deterministic report test used three bookings priced at 50, 50, and 75. It
produced:

```text
bookingCount: 3
monthlyProfit: 175
weeklyTotal: 175
averageRevenuePerBooking: 58.333333333333336
topField: Alpha (2 bookings)
topSlotTime: 09:00-10:00
```

The equality of weekly total and monthly profit confirms that bookings are no
longer multiplied by the number of weekly iterations. Month 15 produced status
metadata for HTTP 400. PDF generation resolved after the output stream finished
and produced a non-empty 1,605-byte file containing monthly, weekly, and top
booking information.

## 3. Static and dynamic analysis evidence

### Static analysis

- ESLint: final maintained source passed with no errors.
- SonarQube: Quality Gate passed; 0 bugs, 9 code smells, 1 vulnerability,
  0 security hotspots, 0.0% duplication, and cognitive complexity 89.
- SonarQube configuration and detailed findings are recorded in
  `SONARQUBE_ANALYSIS.md`.
- Madge and JSCPD artifacts provide module/dependency and duplication evidence.

The SonarQube coverage value was 0.0% because no valid LCOV data was imported;
it is not presented as evidence that every line is uncovered.

### Dynamic analysis

- Clinic Doctor measured runtime behavior and identified potential event-loop
  blocking for further investigation.
- Clinic Flame was used to inspect CPU call paths.
- Autocannon exercised `GET /fields` under concurrent load.
- VS Code breakpoints were used to inspect request data and controller flow.
- Postman was used to reproduce and verify API behavior.

## 4. Manual Postman walkthrough

Use this walkthrough to capture screenshots for the submitted report. Start the
server with:

```powershell
npm.cmd start
```

### Field-price correction

Send an authenticated request:

```http
POST http://localhost:5001/fields/create
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "fieldName": "Maintenance Verification Field",
  "location": "Gazipur",
  "slotPrice": 50
}
```

Capture the 201 response showing `slotPrice: 50`, then request:

```http
GET http://localhost:5001/fields/<returned-field-id>
GET http://localhost:5001/fields/<returned-field-id>/images
```

### Booking validation and duplicate prevention

Use a field and slot that exist in the database:

```http
POST http://localhost:5001/bookings
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "fieldId": "<field-id>",
  "bookingDate": "2026-08-20",
  "startTime": "09:00",
  "endTime": "10:00"
}
```

Capture the successful response. Repeat the identical request and capture the
409 `Slot already booked` response. Also change `startTime` to `11:00` and
`endTime` to `10:00` to capture the 400 validation response.

### Report validation and output

```http
POST http://localhost:5001/reports/generate
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "month": 8,
  "year": 2026
}
```

Capture the response fields `bookingCount`, `monthlyProfit`,
`averageRevenuePerBooking`, `weeklyProfits`, `topField`, and `topSlotTime`.
Repeat with month 15 and capture the 400 response. Finally, download the PDF:

```http
GET http://localhost:5001/reports/download?month=8&year=2026
Authorization: Bearer <token>
```

Open the PDF and confirm that every weekly range is visible and no text is
clipped or overlapping.

## 5. Before-and-after evidence checklist

Capture or include the following evidence in the final submission:

1. `git show 95148ac` for corrective changes.
2. `git show ab1c834` for adaptive changes.
3. `git show ab9a9eb` for preventive changes.
4. `git show c14af8e` for perfective changes.
5. Successful ESLint and syntax output.
6. Application endpoint table and successful startup output.
7. Postman before/after field-price and booking-validation responses.
8. Local and simulated-production callback values.
9. MongoDB unique-index output.
10. SonarQube Quality Gate and issue summary screenshots.
11. Clinic Doctor and Flame screenshots.
12. JSON report and completed PDF screenshots.

The uncommitted `controllers/fieldController.js` change should be reviewed and
either committed or discarded before capturing final Git evidence, because
SonarQube reported missing blame information for that modified file.
