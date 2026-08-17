const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const clinicDirectory = path.join(__dirname, "..", ".clinic");
const profileType = process.argv[2] || "doctor";
const supportedProfiles = {
  doctor: ".clinic-doctor",
  bubbleprof: ".clinic-bubbleprof",
  flame: ".clinic-flame",
};

if (!supportedProfiles[profileType]) {
  console.error(`Unsupported Clinic profile type: ${profileType}`);
  process.exit(1);
}

const profileSuffix = supportedProfiles[profileType];

const reports = fs
  .readdirSync(clinicDirectory, { withFileTypes: true })
  .filter(
    (entry) => entry.isDirectory() && entry.name.endsWith(profileSuffix),
  )
  .map((entry) => {
    const reportPath = path.join(clinicDirectory, entry.name);
    return { reportPath, modifiedAt: fs.statSync(reportPath).mtimeMs };
  })
  .sort((a, b) => b.modifiedAt - a.modifiedAt);

if (reports.length === 0) {
  console.error(`No raw Clinic ${profileType} report was found in .clinic.`);
  process.exit(1);
}

const clinicCli = require.resolve("clinic/bin.js");
const latestReport = reports[0].reportPath;

console.log(`Visualizing ${latestReport}`);

const result = spawnSync(
  process.execPath,
  [clinicCli, profileType, "--open=false", "--visualize-only", latestReport],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
