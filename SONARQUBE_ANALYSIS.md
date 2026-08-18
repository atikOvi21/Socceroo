# SonarQube Static Analysis

## Configuration

- Analysis date: 2026-08-18
- Project key: `socceroo-maintenance`
- SonarQube server: local Community Build at `http://localhost:9000`
- Quality profile: Sonar way for JavaScript
- Files analyzed: 19
- Source lines analyzed: 954

The analysis configuration is stored in `sonar-project.properties`. Generated
files, dependencies, coverage output, uploads, reports, and profiler data are
excluded. Authentication tokens are supplied through `SONAR_TOKEN` and must not
be committed.

## Baseline result

| Metric | Result |
| --- | ---: |
| Quality Gate | Passed |
| Bugs | 0 |
| Vulnerabilities | 1 |
| Security hotspots | 0 |
| Code smells | 9 |
| Duplicated lines | 0.0% |
| Cognitive complexity | 89 |
| Coverage imported | 0.0% |

Coverage is shown as zero because this scan did not import a valid LCOV report.
This does not mean SonarQube found that every executed line was uncovered.

## Findings

The one major vulnerability is in `middleware/image.middleware.js`. Rule
`javascript:S5693` asks for review of whether the 20 MB upload limit is safe for
the deployment environment.

Nine minor maintainability findings were reported:

- Prefer `node:fs`, `node:path`, and `node:child_process` for built-in modules.
- Replace the cookie extractor's explicit null checks with optional chaining.

For the requested focus files:

- `controllers/reportServiceController.js`: two minor built-in module import
  findings (`fs` and `path`).
- `routes/authRoutes.js`: no issues reported.
- `controllers/fieldController.js`: no issues reported; the scanner warned that
  Git blame data was unavailable because the file had an uncommitted change.

## Re-running the analysis

Set the token only for the current PowerShell session:

```powershell
$env:SONAR_HOST_URL="http://localhost:9000"
$env:SONAR_TOKEN="<new-token>"
npx.cmd --yes @sonar/scan
```

Results are available at:

```text
http://localhost:9000/dashboard?id=socceroo-maintenance
```

After recording the baseline, address justified findings and run the same scan
again to capture before-and-after issue counts.
