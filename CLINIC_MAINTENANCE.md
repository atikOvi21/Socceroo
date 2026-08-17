# Clinic.js Maintenance Check

Clinic.js is used here for dynamic performance analysis of the Node.js API. Run
the checks in a development/test environment, not against production data.

## 1. Doctor: initial diagnosis

On Windows, use the automated command to avoid `Ctrl+C` terminating the
`npm.cmd` wrapper while Clinic is analysing its trace:

```powershell
npm.cmd run clinic:doctor:auto
```

This sends a 10-second, 10-connection workload to `GET /fields`, stops the
profiled server automatically, and saves raw profiling data. Do not press
`Ctrl+C`. Then generate the HTML report in a separate process:

```powershell
npm.cmd run clinic:doctor:report
```

Collection and visualization are separated because Clinic Doctor 9.2.1's
combined pipeline can report `Error: premature close` with Node.js 22 on
Windows even after a successful workload. The raw data remains valid.

For a manual Postman workload, run:

```powershell
npm.cmd run clinic:doctor
```

After the server starts, exercise representative endpoints with Postman. For the
slot creation flow, send several valid and invalid requests to:

```text
POST http://localhost:5001/bookings/slotcreate
Content-Type: application/json
```

```json
{
  "startTime": "09:00",
  "endTime": "10:00"
}
```

Press `Ctrl+C` once the workload is complete, then do not press it again or
answer the Windows `Terminate batch job` prompt until Clinic finishes analysis.
The generated Doctor report is stored under `.clinic`. Inspect CPU usage,
memory usage, event-loop delay, and active handles. Doctor should be the first
check because it indicates which specialized profiler to run next.

## 2. Bubbleprof: asynchronous delays

```powershell
npm.cmd run clinic:bubbleprof:auto
npm.cmd run clinic:bubbleprof:report
```

The first command profiles a controlled 10-second `/fields` workload and saves
raw data. The second command converts the newest Bubbleprof data into HTML in a
separate process. Use this report when Doctor indicates an I/O or asynchronous
delay. Look for slow MongoDB queries, long request chains, and unresolved
asynchronous operations.

## 3. Flame: synchronous CPU work

```powershell
npm.cmd run clinic:flame:auto
npm.cmd run clinic:flame:report
```

The first command profiles the same controlled `/fields` workload; the second
generates the HTML report. Use this when Doctor reports high CPU or event-loop
blocking. Wide flame-graph frames identify functions consuming the most CPU
time. Focus first on wide frames belonging to this project rather than Node.js,
Clinic, MongoDB driver, or other dependencies.

## Opening a generated report

The scripts disable automatic browser opening. Open an existing HTML report
manually, or run a Clinic command without `--open=false` when GUI opening is
desired. Reports and raw profiling data can be large and normally should not be
committed to source control.

## Maintenance record

Record the following for each run:

| Item | Value |
| --- | --- |
| Date and environment | Node version, operating system, local/test database |
| Workload | Endpoints, request count, concurrency, and duration |
| Tool | Doctor, Bubbleprof, or Flame |
| Baseline | CPU, memory, event-loop delay, and response time |
| Finding | Observed bottleneck or abnormal resource use |
| Change | Code/configuration modified to address the finding |
| Verification | Before-and-after measurements using the same workload |

Using identical workloads before and after a change is essential; otherwise the
performance results are not directly comparable.
